const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { generateCertificatePdf } = require('../utils/generateCertificatePdf');

test('generateCertificatePdf includes the requested certificate wording', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ypsg-cert-'));
  const outputPath = path.join(tmpDir, 'certificate.pdf');

  await generateCertificatePdf({
    fullName: 'Ada Okafor',
    outputPath
  });

  assert.ok(fs.existsSync(outputPath), 'certificate PDF should be created');

  const pdfContent = fs.readFileSync(outputPath, 'utf8');
  assert.match(pdfContent, /YORUBA POLITICAL SUPPORT GROUP \(YPSG\)/i);
  assert.match(pdfContent, /YOUTH TECH EMPOWERMENT PROGRAM/i);
  assert.match(pdfContent, /EMPOWERING YOUTH BUILDING THE FUTURE/i);
  assert.match(pdfContent, /Aiyegburoju Emmanuel Oluwatosin/i);
  assert.match(pdfContent, /Arc\. Amb\. \(Dr\.\) Oshinowo Adedeji/i);
});
