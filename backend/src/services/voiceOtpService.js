const axios = require('axios');
const { cacheService } = require('../config/redis');

const twoFactorApiKey =
  process.env.TWOFACTOR_API_KEY || '20d6d690-b96f-11f1-af74-0200cd936042';

/**
 * 2Factor.in Voice Call OTP Service
 * Dispatches an automated outbound voice call (OBD) to the user's phone,
 * which speaks the 6-digit OTP code to the user.
 */
class VoiceOtpService {
  /**
   * Send 6-Digit Voice Call OTP to Mobile Number
   * @param {string} rawPhoneNumber - 10 digit Indian number (e.g. 7982720270)
   */
  static async sendVoiceOtp(rawPhoneNumber) {
    try {
      const cleanDigits = (rawPhoneNumber || '').replace(/\D/g, '').slice(-10);
      if (!cleanDigits || cleanDigits.length !== 10) {
        return {
          success: false,
          message: 'Please enter a valid 10-digit Indian mobile number',
        };
      }

      // Generate secure 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store in memory / Redis cache for 5 minutes (300 seconds)
      await cacheService.set(`voice_otp:${cleanDigits}`, otp, 300);
      await cacheService.set(`otp:${cleanDigits}`, otp, 300);

      if (!twoFactorApiKey) {
        console.warn('⚠️ TWOFACTOR_API_KEY is not configured in backend/.env');
        return {
          success: false,
          message: 'Voice OTP service is currently not configured',
        };
      }

      console.log(`📞 [2Factor.in Voice] Initiating automated voice call to +91 ${cleanDigits} with OTP ${otp}...`);

      const url = `https://2factor.in/API/V1/${twoFactorApiKey}/VOICE/${cleanDigits}/${otp}`;
      const response = await axios.get(url, { timeout: 12000 });

      if (response.data && response.data.Status === 'Success') {
        const sessionId = response.data.Details;
        await cacheService.set(`2factor_voice_session:${cleanDigits}`, sessionId, 600);
        console.log(`✅ [2Factor.in Voice] Call dispatched to +91 ${cleanDigits}! Session ID: ${sessionId}`);

        return {
          success: true,
          message: 'Voice call initiated! Please answer the call to hear your OTP.',
          sessionId,
        };
      } else {
        console.warn('⚠️ [2Factor.in Voice] API response not successful:', response.data);
        return {
          success: false,
          message: response.data?.Details || 'Failed to initiate Voice Call. Please try again.',
        };
      }
    } catch (error) {
      const errData = error.response?.data;
      console.error('2Factor.in Voice Call Error:', errData || error.message);

      let userMsg = 'Failed to trigger voice call. Please check your network and number.';
      if (errData?.Details) {
        userMsg = errData.Details;
      }

      return {
        success: false,
        message: userMsg,
      };
    }
  }

  /**
   * Verify User's Entered 6-Digit Voice OTP
   */
  static async verifyVoiceOtp(rawPhoneNumber, enteredOtp) {
    try {
      const cleanDigits = (rawPhoneNumber || '').replace(/\D/g, '').slice(-10);
      if (!enteredOtp || enteredOtp.toString().trim().length < 6) {
        return {
          valid: false,
          message: 'Please enter a valid 6-digit OTP code',
        };
      }

      const cleanOtp = enteredOtp.toString().trim();

      // Master dev fallback
      if (process.env.NODE_ENV !== 'production' && (cleanOtp === '123456' || cleanOtp === '000000')) {
        await cacheService.set(`phone_verified:${cleanDigits}`, 'true', 900);
        return { valid: true };
      }

      // Check stored cache OTP
      let storedOtp = await cacheService.get(`voice_otp:${cleanDigits}`);
      if (!storedOtp) {
        storedOtp = await cacheService.get(`otp:${cleanDigits}`);
      }

      if (storedOtp && storedOtp.toString().trim() === cleanOtp) {
        console.log(`✅ [VoiceOtpService] OTP matched from cache for +91 ${cleanDigits}!`);
        await cacheService.del(`voice_otp:${cleanDigits}`);
        await cacheService.del(`otp:${cleanDigits}`);
        await cacheService.del(`2factor_voice_session:${cleanDigits}`);

        // Mark as verified for 15 minutes
        await cacheService.set(`phone_verified:${cleanDigits}`, 'true', 900);
        return { valid: true };
      }

      // Check 2Factor Session if applicable
      const sessionId = await cacheService.get(`2factor_voice_session:${cleanDigits}`);
      if (sessionId && twoFactorApiKey) {
        try {
          console.log(`🔍 [2Factor.in Voice] Verifying session ${sessionId} for ${cleanDigits}...`);
          const verifyUrl = `https://2factor.in/API/V1/${twoFactorApiKey}/SMS/VERIFY/${sessionId}/${cleanOtp}`;
          const res = await axios.get(verifyUrl, { timeout: 8000 });
          if (res.data && res.data.Status === 'Success') {
            console.log(`✅ [2Factor.in Voice] Session OTP verified for ${cleanDigits}!`);
            await cacheService.del(`voice_otp:${cleanDigits}`);
            await cacheService.del(`otp:${cleanDigits}`);
            await cacheService.del(`2factor_voice_session:${cleanDigits}`);
            await cacheService.set(`phone_verified:${cleanDigits}`, 'true', 900);
            return { valid: true };
          }
        } catch (twoFactorVerifyErr) {
          console.warn('⚠️ [2Factor.in Voice] Session verify check error:', twoFactorVerifyErr.response?.data || twoFactorVerifyErr.message);
        }
      }

      return {
        valid: false,
        message: 'Wrong OTP! Please enter correct 6 digit OTP',
      };
    } catch (error) {
      console.error('Voice OTP verify error:', error);
      return {
        valid: false,
        message: 'Verification failed. Please try again.',
      };
    }
  }
}

module.exports = VoiceOtpService;
