// =========================================================
// YPSG Tech Portal — Brevo API Mailer
// HTTPS API — no SMTP
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

    const formattedAttachments = [];

    for (const attachment of attachments) {
      if (!attachment.path) {
        console.warn('Attachment has no path:', attachment);
        continue;
      }

      if (!fs.existsSync(attachment.path)) {
        throw new Error(
          `Attachment file does not exist: ${attachment.path}`
        );
      }

      const stats = fs.statSync(attachment.path);

      console.log('Preparing email attachment:', {
        path: attachment.path,
        filename: attachment.filename,
        size: stats.size
      });

      if (stats.size === 0) {
        throw new Error(
          `Attachment file is empty: ${attachment.path}`
        );
      }

      const fileContent = fs.readFileSync(attachment.path);

      formattedAttachments.push({
        name: attachment.filename || 'attachment.pdf',
        content: fileContent.toString('base64')
      });
    }

    console.log(
      `Email contains ${formattedAttachments.length} attachment(s).`
    );

    const emailPayload = {
      sender: {
        name: process.env.MAIL_FROM_NAME || 'YPSG Tech Portal',
        email: process.env.MAIL_FROM_ADDRESS
      },

      to: [
        {
          email: to
        }
      ],

      subject,

      htmlContent: html
    };

    // Only add attachment property when an attachment exists
    if (formattedAttachments.length > 0) {
      emailPayload.attachment = formattedAttachments;
    }

    console.log('Sending email through Brevo API...');

    const response = await fetch(
      'https://api.brevo.com/v3/smtp/email',
      {
        method: 'POST',

        headers: {
          accept: 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },

        body: JSON.stringify(emailPayload)
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