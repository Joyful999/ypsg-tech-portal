// =========================================================
// Run this to check whether the certificate generator can
// actually find your logos, signatures, and fonts:
//
//   node utils/checkCertificateAssets.js
//
// It prints the exact absolute path checked for each asset,
// and whether it was found — use it whenever the emailed
// certificate looks different from the dashboard preview.
// =========================================================
const fs = require('fs');
const path = require('path');

const CERT_ASSETS_DIR = process.env.CERTIFICATE_ASSETS_DIR
  || path.join(__dirname, '..', 'assets', 'certificate');
const FONTS_DIR = path.join(__dirname, '..', 'assets', 'fonts');

const checks = [
  ['Logo (left)', path.join(CERT_ASSETS_DIR, 'logo.png')],
  ['Logo (right)', path.join(CERT_ASSETS_DIR, 'logo1.jpg')],
  ['Signature 1 (Convenor)', path.join(CERT_ASSETS_DIR, 'signature.png')],
  ['Signature 2 (National Coordinator)', path.join(CERT_ASSETS_DIR, 'signature1.png')],
  ['Heading font (Bold)', path.join(FONTS_DIR, 'Cinzel-Bold.ttf')],
  ['Heading font (Regular)', path.join(FONTS_DIR, 'Cinzel-Regular.ttf')],
  ['Body font (Regular)', path.join(FONTS_DIR, 'Poppins-Regular.ttf')],
  ['Body font (SemiBold)', path.join(FONTS_DIR, 'Poppins-SemiBold.ttf')]
];

console.log(`\nChecking certificate assets in: ${CERT_ASSETS_DIR}`);
console.log(`Checking fonts in:              ${FONTS_DIR}\n`);

let missingCount = 0;
checks.forEach(([label, filePath]) => {
  const exists = fs.existsSync(filePath);
  if (!exists) missingCount++;
  console.log(`${exists ? '✅ FOUND  ' : '❌ MISSING'}  ${label.padEnd(34)} ${filePath}`);
});

console.log(
  missingCount === 0
    ? '\nAll certificate assets found. The emailed PDF should match the dashboard preview.\n'
    : `\n${missingCount} asset(s) missing — those elements will be silently skipped in the generated PDF.\nCopy the missing files to the paths shown above, then re-run this check.\n`
);