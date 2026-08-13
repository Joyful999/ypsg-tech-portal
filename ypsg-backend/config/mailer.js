// =========================================================
// YPSG Tech Portal — Brevo API Mailer
// Uses HTTPS API instead of SMTP
// =========================================================

const fs = require('fs');

async function sendEmail({
  from,
  to,
  subject,
  html,
  attachments = []
}) {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not configured.');
    }

    if (!process.env.MAIL_FROM_ADDRESS) {
      throw new Error('MAIL_FROM_ADDRESS is not configured.');
    }

    // Convert local file attachments to Base64 for Brevo API
    const formattedAttachments = [];

    for (const attachment of attachments) {
      if (!attachment.path) continue;

      if (!fs.existsSync(attachment.path)) {
        throw new Error(
          `Email attachment file not found: ${attachment.path}`
        );
      }

      const content = fs.readFileSync(attachment.path).toString('base64');

      formattedAttachments.push({
        name: attachment.filename || 'attachment',
        content
      });
    }

    const response = await fetch(
      'https://api.brevo.com/v3/smtp/email',
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name:
              process.env.MAIL_FROM_NAME ||
              'YPSG Tech Portal',
            email: process.env.MAIL_FROM_ADDRESS
          },

          to: [
            {
              email: to
            }
          ],

          subject,

          htmlContent: html,

          attachment:
            formattedAttachments.length > 0
              ? formattedAttachments
              : undefined
        })
      }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('Brevo API error:', {
        status: response.status,
        result
      });

      throw new Error(
        result?.message ||
        `Brevo API request failed with status ${response.status}`
      );
    }

    console.log('Email sent successfully through Brevo:', result);

    return result;

  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}


async function verifyMailer() {
  console.log('BREVO API CONFIG:');

  console.log({
    apiKeyConfigured: !!process.env.BREVO_API_KEY,
    fromName: process.env.MAIL_FROM_NAME,
    fromAddress: process.env.MAIL_FROM_ADDRESS
  });

  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured.');
  }

  if (!process.env.MAIL_FROM_ADDRESS) {
    throw new Error('MAIL_FROM_ADDRESS is not configured.');
  }

  console.log('Brevo API configuration OK.');
}


module.exports = {
  sendEmail,
  verifyMailer
};