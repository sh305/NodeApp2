const axios = require('axios');
const { cacheService } = require('../config/redis');

/**
 * Meta WhatsApp Cloud API Service (Facebook for Developers)
 * Dispatches 6-Digit Verification OTP directly to User's WhatsApp inbox via Graph API
 */
class WhatsAppOtpService {
  /**
   * Send 6-Digit OTP to User's WhatsApp via Facebook Meta Cloud API
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

      // Store in memory / redis cache for 5 minutes (300 seconds)
      await cacheService.set(`otp:${cleanPhone}`, otp, 300);
      await cacheService.set(`wa_otp:${cleanPhone}`, otp, 300);

      const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID || '1449778534875707';
      const accessToken =
        process.env.META_WHATSAPP_ACCESS_TOKEN ||
        'EAAMHnfCYEa0BSsCl4hUm78GP1zJVOEZAgng8Bx82g8AupjXirobH9UCvWBBcCpId0ZCxJ4KqhS3wfJOPaTLODG8hYSMQ8nZBvHrdBu7w6yi2hBZAyw0m8P9xv9RwhelAekWC9uueHNoI8N39SMXjvJW9JKoJmpYd0A7RdHW47WgrexCK5jVJCqD6XRM9qrEQobm7VafJc8gh8oR8FOd0vb5z1czSJ5gZCsnMQiFIE5tMhHmsVB7nMNGzW3YZC8aaxgkVMvpUrJjdUqWRcFdmAcCwZDZD';

      if (!phoneNumberId || !accessToken) {
        console.warn('⚠️ [Meta WhatsApp] Missing credentials in backend/.env: META_WHATSAPP_PHONE_ID or META_WHATSAPP_ACCESS_TOKEN is not set.');
        return {
          success: false,
          missingConfig: true,
          message: 'Meta WhatsApp credentials not found in backend/.env. Please provide Phone Number ID and Access Token from developers.facebook.com.',
        };
      }

      const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
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

      console.log(`✅ [Meta WhatsApp] OTP delivered to +${fullRecipientNumber}! Message ID: ${response.data?.messages?.[0]?.id}`);

      return {
        success: true,
        message: 'OTP has been sent to your WhatsApp number via Meta WhatsApp! 📨',
        messageId: response.data?.messages?.[0]?.id,
      };
    } catch (error) {
      const errDetails = error.response?.data?.error;
      console.error('Meta WhatsApp Cloud API Error:', errDetails || error.message);

      let userMsg = 'Failed to send WhatsApp OTP. Please ensure your number is registered on WhatsApp.';
      if (errDetails?.message) {
        if (errDetails.code === 131030) {
          userMsg = 'Recipient number is not added to test numbers in Meta Developer portal. Please add your number to the To list in Meta Dashboard.';
        } else if (errDetails.code === 190) {
          userMsg = 'Meta WhatsApp Access Token expired. Please refresh the token in Meta for Developers.';
        } else if (errDetails.code === 131047) {
          userMsg = 'Message failed to send. More than 24 hours have passed since the customer last messaged.';
        } else {
          userMsg = `Meta WhatsApp Error: ${errDetails.message}`;
        }
      }

      return {
        success: false,
        message: userMsg,
        errorCode: errDetails?.code,
      };
    }
  }

  /**
   * Verify User's Entered WhatsApp OTP
   */
  static async verifyOtp(rawPhoneNumber, enteredOtp) {
    const cleanPhone = (rawPhoneNumber || '').replace(/\D/g, '').slice(-10);

    if (!enteredOtp || enteredOtp.toString().trim().length !== 6) {
      return { valid: false, message: 'Please enter a valid 6-digit OTP code' };
    }

    const cleanOtp = enteredOtp.toString().trim();

    // Check stored OTP in memory / redis cache
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

    console.log(`✅ [Meta WhatsApp] Phone OTP verified for +91${cleanPhone}!`);
    return { valid: true };
  }
}

module.exports = WhatsAppOtpService;
