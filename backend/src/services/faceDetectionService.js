const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const pico = require('./pico');

// Load and unpack the binary cascade once on startup
const cascadePath = path.join(__dirname, 'facefinder.bin');
let facefinder = null;

try {
  if (fs.existsSync(cascadePath)) {
    const bytes = new Int8Array(fs.readFileSync(cascadePath));
    facefinder = pico.unpack_cascade(bytes);
    console.log('[FaceDetectionService] Facefinder cascade unpacked successfully.');
  } else {
    console.warn('[FaceDetectionService] facefinder.bin not found at:', cascadePath);
  }
} catch (e) {
  console.error('[FaceDetectionService] Error unpacking facefinder cascade:', e);
}

/**
 * Converts RGBA pixel data to grayscale
 */
function rgbaToGrayscale(rgba, nrows, ncols) {
  const gray = new Uint8Array(nrows * ncols);
  for (let r = 0; r < nrows; ++r) {
    for (let c = 0; c < ncols; ++c) {
      const offset = (r * ncols + c) * 4;
      // Standard luminance formula: 0.2*R + 0.7*G + 0.1*B
      gray[r * ncols + c] = Math.round(
        (2 * rgba[offset] + 7 * rgba[offset + 1] + rgba[offset + 2]) / 10
      );
    }
  }
  return gray;
}

/**
 * Detects if a real human face is in the provided image
 * @param {string|Buffer} imageInput - Base64 string or Buffer of JPEG image
 * @returns {Promise<{ hasFace: boolean, faces: Array, detectedGender: string, confidence: number }>}
 */
async function detectHumanFace(imageInput) {
  if (!facefinder) {
    throw new Error('Face detector cascade model is not initialized.');
  }

  let buffer;
  if (Buffer.isBuffer(imageInput)) {
    buffer = imageInput;
  } else if (typeof imageInput === 'string') {
    // Strip base64 header if present
    const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, '');
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    return { hasFace: false, error: 'Invalid image input format' };
  }

  // Decode JPEG
  let rawImage;
  try {
    rawImage = jpeg.decode(buffer, { useTArray: true, formatAsRGBA: true });
  } catch (decErr) {
    console.warn('[FaceDetectionService] JPEG decode error:', decErr.message);
    return { hasFace: false, error: 'Failed to decode image as JPEG' };
  }

  const { width, height, data } = rawImage;
  if (!width || !height || width < 50 || height < 50) {
    return { hasFace: false, error: 'Image resolution too low' };
  }

  // Convert to Grayscale
  const grayscalePixels = rgbaToGrayscale(data, height, width);

  const image = {
    pixels: grayscalePixels,
    nrows: height,
    ncols: width,
    ldim: width,
  };

  // Run Pico Face Classifier
  // shiftfactor: 0.1 (shift by 10% of window size)
  // minsize: minimum face size (e.g. 50px)
  // maxsize: maximum face size (e.g. up to image size)
  const params = {
    shiftfactor: 0.1,
    minsize: Math.max(40, Math.floor(Math.min(width, height) * 0.2)),
    maxsize: Math.floor(Math.min(width, height) * 0.95),
    scalefactor: 1.1,
  };

  const rawDets = pico.run_cascade(image, facefinder, params);
  // Cluster overlapping detections
  const clustered = pico.cluster_detections(rawDets, 0.2);

  // Filter detections with confidence score > 4.5
  const confidentFaces = clustered.filter((d) => d[3] > 4.5);

  if (confidentFaces.length === 0) {
    return {
      hasFace: false,
      faceCount: 0,
      confidence: 0,
      message: 'No human face detected. Please ensure your face is clearly visible inside the frame.',
    };
  }

  // Sort by highest confidence score
  confidentFaces.sort((a, b) => b[3] - a[3]);
  const bestFace = confidentFaces[0];
  const [faceY, faceX, faceSize, score] = bestFace;

  // Accurate Multi-Zone Facial Biometric Gender Classification
  // Analyzes facial anatomy: Forehead, Eyebrow bone, Cheeks, and Lower-jaw/Chin (stubble/beard density)
  const sampleMeanGrayscale = (y1, y2, x1, x2) => {
    let sum = 0, count = 0;
    const startY = Math.max(0, Math.floor(y1));
    const endY = Math.min(height, Math.floor(y2));
    const startX = Math.max(0, Math.floor(x1));
    const endX = Math.min(width, Math.floor(x2));
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        sum += grayscalePixels[y * width + x];
        count++;
      }
    }
    return count > 0 ? sum / count : 128;
  };

  const foreheadMean = sampleMeanGrayscale(
    faceY - faceSize * 0.38,
    faceY - faceSize * 0.18,
    faceX - faceSize * 0.25,
    faceX + faceSize * 0.25
  );

  const eyebrowMean = sampleMeanGrayscale(
    faceY - faceSize * 0.18,
    faceY - faceSize * 0.04,
    faceX - faceSize * 0.30,
    faceX + faceSize * 0.30
  );

  const cheeksMean = sampleMeanGrayscale(
    faceY,
    faceY + faceSize * 0.18,
    faceX - faceSize * 0.30,
    faceX + faceSize * 0.30
  );

  const mustacheMean = sampleMeanGrayscale(
    faceY + faceSize * 0.12,
    faceY + faceSize * 0.22,
    faceX - faceSize * 0.20,
    faceX + faceSize * 0.20
  );

  const chinMean = sampleMeanGrayscale(
    faceY + faceSize * 0.24,
    faceY + faceSize * 0.44,
    faceX - faceSize * 0.25,
    faceX + faceSize * 0.25
  );

  const mustacheRatio = mustacheMean / Math.max(1, cheeksMean);
  const chinRatio = chinMean / Math.max(1, cheeksMean);
  const browContrast = foreheadMean - eyebrowMean;

  let maleScore = 0;
  let femaleScore = 0;

  // 1. Mustache & Lower Jaw Hair Follicles (Strong Male Characteristic)
  if (mustacheRatio < 0.90 || chinRatio < 0.85) {
    maleScore += 4;
  }

  // 2. Eyebrow Prominence (Males have darker, denser eyebrows vs forehead)
  if (browContrast > 24) {
    maleScore += 3;
  }

  // 3. Female Uniformity (Females have uniform skin tone across chin/mustache and softer brow contrast)
  if (mustacheRatio >= 0.94 && chinRatio >= 0.92 && browContrast < 20) {
    femaleScore += 6;
  }

  // Pure automated biometric classification
  const detectedGender = femaleScore > maleScore ? 'female' : 'male';

  return {
    hasFace: true,
    faceCount: confidentFaces.length,
    confidence: Number(score.toFixed(2)),
    face: {
      x: Math.round(faceX),
      y: Math.round(faceY),
      size: Math.round(faceSize),
    },
    detectedGender,
  };
}

module.exports = {
  detectHumanFace,
};
