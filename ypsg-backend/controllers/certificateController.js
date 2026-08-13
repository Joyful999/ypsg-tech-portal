// =========================================================
// Certificate controller — generate / status / download
// =========================================================

const path = require('path');
const fs = require('fs');

const userModel = require('../models/userModel');
const certificateModel = require('../models/certificateModel');

const { generateCertificatePdf } = require('../utils/generateCertificatePdf');
const { sendEmail } = require('../config/mailer');
const { certificateEmailHtml } = require('../utils/emailTemplates');

const CERTIFICATES_DIR = path.join(
  __dirname,
  '..',
  'uploads',
  'certificates'
);

async function generate(req, res) {
  const { certificateName } = req.body;
  const userId = req.user.id;

  const user = await userModel.findUserById(userId);

  if (!user) {
    return res.status(404).json({
      message: 'User not found.'
    });
  }

  const existing = await certificateModel.findByUserId(userId);

  if (existing && !existing.regeneration_allowed) {
    return res.status(409).json({
      message:
        'A certificate has already been generated for this account. Contact an administrator if a correction is needed.'
    });
  }

  // Admin explicitly unlocked regeneration.
  // Consume the old record and the allowance.
  if (existing && existing.regeneration_allowed) {
    const oldPath = path.join(__dirname, '..', existing.file_path);

    fs.unlink(oldPath, () => {}); // best-effort cleanup

    await certificateModel.deleteForRegeneration(userId);
  }

  const safeFileName = `certificate-${userId}-${Date.now()}.pdf`;

  const absolutePath = path.join(
    CERTIFICATES_DIR,
    safeFileName
  );

  const relativePath = path.join(
    'uploads',
    'certificates',
    safeFileName
  );

  // Generate certificate PDF
  await generateCertificatePdf({
    fullName: certificateName.trim(),
    outputPath: absolutePath
  });

  // Save certificate record
  const certificate = await certificateModel.create({
    userId,
    certificateName: certificateName.trim(),
    filePath: relativePath
  });


  // Attempt to email certificate immediately.
// Email failure should NOT prevent certificate generation/download.
try {
  // Read the generated PDF into memory.
  // Resend accepts the PDF as a Buffer attachment.
  const certificateBuffer = fs.readFileSync(absolutePath);

await sendEmail({
  from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
  to: user.email,
  subject: 'YPSG Youth Tech Empowerment Seminar Certificate',
  html: certificateEmailHtml({
    fullName: certificateName.trim()
  }),
  attachments: [
    {
      filename: 'YPSG-Certificate.pdf',
      content: certificateBuffer
    }
  ]
});

  await certificateModel.markEmailed(certificate.id);

  console.log(
    `Certificate email sent successfully to ${user.email}`
  );

} catch (err) {
  console.error(
    'Failed to send certificate email:',
    err
  );

  await certificateModel.markEmailFailed(certificate.id);
}
}

  // Attempt to email certificate immediately.
  // Email failure should NOT prevent certificate generation/download.
//   try {
//     await sendEmail({
//       from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
//       to: user.email,
//       subject: 'YPSG Youth Tech Empowerment Seminar Certificate',
//       html: certificateEmailHtml({
//         fullName: certificateName.trim()
//       }),
//       attachments: [
//         {
//           filename: 'YPSG-Certificate.pdf',
//           path: absolutePath
//         }
//       ]
//     });

//     await certificateModel.markEmailed(certificate.id);

//     console.log(
//       `Certificate email sent successfully to ${user.email}`
//     );

//   } catch (err) {
//     console.error(
//       'Failed to send certificate email:',
//       err
//     );

//     await certificateModel.markEmailFailed(certificate.id);
//   }

//   const updated = await certificateModel.findById(
//     certificate.id
//   );

//   return res.status(201).json({
//     message: 'Certificate generated successfully.',
//     certificate: {
//       name: updated.certificate_name,
//       status: updated.status,
//       generatedAt: updated.generated_at,
//       emailedAt: updated.emailed_at
//     }
//   });
// }

async function status(req, res) {
  const certificate =
    await certificateModel.findByUserId(req.user.id);

  if (!certificate) {
    return res.json({
      certificate: null
    });
  }

  return res.json({
    certificate: {
      name: certificate.certificate_name,
      status: certificate.status,
      generatedAt: certificate.generated_at,
      emailedAt: certificate.emailed_at
    }
  });
}

