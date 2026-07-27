const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
});

async function test() {
  try {
    console.log('Testing SMTP connection with user:', process.env.EMAIL_USER);
    await transporter.verify();
    console.log('Server is ready to take our messages');
    
    const info = await transporter.sendMail({
      from: `"Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Test email",
      text: "This is a test",
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

test();
