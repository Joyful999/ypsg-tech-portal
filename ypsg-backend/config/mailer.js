// =========================================================
// YPSG Tech Portal — Brevo API Mailer
// =========================================================

const fs = require('fs');
const { BrevoClient } = require('@getbrevo/brevo');

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY
});

// =========================================================
// Send Email
// =========================================================
async function sendEmail({
  from,
  to,
  subject,
  html,
  attachments = []
}) {
  try {
    const attachmentList = attachments.map((attachment) => {
      let content;

      // If a local file path is provided, read the PDF
      // and convert it to base64 for Brevo.
      if (attachment.path) {
        if (!fs.existsSync(attachment.path)) {
          throw new Error(
            `Attachment file not found: ${attachment.path}`
          );
        }

        content = fs
          .readFileSync(attachment.path)
          .toString('base64');
      }

      // If a Buffer was provided
      else if (attachment.content) {
        content = Buffer.isBuffer(attachment.content)
          ? attachment.content.toString('base64')
          : Buffer.from(attachment.content).toString('base64');
      }

      if (!content) {
        throw new Error(
          `Could not read attachment: ${attachment.filename}`
        );
      }

      return {
        name: attachment.filename,
        content
      };
    });

    const emailData = {
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

    // Only add attachment property when attachments exist
    if (attachmentList.length > 0) {
      emailData.attachment = attachmentList;
    }

    console.log(
      `Sending email through Brevo API to ${to}...`
    );

    if (attachmentList.length > 0) {
      console.log(
        `Email contains ${attachmentList.length} attachment(s).`
      );

      attachmentList.forEach((attachment) => {
        console.log(
          `Attachment: ${attachment.name}`
        );
      });
    } else {
      console.log('Email contains 0 attachment(s).');
    }

    const result =
      await brevo.transactionalEmails.sendTransacEmail(
        emailData
      );

    console.log(
      'Email sent successfully through Brevo:',
      result
    );

    return result;

  } catch (error) {
    console.error(
      'Brevo email sending failed:',
      error
    );

    throw error;
  }
}

// =========================================================
// Verify Brevo Configuration
// =========================================================
async function verifyMailer() {
  console.log('BREVO API CONFIG:');

  console.log({
    apiKeyConfigured: !!process.env.BREVO_API_KEY,
    fromName: process.env.MAIL_FROM_NAME,
    fromAddress: process.env.MAIL_FROM_ADDRESS
  });

  if (!process.env.BREVO_API_KEY) {
    throw new Error(
      'BREVO_API_KEY is not configured'
    );
  }

  if (!process.env.MAIL_FROM_ADDRESS) {
    throw new Error(
      'MAIL_FROM_ADDRESS is not configured'
    );
  }

  console.log(
    'Brevo API configuration OK.'
  );
}

module.exports = {
  sendEmail,
  verifyMailer
};