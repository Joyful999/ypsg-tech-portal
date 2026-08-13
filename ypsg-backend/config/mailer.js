// =========================================================
// Brevo API Mailer
// =========================================================

const fs = require('fs');
const Brevo = require('@getbrevo/brevo');

const apiInstance = new Brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

async function sendEmail({
  from,
  to,
  subject,
  html,
  attachments = []
}) {
  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: process.env.MAIL_FROM_NAME || 'YPSG Tech Portal',
      email: process.env.MAIL_FROM_ADDRESS
    };

    sendSmtpEmail.to = [
      {
        email: to
      }
    ];

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;

    // ---------------------------------------------------------
    // Attachments
    // ---------------------------------------------------------
    if (attachments.length > 0) {
      sendSmtpEmail.attachment = attachments.map((attachment) => {
        let content;

        if (attachment.path) {
          content = fs.readFileSync(attachment.path).toString('base64');
        } else if (attachment.content) {
          content = Buffer.isBuffer(attachment.content)
            ? attachment.content.toString('base64')
            : Buffer.from(attachment.content).toString('base64');
        }

        return {
          name: attachment.filename,
          content
        };
      });
    }

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log('Email sent successfully through Brevo:', result);

    return result;
  } catch (error) {
    console.error('Brevo email sending failed:', error);
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