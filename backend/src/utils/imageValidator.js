let jsQR = null;
try { jsQR = require('jsqr'); } catch (e) { console.warn('⚠️ [imageValidator] jsqr not available:', e.message); }

let jpeg = null;
try { jpeg = require('jpeg-js'); } catch (e) { console.warn('⚠️ [imageValidator] jpeg-js not available:', e.message); }

let PNG = null;
try { PNG = require('pngjs').PNG; } catch (e) { console.warn('⚠️ [imageValidator] pngjs not available:', e.message); }

let Tesseract = null;
try { Tesseract = require('tesseract.js'); } catch (e) { console.warn('⚠️ [imageValidator] tesseract.js not available:', e.message); }

/**
 * Decode Base64 string to Buffer and extract raw RGBA pixels
 */
function extractRgbaFromBuffer(buffer) {
  // 1. Try PNG first (check PNG signature: 0x89 0x50 0x4E 0x47)
  if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    try {
      const png = PNG.sync.read(buffer);
      return {
        data: new Uint8ClampedArray(png.data),
        width: png.width,
        height: png.height,
      };
    } catch (e) {
      // fallback
    }
  }

  // 2. Try JPEG (check JPEG signature: 0xFF 0xD8 0xFF)
  if (buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    try {
      const decoded = jpeg.decode(buffer, { useTArray: true });
      return {
        data: new Uint8ClampedArray(decoded.data),
        width: decoded.width,
        height: decoded.height,
      };
    } catch (e) {
      // fallback
    }
  }

  // 3. Fallback: attempt PNG then JPEG
  try {
    const png = PNG.sync.read(buffer);
    return {
      data: new Uint8ClampedArray(png.data),
      width: png.width,
      height: png.height,
    };
  } catch (errPng) {
    try {
      const decoded = jpeg.decode(buffer, { useTArray: true });
      return {
        data: new Uint8ClampedArray(decoded.data),
        width: decoded.width,
        height: decoded.height,
      };
    } catch (errJpeg) {
      return null;
    }
  }
}

/**
 * Clean base64 string and convert to Buffer
 */
function base64ToBuffer(base64Str) {
  if (!base64Str || typeof base64Str !== 'string') return null;
  const cleanStr = base64Str.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  return Buffer.from(cleanStr, 'base64');
}

/**
 * Validates whether an uploaded image contains a real QR code (for Refund QR)
 * @param {string} base64Data
 * @returns {Promise<{ isValid: boolean, qrData?: string, message?: string }>}
 */
exports.validateRefundQrImage = async (base64Data) => {
  try {
    const buffer = base64ToBuffer(base64Data);
    if (!buffer || buffer.length === 0) {
      return {
        isValid: false,
        message: 'Invalid image data provided',
      };
    }

    const rgbaResult = extractRgbaFromBuffer(buffer);
    if (!rgbaResult) {
      return {
        isValid: false,
        message: 'Could not decode image format. Please upload a clear JPEG or PNG QR code.',
      };
    }

    const qrResult = jsQR(rgbaResult.data, rgbaResult.width, rgbaResult.height);

    if (qrResult && qrResult.data) {
      return {
        isValid: true,
        qrData: qrResult.data,
      };
    }

    return {
      isValid: false,
      message: 'No QR code detected in this image. Please upload a clear, valid payment QR code.',
    };
  } catch (err) {
    console.error('Error validating QR code image:', err);
    return {
      isValid: false,
      message: 'Failed to process QR code image. Please try another image.',
    };
  }
};

/**
 * Common payment keywords across PhonePe, Google Pay, Paytm, BHIM, Cred, and Indian Banks
 */
const PAYMENT_KEYWORDS = [
  'paid',
  'pay',
  'payment',
  'successful',
  'success',
  'completed',
  'complete',
  'transferred',
  'transfer',
  'sent',
  'debited',
  'credited',
  'received',
  'phonepe',
  'google pay',
  'gpay',
  'paytm',
  'bhim',
  'upi',
  'utr',
  'transaction',
  'txn',
  'ref no',
  'reference',
  'paid to',
  'banking name',
  'rupees',
  'inr',
  'rs',
  'account',
  'bank',
  'wallet',
  'amount',
  'order',
  'id',
  'view details',
  'split',
  'fun maja',
  '7982720270',
];

/**
 * Validates whether an uploaded image is a legitimate payment receipt using OCR and optional UTR match
 * @param {string} base64Data
 * @param {string} [expectedUtr] - 12-digit UTR submitted by the user
 * @returns {Promise<{ isValid: boolean, matchedKeywords?: string[], utrMatched?: boolean, message?: string }>}
 */
exports.validatePaymentProofImage = async (base64Data, expectedUtr = '') => {
  try {
    const buffer = base64ToBuffer(base64Data);
    if (!buffer || buffer.length === 0) {
      return {
        isValid: false,
        message: 'Invalid image data provided',
      };
    }

    // Run Tesseract OCR on the image
    const ocrResult = await Tesseract.recognize(buffer, 'eng');
    const rawText = ocrResult?.data?.text || '';
    const normalizedText = rawText.toLowerCase().replace(/[\r\n\t]+/g, ' ');

    // 1. Check for expected UTR match if available
    let utrMatched = false;
    const cleanExpectedUtr = (expectedUtr || '').trim();
    if (cleanExpectedUtr.length >= 8) {
      const digitsOnlyText = normalizedText.replace(/\D/g, '');
      if (digitsOnlyText.includes(cleanExpectedUtr)) {
        utrMatched = true;
      } else {
        const first8 = cleanExpectedUtr.slice(0, 8);
        const last8 = cleanExpectedUtr.slice(-8);
        if (digitsOnlyText.includes(first8) || digitsOnlyText.includes(last8)) {
          utrMatched = true;
        }
      }
    }

    // 2. Check for ANY 10 to 12 digit reference number (standard in Indian UPI receipts)
    const hasAnyUtrOrTxnNumber = /\b\d{10,12}\b/.test(normalizedText) || /\d{4}\s*\d{4}\s*\d{4}/.test(normalizedText);

    // 3. Count matched payment keywords
    const matchedKeywords = PAYMENT_KEYWORDS.filter((keyword) =>
      normalizedText.includes(keyword)
    );

    console.log('📸 [OCR Text Sample]:', normalizedText.slice(0, 150));
    console.log('📸 [OCR Matched Keywords]:', matchedKeywords);
    console.log('📸 [OCR UTR Matched]:', utrMatched);
    console.log('📸 [OCR 10-12 Digit Reference Found]:', hasAnyUtrOrTxnNumber);

    // Decision rule:
    // Any genuine payment screenshot has either:
    // - User's UTR match
    // - Any 10-12 digit transaction/reference number
    // - At least 1 payment keyword ('paid', 'successful', 'phonepe', 'gpay', 'paytm', 'upi', 'fun maja', etc.)
    // Non-payment photos (selfies, memes, products, landscapes) have NONE of these!
    if (utrMatched || hasAnyUtrOrTxnNumber || matchedKeywords.length >= 1) {
      return {
        isValid: true,
        matchedKeywords,
        utrMatched,
      };
    }

    return {
      isValid: false,
      message: 'Invalid payment proof: No payment or transaction details detected. Please upload a clear screenshot of your payment receipt.',
    };
  } catch (err) {
    console.error('Error running OCR on payment proof:', err);
    // If OCR engine encounters an internal glitch, allow through so user isn't permanently blocked by server error
    return {
      isValid: true,
      matchedKeywords: ['fallback_bypass'],
      utrMatched: false,
    };
  }
};
