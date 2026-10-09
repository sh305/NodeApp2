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
  '7982720270@ybl',
  'shivam rai',
];

/**
 * Validates whether an uploaded image is a legitimate payment receipt using OCR and strict multi-factor checks
 * Prevents uploading fake/irrelevant photos (selfies, memes, landscapes, random objects)
 * @param {string} base64Data
 * @param {string} [expectedUtr] - optional 12-digit UTR submitted by the user
 * @returns {Promise<{ isValid: boolean, extractedUtr?: string | null, score?: number, matchedKeywords?: string[], message?: string }>}
 */
exports.validatePaymentProofImage = async (base64Data, expectedUtr = '') => {
  try {
    const buffer = base64ToBuffer(base64Data);
    if (!buffer || buffer.length === 0) {
      return {
        isValid: false,
        message: 'Invalid image data provided. Please upload a clear screenshot.',
      };
    }

    // Minimum sanity check on image byte size (valid receipts are at least a few KB)
    if (buffer.length < 5000) {
      return {
        isValid: false,
        message: 'Image file is too small or corrupted. Please upload a full screenshot.',
      };
    }

    // Run Tesseract OCR on the image
    const ocrResult = await Tesseract.recognize(buffer, 'eng');
    const rawText = ocrResult?.data?.text || '';
    const normalizedText = rawText.toLowerCase().replace(/[\r\n\t]+/g, ' ');

    console.log('📸 [OCR Text Length]:', rawText.length);
    console.log('📸 [OCR Text Sample]:', normalizedText.slice(0, 150));

    // If image has virtually no text (e.g. photo of face, scenery, food, pet)
    if (normalizedText.trim().length < 8) {
      return {
        isValid: false,
        message: 'Invalid image: No transaction or receipt text found. Please upload a clear screenshot of your payment receipt.',
      };
    }

    // 1. Owner Details match (Strongest signal: 7982720270, 7982720270@ybl, Shivam Rai)
    const hasOwnerMatch =
      normalizedText.includes('7982720270') ||
      normalizedText.includes('shivam rai') ||
      (normalizedText.includes('shivam') && normalizedText.includes('rai'));

    // 2. Transaction Status Indicators (Must indicate a finished transaction)
    const hasStatus = /\b(successful|success|succes|completed|complete|paid|transferred|transfer|sent|debited|credited|received)\b/i.test(normalizedText);

    // 3. 12-digit UTR or Reference / Txn ID
    const utr12Match = normalizedText.match(/\b\d{12}\b/);
    const utrSpacedMatch = normalizedText.match(/\b\d{4}\s*\d{4}\s*\d{4}\b/);
    const hasGeneralRefNumber = /\b\d{10,16}\b/.test(normalizedText);
    const hasUtrNumber = !!(utr12Match || utrSpacedMatch || hasGeneralRefNumber);

    const hasTxnIndicator = /\b(utr|upi ref|reference|ref no|transaction id|txn id|txn|rrn|order id|payment id)\b/i.test(normalizedText);

    // 4. Payment Provider / Channel Branding
    const hasProvider = /\b(phonepe|google pay|gpay|paytm|bhim|upi|bank|ybl|axis|sbi|hdfc|icici|kotak|cred|amazon pay|rupay)\b/i.test(normalizedText);

    // 5. Currency / Amount
    const hasCurrency = /(₹|inr|\brs\.?\b|\bamount\b)/i.test(normalizedText) && /\d+/.test(normalizedText);

    // Calculate confidence score
    let score = 0;
    if (hasOwnerMatch) score += 4;
    if (hasStatus) score += 3;
    if (hasUtrNumber) score += 3;
    if (hasTxnIndicator) score += 2;
    if (hasProvider) score += 2;
    if (hasCurrency) score += 1;

    // Check optional expected UTR if passed
    let expectedUtrMatched = false;
    const cleanExpectedUtr = (expectedUtr || '').trim();
    if (cleanExpectedUtr.length >= 8) {
      const digitsOnlyText = normalizedText.replace(/\D/g, '');
      if (digitsOnlyText.includes(cleanExpectedUtr)) {
        expectedUtrMatched = true;
        score += 3;
      }
    }

    console.log('📸 [OCR Validation Score]:', score);
    console.log('📸 [OCR Details]:', { hasOwnerMatch, hasStatus, hasUtrNumber, hasTxnIndicator, hasProvider, hasCurrency });

    // Strict Decision Rule:
    // A photo is verified as a payment receipt ONLY if:
    // - Direct match with owner details (PhonePe/UPI/Name)
    // - OR (Payment status is present AND a 10-12 digit UTR or Transaction indicator exists)
    // - OR (Composite score >= 5 AND at least one payment status is present)
    // Random photos (selfies, wallpapers, memes, chat screenshots, random objects) fail all of these!
    const isGenuineReceipt =
      hasOwnerMatch ||
      expectedUtrMatched ||
      (hasStatus && (hasUtrNumber || hasTxnIndicator)) ||
      (score >= 5 && hasStatus);

    if (!isGenuineReceipt) {
      return {
        isValid: false,
        score,
        message: 'Invalid payment proof: This image does not appear to be a genuine payment receipt. Please upload a clear screenshot of your successful UPI transaction.',
      };
    }

    // Extract genuine 12-digit UTR if found in receipt text
    let extractedUtr = null;
    if (utr12Match) {
      extractedUtr = utr12Match[0];
    } else if (utrSpacedMatch) {
      extractedUtr = utrSpacedMatch[0].replace(/\s/g, '');
    }

    return {
      isValid: true,
      score,
      extractedUtr,
      hasOwnerMatch,
      matchedKeywords: [
        hasOwnerMatch ? 'owner_match' : null,
        hasStatus ? 'status_verified' : null,
        hasUtrNumber ? 'utr_found' : null,
        hasProvider ? 'provider_verified' : null,
      ].filter(Boolean),
    };
  } catch (err) {
    console.error('Error running OCR on payment proof:', err);
    return {
      isValid: false,
      message: 'Failed to verify payment proof image. Please ensure the screenshot is clear and try again.',
    };
  }
};

