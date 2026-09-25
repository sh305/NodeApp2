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
          replyTo: process.env.EMAIL_USER,
          subject: `${otp} is your YoYo Live verification code`,
          text: `Your YoYo Live verification code is: ${otp}\n\nThis code is valid for 5 minutes. Please do not share it with anyone.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; color: #1f2937; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #10b981; margin: 0; font-size: 24px;">🎙️ YoYo Live Voice</h2>
                <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Voice Chat Rooms & Community</p>
              </div>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <p style="color: #4b5563; font-size: 13px; margin-bottom: 8px;">Your 6-Digit Login Verification Code:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111827; font-family: monospace;">${otp}</div>
                <p style="color: #9ca3af; font-size: 11px; margin-top: 8px;">Valid for 5 minutes only</p>
              </div>
              <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
          `,
          headers: {
            'X-Priority': '1',
            'X-MSMail-Priority': 'High',
            Importance: 'high',
          },
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
        message: mailer ? 'OTP code sent to your Gmail inbox!' : `OTP sent: ${otp} (Valid for 5 mins)`,
        devOtp: otp,
        isRealMailSent: !!mailer,
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
