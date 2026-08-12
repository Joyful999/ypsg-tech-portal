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
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      attachments
    });

    // Resend can return an error without throwing.
    if (error) {
      console.error('Resend email error:', error);
      throw new Error(error.message || 'Resend failed to send the email.');
    }

    console.log('Email sent successfully:', data);

    return data;
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