// =========================================================
// YPSG Tech Portal — Brevo Email Configuration
// =========================================================

const fs = require('fs');
const { BrevoClient } = require('@getbrevo/brevo');

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY
});

/**
 * Send an email through Brevo.
 *
 * Attachments must be converted to base64 because
 * Brevo's API does not accept a local filesystem path.
 */
async function sendEmail({
  from,
  to,
  subject,
  html,
  attachments = []
}) {
  try {
    const formattedAttachments = attachments.map((attachment) => {
      if (!attachment.path) {
        throw new Error(
          `Attachment path is missing for ${attachment.filename}`
        );
      }

      if (!fs.existsSync(attachment.path)) {
        throw new Error(
          `Attachment file does not exist: ${attachment.path}`
        );
      }

      const fileBuffer = fs.readFileSync(attachment.path);

      return {
        name: attachment.filename,
        content: fileBuffer.toString('base64')
      };
    });

    console.log('Sending email through Brevo API...');
    console.log(
      `Email contains ${formattedAttachments.length} attachment(s).`
    );

    const result = await brevo.transactionalEmails.sendTransacEmail({
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
      htmlContent: html,
      attachment: formattedAttachments
    });

    console.log(
      'Email sent successfully through Brevo:',
      result
    );

    return result;

  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}


/**
 * Verify Brevo configuration.
 */
async function verifyMailer() {
  console.log('BREVO API CONFIG:');

  console.log({
    apiKeyConfigured: !!process.env.BREVO_API_KEY,
    fromName: process.env.MAIL_FROM_NAME,
    fromAddress: process.env.MAIL_FROM_ADDRESS
  });

  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  if (!process.env.MAIL_FROM_ADDRESS) {
    throw new Error('MAIL_FROM_ADDRESS is not configured');
  }

  console.log('Brevo API configuration OK.');
}


module.exports = {
  sendEmail,
  verifyMailer
};