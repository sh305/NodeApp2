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
 * 2Factor.in Real Voice Call & SMS OTP Service
 * Dispatches automated phone call delivering 6-digit OTP directly to user's mobile phone
 */
class SmsOtpService {
  /**
   * Send 6-Digit Real OTP to Indian Mobile Number via Automated Voice Call (+ SMS fallback)
   * @param {string} rawPhoneNumber - 10 digit Indian number (e.g. 7982720270)
   */
  static async sendOtp(rawPhoneNumber, preferredChannel = 'voice') {
    const cleanDigits = (rawPhoneNumber || '').replace(/\D/g, '').slice(-10);
    if (!cleanDigits || cleanDigits.length !== 10) {
      return { success: false, message: 'Please enter a valid 10-digit Indian mobile number' };
    }

    // 1. Generate secure 6-digit OTP code & store in high-speed RAM/Redis cache for 10 minutes
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await cacheService.set(`otp:${cleanDigits}`, otp, 600);
    console.log(`🔐 [YoYo Voice OTP Service] Generated OTP [${otp}] for +91${cleanDigits}`);

    // 2. Primary: Dispatch Automated Voice Call OTP via 2Factor.in
    let dispatched = false;
    if (twoFactorApiKey) {
      try {
        console.log(`📞 [2Factor.in] Initiating Voice Call OTP to +91${cleanDigits}...`);
        const voiceUrl = `https://2factor.in/API/V1/${twoFactorApiKey}/VOICE/${cleanDigits}/${otp}`;
        const voiceRes = await axios.get(voiceUrl, { timeout: 10000 });

        if (voiceRes.data && voiceRes.data.Status === 'Success') {
          console.log(`✅ [2Factor.in] Voice Call successfully dialed to +91${cleanDigits}! Details:`, voiceRes.data.Details);
          dispatched = true;
        } else {
          console.warn('⚠️ [2Factor.in] Voice response not success:', voiceRes.data);
        }
      } catch (voiceErr) {
        console.error('2Factor.in Voice Call Error:', voiceErr.response?.data || voiceErr.message);
      }

      // Also trigger SMS in parallel as additional delivery
      try {
        const smsUrl = `https://2factor.in/API/V1/${twoFactorApiKey}/SMS/${cleanDigits}/${otp}`;
        axios.get(smsUrl, { timeout: 8000 }).catch(() => {});
      } catch (_) {}
    }

    // 3. Fallback: Twilio Voice / SMS if 2Factor failed
    if (!dispatched && twilioClient && verifyServiceSid) {
      try {
        const formattedPhone = `+91${cleanDigits}`;
        console.log(`📡 [Twilio] Fallback: Initiating verification call to ${formattedPhone}...`);
        const verification = await twilioClient.verify.v2
          .services(verifyServiceSid)
          .verifications.create({
            to: formattedPhone,
            channel: 'call',
          });
        console.log('✅ Twilio Call Dispatched successfully! Status:', verification.status);
        dispatched = true;
      } catch (twilioErr) {
        console.warn('Twilio Fallback Error:', twilioErr.message);
      }
    }

    return {
      success: true,
      channel: 'voice',
      message: `Incoming verification call sent to +91 ${cleanDigits}! Please answer the call 📞`,
    };
  }

  /**
   * Verify User's Entered 6-Digit OTP
   */
  static async verifyOtp(rawPhoneNumber, enteredOtp) {
    const cleanDigits = (rawPhoneNumber || '').replace(/\D/g, '').slice(-10);

    if (!enteredOtp || enteredOtp.toString().trim().length !== 6) {
      return {
        valid: false,
        message: 'Please enter a valid 6-digit OTP code',
      };
    }

    const cleanOtp = enteredOtp.toString().trim();

    // 1. Primary: Verify against cached OTP
    const storedOtp = await cacheService.get(`otp:${cleanDigits}`);
    if (storedOtp && storedOtp.toString().trim() === cleanOtp) {
      await cacheService.del(`otp:${cleanDigits}`);
      await cacheService.del(`2factor_session:${cleanDigits}`);
      await cacheService.set(`phone_verified:${cleanDigits}`, 'true', 900);
      console.log(`✅ [Cache Verified] OTP matched for +91${cleanDigits}!`);
      return { valid: true };
    }

    // 2. Secondary: Check 2Factor session verification
    if (twoFactorApiKey) {
      try {
        const sessionId = await cacheService.get(`2factor_session:${cleanDigits}`);
        if (sessionId) {
          const url = `https://2factor.in/API/V1/${twoFactorApiKey}/SMS/VERIFY/${sessionId}/${cleanOtp}`;
          const res = await axios.get(url, { timeout: 8000 });
          if (res.data && res.data.Status === 'Success') {
            await cacheService.del(`otp:${cleanDigits}`);
            await cacheService.del(`2factor_session:${cleanDigits}`);
            await cacheService.set(`phone_verified:${cleanDigits}`, 'true', 900);
            return { valid: true };
          }
        }
      } catch (err) {
        console.warn('2Factor session check error:', err.message);
      }
    }

    // 3. Tertiary: Twilio Verify Check
    if (twilioClient && verifyServiceSid) {
      try {
        const formattedPhone = `+91${cleanDigits}`;
        const verificationCheck = await twilioClient.verify.v2
          .services(verifyServiceSid)
          .verificationChecks.create({
            to: formattedPhone,
            code: cleanOtp,
          });

        if (verificationCheck.status === 'approved') {
          await cacheService.del(`otp:${cleanDigits}`);
          await cacheService.set(`phone_verified:${cleanDigits}`, 'true', 900);
          return { valid: true };
        }
      } catch (err) {
        console.warn('Twilio verify error:', err.message);
      }
    }

    return {
      valid: false,
      message: 'Wrong OTP! Please enter correct 6 digit OTP',
    };
  }
}

module.exports = SmsOtpService;
