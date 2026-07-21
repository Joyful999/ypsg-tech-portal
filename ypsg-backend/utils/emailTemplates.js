// =========================================================
// Email templates
// =========================================================

/** HTML body for the certificate delivery email. */
function certificateEmailHtml({ fullName }) {
  return `
  <div style="font-family: 'Poppins', Arial, sans-serif; background:#F8F9FA; padding:32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px; background:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #eee;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#556B2F; padding:28px 32px;">
                <span style="color:#D4AF37; font-size:12px; letter-spacing:2px; text-transform:uppercase;">YPSG Tech Portal</span>
                <h1 style="color:#ffffff; font-size:20px; margin:8px 0 0; font-family: Georgia, 'Times New Roman', serif;">
                  Youth Tech Empowerment Seminar
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="font-size:15px; color:#333333; margin:0 0 16px;">Dear ${escapeHtml(fullName)},</p>
                <p style="font-size:15px; color:#333333; line-height:1.6; margin:0 0 16px;">
                  Congratulations! Your certificate of participation for the
                  <strong>YPSG Youth Tech Empowerment Seminar</strong> has been generated and is attached to this email.
                </p>
                <p style="font-size:15px; color:#333333; line-height:1.6; margin:0 0 16px;">
                  Thank you for joining us as we prepare the youth for a better future through
                  technology and innovation. We hope the seminar sparked new ideas, new connections,
                  and a clearer sense of where you can take your skills next.
                </p>
                <p style="font-size:15px; color:#333333; line-height:1.6; margin:0 0 28px;">
                  If you have any questions about your certificate or the seminar, we're happy to help.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px; color:#6B6F66;">
                  <tr><td style="padding:4px 0;">📧 aiyegburojuemmanuel77@gmail.com</td></tr>
                  <tr><td style="padding:4px 0;">📞 +234 808 530 8950</td></tr>
                </table>
                 <p style="font-size:15px; color:#333333; line-height:1.6; margin:0 0 28px;">
                  Do not respond to this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#F8F9FA; padding:20px 32px; text-align:center;">
                <p style="font-size:12px; color:#6B6F66; margin:0;">
                  &copy; ${new Date().getFullYear()} Yoruba Political Support Group. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { certificateEmailHtml };