async function download(req, res) {
  const certificate =
    await certificateModel.findByUserId(req.user.id);

  if (!certificate) {
    return res.status(404).json({
      message:
        'No certificate has been generated for this account yet.'
    });
  }

  const absolutePath = path.join(
    __dirname,
    '..',
    certificate.file_path
  );

  if (!fs.existsSync(absolutePath)) {
    return res.status(410).json({
      message:
        'Certificate file is no longer available. Please contact an administrator.'
    });
  }

  return res.download(
    absolutePath,
    'YPSG-Certificate.pdf'
  );
}

async function updateFilePath(certificateId, filePath) {
  const [result] = await pool.query(
    'UPDATE certificates SET file_path = ? WHERE id = ?',
    [filePath, certificateId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  generate,
  status,
  download,
  updateFilePath
};













// // =========================================================
// // Certificate controller — generate / status / download
// // =========================================================
// const path = require('path');
// const fs = require('fs');
// const userModel = require('../models/userModel');
// const certificateModel = require('../models/certificateModel');
// const { generateCertificatePdf } = require('../utils/generateCertificatePdf');
// const { transporter } = require('../config/mailer');
// const { certificateEmailHtml } = require('../utils/emailTemplates');

// const CERTIFICATES_DIR = path.join(__dirname, '..', 'uploads', 'certificates');

// async function generate(req, res) {
//   const { certificateName } = req.body;
//   const userId = req.user.id;

//   const user = await userModel.findUserById(userId);
//   if (!user) return res.status(404).json({ message: 'User not found.' });

//   const existing = await certificateModel.findByUserId(userId);
//   if (existing && !existing.regeneration_allowed) {
//     return res.status(409).json({
//       message: 'A certificate has already been generated for this account. Contact an administrator if a correction is needed.'
//     });
//   }

//   // Admin explicitly unlocked regeneration — consume the old record and the allowance.
//   if (existing && existing.regeneration_allowed) {
//     const oldPath = path.join(__dirname, '..', existing.file_path);
//     fs.unlink(oldPath, () => {}); // best-effort cleanup, ignore errors
//     await certificateModel.deleteForRegeneration(userId);
//   }

//   const safeFileName = `certificate-${userId}-${Date.now()}.pdf`;
//   const absolutePath = path.join(CERTIFICATES_DIR, safeFileName);
//   const relativePath = path.join('uploads', 'certificates', safeFileName);

//   await generateCertificatePdf({ fullName: certificateName.trim(), outputPath: absolutePath });

//   const certificate = await certificateModel.create({
//     userId,
//     certificateName: certificateName.trim(),
//     filePath: relativePath
//   });

//   // Attempt to email the certificate immediately. A failure here shouldn't
//   // block the user from having generated + being able to download it.
//   try {
//     await transporter.sendMail({
//       from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
//       to: user.email,
//       subject: 'YPSG Youth Tech Empowerment Seminar Certificate',
//       html: certificateEmailHtml({ fullName: certificateName.trim() }),
//       attachments: [{ filename: 'YPSG-Certificate.pdf', path: absolutePath }]
//     });
//     await certificateModel.markEmailed(certificate.id);
//   } catch (err) {
//     console.error('Failed to send certificate email:', err);
//     await certificateModel.markEmailFailed(certificate.id);
//   }

//   const updated = await certificateModel.findById(certificate.id);
//   return res.status(201).json({
//     message: 'Certificate generated successfully.',
//     certificate: {
//       name: updated.certificate_name,
//       status: updated.status,
//       generatedAt: updated.generated_at,
//       emailedAt: updated.emailed_at
//     }
//   });
// }

// async function status(req, res) {
//   const certificate = await certificateModel.findByUserId(req.user.id);
//   if (!certificate) return res.json({ certificate: null });

//   return res.json({
//     certificate: {
//       name: certificate.certificate_name,
//       status: certificate.status,
//       generatedAt: certificate.generated_at,
//       emailedAt: certificate.emailed_at
//     }
//   });
// }

// async function download(req, res) {
//   const certificate = await certificateModel.findByUserId(req.user.id);
//   if (!certificate) {
//     return res.status(404).json({ message: 'No certificate has been generated for this account yet.' });
//   }

//   const absolutePath = path.join(__dirname, '..', certificate.file_path);
//   if (!fs.existsSync(absolutePath)) {
//     return res.status(410).json({ message: 'Certificate file is no longer available. Please contact an administrator.' });
//   }

//   return res.download(absolutePath, 'YPSG-Certificate.pdf');
// }

// module.exports = { generate, status, download };
