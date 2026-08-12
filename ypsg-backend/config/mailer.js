const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({
  from,
  to,
  subject,
  html,
  attachments = []
}) {
  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      attachments
    });

    console.log('Email sent successfully:', result);

    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

async function verifyMailer() {
  console.log('RESEND CONFIG:');

  console.log({
    apiKeyConfigured: !!process.env.RESEND_API_KEY,
    fromName: process.env.MAIL_FROM_NAME,
    fromAddress: process.env.MAIL_FROM_ADDRESS
  });

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  if (!process.env.MAIL_FROM_ADDRESS) {
    throw new Error('MAIL_FROM_ADDRESS is not configured');
  }

  console.log('Resend configuration OK');
}

module.exports = {
  sendEmail,
  verifyMailer
};

















// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT),
//   secure: process.env.SMTP_SECURE === 'true',

//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASSWORD,
//   },

//   connectionTimeout: 30000,
//   greetingTimeout: 30000,
//   socketTimeout: 30000,

//   logger: true,
//   debug: true
// });

// async function verifyMailer() {
//   console.log("SMTP CONFIG:");
//   console.log({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     secure: process.env.SMTP_SECURE,
//     user: process.env.SMTP_USER
//   });

//   await transporter.verify();
// }

// module.exports = { transporter, verifyMailer };