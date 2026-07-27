const nodemailer = require('nodemailer');
const dns = require('dns');

// Absolute bulletproof hack to force IPv4 for Nodemailer on Render
// Overrides the core dns.lookup to ALWAYS use family: 4 (IPv4)
const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = { family: 4 };
  } else if (typeof options === 'object') {
    options.family = 4;
  } else {
    options = { family: 4 };
  }
  return originalLookup(hostname, options, callback);
};

// Setup transporter using Gmail SMTP with robust settings for cloud deployment
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  family: 4, // Force IPv4 to prevent ENETUNREACH on Render
  connectionTimeout: 15000, // 15 seconds
  greetingTimeout: 15000,
  socketTimeout: 15000,
});

/**
 * Sends an OTP email to the user.
 * @param {string} toEmail 
 * @param {string} otpCode 
 * @param {string} purpose 'register' or 'reset_password'
 */
async function sendOTP(toEmail, otpCode, purpose) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Email Service] EMAIL_USER or EMAIL_PASS not configured. OTP generated but NOT SENT: ' + otpCode);
    return; // Fallback so dev doesn't break if env vars are missing
  }

  let subject = '';
  let htmlContent = '';

  if (purpose === 'register') {
    subject = 'Xác minh địa chỉ email - Quản Lý Tài Chính';
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563EB; text-align: center;">Mã xác minh Email</h2>
        <p>Chào bạn,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng sử dụng mã OTP dưới đây để hoàn tất việc xác minh email:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 8px; margin: 20px 0;">
          ${otpCode}
        </div>
        <p>Mã này sẽ hết hạn trong vòng 5 phút.</p>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
      </div>
    `;
  } else if (purpose === 'reset_password') {
    subject = 'Đặt lại mật khẩu - Quản Lý Tài Chính';
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563EB; text-align: center;">Khôi phục mật khẩu</h2>
        <p>Chào bạn,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP dưới đây:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 8px; margin: 20px 0;">
          ${otpCode}
        </div>
        <p>Mã này sẽ hết hạn trong vòng 5 phút.</p>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email để đảm bảo an toàn.</p>
      </div>
    `;
  }

  const mailOptions = {
    from: `"Quản Lý Tài Chính" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: subject,
    html: htmlContent
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  sendOTP
};
