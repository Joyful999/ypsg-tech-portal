// =========================================================
// YPSG Tech Portal — Email configuration
// Brevo SMTP + Nodemailer
// =========================================================

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000
});

async function sendEmail({
  from,
  to,
  subject,
  html,
  attachments = []
}) {
  try {
    const result = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments
    });

    console.log('Email sent successfully:', {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected
    });

    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

async function verifyMailer() {
  console.log('SMTP CONFIG:');

  console.log({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    userConfigured: !!process.env.SMTP_USER,
    passwordConfigured: !!process.env.SMTP_PASSWORD,
    fromName: process.env.MAIL_FROM_NAME,
    fromAddress: process.env.MAIL_FROM_ADDRESS
  });

  if (!process.env.SMTP_HOST) {
    throw new Error('SMTP_HOST is not configured');
  }

  if (!process.env.SMTP_USER) {
    throw new Error('SMTP_USER is not configured');
  }

  if (!process.env.SMTP_PASSWORD) {
    throw new Error('SMTP_PASSWORD is not configured');
  }

  if (!process.env.MAIL_FROM_ADDRESS) {
    throw new Error('MAIL_FROM_ADDRESS is not configured');
  }

  await transporter.verify();

  console.log('SMTP connection OK.');
}

module.exports = {
  transporter,
  sendEmail,
  verifyMailer
};