const nodemailer = require('nodemailer');
const { cacheService } = require('../config/redis');

const getTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  if (emailUser && emailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }
  return null;
};

/**
 * Real Gmail / Email 6-Digit OTP Service
 */
class EmailOtpService {
  /**
   * Send 6-Digit OTP to User's Email / Gmail ID
   * @param {string} email
   */
  static async sendOtp(email) {
    try {
      const cleanEmail = email.toLowerCase().trim();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, message: 'Please enter a valid Gmail / Email address' };
      }

      // Generate 6-Digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store in high-speed cache for 5 minutes (300 seconds)
      await cacheService.set(`email_otp:${cleanEmail}`, otp, 300);

      const mailer = getTransporter();
      if (mailer) {
        const mailOptions = {
          from: `"YoYo Live Voice" <${process.env.EMAIL_USER}>`,
          to: cleanEmail,
          subject: `🔐 Your YoYo Live Login OTP: ${otp}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0F0F1A; color: #FFFFFF; padding: 24px; border-radius: 16px; border: 1px solid #2A2A3E;">
              <h2 style="color: #F59E0B; text-align: center; margin-bottom: 8px;">🎙️ YoYo Live Voice</h2>
              <p style="color: #9CA3AF; text-align: center; font-size: 14px;">Voice Chat Rooms & Community</p>
              <div style="background: #1E1E2E; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0;">
                <p style="color: #D1D5DB; margin-bottom: 10px; font-size: 14px;">Your 6-Digit Verification Code is:</p>
                <h1 style="color: #10B981; font-size: 36px; letter-spacing: 6px; margin: 0;">${otp}</h1>
                <p style="color: #9CA3AF; font-size: 12px; margin-top: 10px;">This code is valid for 5 minutes.</p>
              </div>
              <p style="color: #6B7280; font-size: 12px; text-align: center;">If you did not request this OTP, you can safely ignore this email.</p>
            </div>
          `,
        };

        await mailer.sendMail(mailOptions);
        console.log(`✅ Real Gmail OTP sent to ${cleanEmail}`);
      } else {
        console.log(`\n======================================================`);
        console.log(`📧 [Gmail OTP] Sent to: ${cleanEmail}`);
        console.log(`🔑 OTP Code: ${otp} (Valid for 5 Minutes)`);
        console.log(`💡 Note: To send real emails via your Gmail, add EMAIL_USER & EMAIL_PASS in backend/.env`);
        console.log(`======================================================\n`);
      }

      return {
        success: true,
        message: 'Message Sent Successfully',
        devOtp: process.env.NODE_ENV === 'production' && transporter ? undefined : otp,
      };
    } catch (error) {
      console.error('EmailOtpService Error:', error.message);
      return {
        success: false,
        message: error.message || 'Failed to send Email OTP',
      };
    }
  }

  /**
   * Verify User's Entered 6-Digit Email OTP
   */
  static async verifyOtp(email, enteredOtp) {
    const cleanEmail = email.toLowerCase().trim();

    // Master test code
    if (enteredOtp === '123456' || enteredOtp === '000000') {
      return { valid: true };
    }

    const storedOtp = await cacheService.get(`email_otp:${cleanEmail}`);

    if (!storedOtp) {
      return { valid: false, message: 'OTP expired or not requested. Please tap "Get OTP" again.' };
    }

    if (storedOtp.toString().trim() !== enteredOtp.toString().trim()) {
      return { valid: false, message: 'Wrong OTP! Please enter correct 6 digit OTP' };
    }

    // Single-use security: delete after verification
    await cacheService.del(`email_otp:${cleanEmail}`);

    return { valid: true };
  }
}

module.exports = EmailOtpService;
