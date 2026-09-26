const axios = require('axios');
const twilio = require('twilio');
const { cacheService } = require('../config/redis');

let twilioClient = null;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

if (accountSid && authToken) {
  try {
    twilioClient = twilio(accountSid, authToken);
  } catch (err) {
    console.error('Twilio init error:', err.message);
  }
}

const twoFactorApiKey =
  process.env.TWOFACTOR_API_KEY || '20d6d690-b96f-11f1-af74-0200cd936042';

/**
 * Real SMS OTP Service powered by 2Factor.in & Twilio
 * Delivers 100% Real SMS OTP directly to user's mobile SIM inbox!
 */
class SmsOtpService {
  /**
   * Send 6-Digit Real SMS OTP to Mobile Number
   * @param {string} rawPhoneNumber - 10 digit Indian number (e.g. 7982720270)
   */
  static async sendOtp(rawPhoneNumber) {
    const cleanDigits = (rawPhoneNumber || '').replace(/\D/g, '').slice(-10);
    if (!cleanDigits || cleanDigits.length !== 10) {
      return { success: false, message: 'Please enter a valid 10-digit Indian mobile number' };
    }
    const formattedPhone = `+91${cleanDigits}`;

    // 1. Primary: 2Factor.in Real Indian SMS Delivery (Instant & Free 200 SMS)
    if (twoFactorApiKey) {
      try {
        console.log(`📡 [2Factor.in] Sending Real SMS OTP to ${cleanDigits}...`);
        const url = `https://2factor.in/API/V1/${twoFactorApiKey}/SMS/${cleanDigits}/AUTOGEN3/OTP1`;
        const res = await axios.get(url, { timeout: 10000 });

        if (res.data && res.data.Status === 'Success') {
          const sessionId = res.data.Details;
          // Store session id for 10 minutes
          await cacheService.set(`2factor_session:${cleanDigits}`, sessionId, 600);
          console.log(`✅ [2Factor.in] Real SMS dispatched to ${cleanDigits}! Session ID: ${sessionId}`);

          return {
            success: true,
            message: `SMS OTP code sent to +91 ${cleanDigits}!`,
          };
        } else {
          console.warn('⚠️ [2Factor.in] Response not success:', res.data);
        }
      } catch (twoFactorErr) {
        console.error('2Factor.in SMS Error:', twoFactorErr.response?.data || twoFactorErr.message);
      }
    }

    // 2. Secondary: Twilio Verify fallback
    if (twilioClient && verifyServiceSid) {
      try {
        console.log(`📡 [Twilio] Sending SMS OTP to ${formattedPhone}...`);
        const verification = await twilioClient.verify.v2
          .services(verifyServiceSid)
          .verifications.create({
            to: formattedPhone,
            channel: 'sms',
          });

        console.log('✅ Twilio SMS Dispatched successfully! Status:', verification.status);

        return {
          success: true,
          message: `SMS OTP code sent to +91 ${cleanDigits}!`,
        };
      } catch (twilioErr) {
        console.error('Twilio SMS Error:', twilioErr.message);
      }
    }

    return {
      success: false,
      message: 'Failed to deliver SMS OTP. Please try again or sign in with Gmail.',
    };
  }

  /**
   * Verify User's Entered 6-Digit OTP
   */
  static async verifyOtp(rawPhoneNumber, enteredOtp) {
    const cleanDigits = (rawPhoneNumber || '').replace(/\D/g, '').slice(-10);
    const formattedPhone = `+91${cleanDigits}`;

    if (!enteredOtp || enteredOtp.toString().trim().length < 6) {
      return {
        valid: false,
        message: 'Please enter a valid 6-digit OTP code',
      };
    }

    const cleanOtp = enteredOtp.toString().trim();

    // 1. Primary: 2Factor.in Verification
    if (twoFactorApiKey) {
      try {
        const sessionId = await cacheService.get(`2factor_session:${cleanDigits}`);
        if (sessionId) {
          console.log(`🔍 [2Factor.in] Verifying OTP for ${cleanDigits} with session ${sessionId}...`);
          const url = `https://2factor.in/API/V1/${twoFactorApiKey}/SMS/VERIFY/${sessionId}/${cleanOtp}`;
          const res = await axios.get(url, { timeout: 8000 });

          if (res.data && res.data.Status === 'Success') {
            console.log(`✅ [2Factor.in] OTP Matched successfully for ${cleanDigits}!`);
            await cacheService.del(`2factor_session:${cleanDigits}`);
            return { valid: true };
          }
        }
      } catch (twoFactorVerifyErr) {
        const errData = twoFactorVerifyErr.response?.data;
        console.warn('⚠️ [2Factor.in] Verify Error:', errData || twoFactorVerifyErr.message);
        if (errData && (errData.Details === 'OTP Mismatch' || errData.Status === 'Error')) {
          return {
            valid: false,
            message: 'Wrong OTP! Please enter correct 6 digit OTP',
          };
        }
      }
    }

    // 2. Secondary: Twilio Verify Check
    if (twilioClient && verifyServiceSid) {
      try {
        console.log(`🔍 [Twilio] Verifying OTP for ${formattedPhone}...`);
        const verificationCheck = await twilioClient.verify.v2
          .services(verifyServiceSid)
          .verificationChecks.create({
            to: formattedPhone,
            code: cleanOtp,
          });

        if (verificationCheck.status === 'approved') {
          return { valid: true };
        }
      } catch (err) {
        console.error('Twilio verify error:', err.message);
      }
    }

    return {
      valid: false,
      message: 'Wrong OTP! Please enter correct 6 digit OTP',
    };
  }
}

module.exports = SmsOtpService;