/**
 * Unified validator: Checks if an uploaded image is a valid QR Code OR a genuine UPI Payment Receipt.
 * Rejects random photos (selfies, wallpapers, memes, blank photos, unrelated images).
 * @param {string} base64Data
 * @param {string} [expectedUtr]
 * @returns {Promise<{ isValid: boolean, type?: 'qr_code' | 'receipt_ocr', message?: string, extractedUtr?: string, qrData?: string, score?: number }>}
 */
exports.validatePaymentOrQrProof = async (base64Data, expectedUtr = '') => {
  try {
    // 1. Try detecting QR code first (instant & reliable via jsQR)
    try {
      const qrCheck = await exports.validateRefundQrImage(base64Data);
      if (qrCheck && qrCheck.isValid) {
        return {
          isValid: true,
          type: 'qr_code',
          qrData: qrCheck.qrData,
          message: 'Valid payment QR code detected.',
        };
      }
    } catch (qrErr) {
      console.warn('⚠️ QR check attempt error:', qrErr.message);
    }

    // 2. Fallback to Payment Receipt OCR (checks for PhonePe/GPay/Paytm, UTR, Paid status)
    try {
      const ocrCheck = await exports.validatePaymentProofImage(base64Data, expectedUtr);
      if (ocrCheck && ocrCheck.isValid) {
        return {
          isValid: true,
          type: 'receipt_ocr',
          extractedUtr: ocrCheck.extractedUtr || null,
          score: ocrCheck.score,
          message: 'Valid payment receipt detected.',
        };
      }
    } catch (ocrErr) {
      console.warn('⚠️ OCR check attempt error:', ocrErr.message);
    }

    // 3. Neither QR code nor payment receipt details found
    return {
      isValid: false,
      message: 'Invalid image: Only valid payment QR codes or genuine payment receipts are accepted. Random photos cannot be uploaded.',
    };
  } catch (err) {
    console.error('Error in validatePaymentOrQrProof:', err);
    return {
      isValid: false,
      message: 'Failed to validate image. Please ensure the image is clear and try again.',
    };
  }
};

