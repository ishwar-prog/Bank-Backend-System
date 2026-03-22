require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Bank-Backend" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

 async function sendRegisterEmail(to, name) {\
    const subject  = "Welcome to Bank-Backend!";
    const text = `Hi ${name},\n\nWelcome to Bank-Backend! We're excited to have you on board. If you have any questions or need assistance, feel free to reach out.\n\nBest regards,\nThe Bank-Backend Team`;
    const html = `<p>Hi ${name},</p><p>Welcome to Bank-Backend! We're excited to have you on board. If you have any questions or need assistance, feel free to reach out.</p><p>Best regards,<br>The Bank-Backend Team</p>`;

    await sendEmail(to, subject, text, html);
 }

module.exports = { sendEmail, sendRegisterEmail };