const axios = require('axios');
const { cacheService } = require('../config/redis');

/**
 * Meta WhatsApp Cloud API Service
 */
class WhatsAppOtpService {
  /**
   * Send 6-Digit OTP directly to User's WhatsApp inbox via Meta Cloud API
   * @param {string} rawPhoneNumber - 10 digit Indian number (e.g. 7982720270)
   * @param {string} countryCode - Country code without + (default: 91)
   */
  static async sendOtp(rawPhoneNumber, countryCode = '91') {
    try {
      const cleanPhone = (rawPhoneNumber || '').replace(/\D/g, '').slice(-10);
      if (!cleanPhone || cleanPhone.length !== 10) {
        return { success: false, message: 'Please enter a valid 10-digit Indian mobile number' };
      }

      const fullRecipientNumber = cleanPhone.startsWith(countryCode)
        ? cleanPhone
        : `${countryCode}${cleanPhone}`;

      // Generate secure 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store in memory cache for 5 minutes (300 seconds)
      await cacheService.set(`otp:${cleanPhone}`, otp, 300);
      await cacheService.set(`wa_otp:${cleanPhone}`, otp, 300);

      const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID;
      const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;

      if (!phoneNumberId || !accessToken) {
        console.warn('⚠️ Meta WhatsApp credentials missing in backend/.env');
        return {
          success: false,
          message: 'WhatsApp verification service not configured',
        };
      }

      const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
      const messageBody = `🔐 *YoYo Voice Verification*\n\nYour Verification OTP code is: *${otp}*\n\nThis code is valid for 5 minutes. Do not share it with anyone.`;

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: fullRecipientNumber,
        type: 'text',
        text: {
          preview_url: false,
          body: messageBody,
        },
      };

      console.log(`📡 [Meta WhatsApp Cloud API] Dispatching OTP to +${fullRecipientNumber}...`);

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      console.log(`✅ WhatsApp OTP delivered to +${fullRecipientNumber}! Message ID: ${response.data?.messages?.[0]?.id}`);

      return {
        success: true,
        message: 'OTP has been sent to your WhatsApp number',
      };
    } catch (error) {
      const errDetails = error.response?.data?.error;
      console.error('Meta WhatsApp API Error:', errDetails || error.message);

      let userMsg = 'Failed to send WhatsApp OTP. Please ensure your number is registered on WhatsApp.';
      if (errDetails?.message) {
        if (errDetails.code === 131030) {
          userMsg = 'Recipient number is not in the allowed list for test mode.';
        } else if (errDetails.code === 190) {
          userMsg = 'WhatsApp service access token expired. Please refresh token.';
        }
      }

      return {
        success: false,
        message: userMsg,
      };
    }
  }

  /**
   * Verify User's Entered OTP
   */
  static async verifyOtp(rawPhoneNumber, enteredOtp) {
    const cleanPhone = (rawPhoneNumber || '').replace(/\D/g, '').slice(-10);

    if (!enteredOtp || enteredOtp.toString().trim().length !== 6) {
      return { valid: false, message: 'Please enter a valid 6-digit OTP code' };
    }

    const cleanOtp = enteredOtp.toString().trim();

    // Check stored OTP in memory cache
    let storedOtp = await cacheService.get(`otp:${cleanPhone}`);
    if (!storedOtp) {
      storedOtp = await cacheService.get(`wa_otp:${cleanPhone}`);
    }

    if (!storedOtp) {
      return { valid: false, message: 'OTP expired or not found. Please request a new OTP.' };
    }

    if (storedOtp.toString().trim() !== cleanOtp) {
      return { valid: false, message: 'Wrong OTP! Please enter correct 6 digit OTP' };
    }

    // Delete single-use OTP
    await cacheService.del(`otp:${cleanPhone}`);
    await cacheService.del(`wa_otp:${cleanPhone}`);

    // Mark as verified for 15 minutes
    await cacheService.set(`phone_verified:${cleanPhone}`, 'true', 900);

    return { valid: true };
  }
}

module.exports = WhatsAppOtpService;
