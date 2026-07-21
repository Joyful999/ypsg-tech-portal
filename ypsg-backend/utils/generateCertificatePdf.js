// =========================================================
// Certificate PDF generator (PDFKit) — landscape A4,
// ceremonial border, logos, gold oval seal, signatures.
//
// ASSETS: logo.png, logo1.jpg, signature.png, signature1.png
// live in ./assets/certificate (inside THIS backend project —
// not a sibling frontend folder, so path resolution can't
// silently break depending on how the frontend is named/laid
// out). Override the folder with CERTIFICATE_ASSETS_DIR in .env
// if you keep them somewhere else.
//
// Run `node utils/checkCertificateAssets.js` any time the
// emailed certificate looks different from the dashboard
// preview — it tells you exactly which files it did/didn't find.
// =========================================================
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const OLIVE = '#556B2F';
const OLIVE_DARK = '#3E4F22';
const GOLD = '#D4AF37';
const GOLD_LIGHT = '#F1E4B8';
const TEXT = '#333333';
const TEXT_SOFT = '#6B6F66';

const FONTS_DIR = path.join(__dirname, '..', 'assets', 'fonts');
const HEADING_FONT_PATH = path.join(FONTS_DIR, 'Cinzel-Bold.ttf');
const HEADING_FONT_REG_PATH = path.join(FONTS_DIR, 'Cinzel-Regular.ttf');
const BODY_FONT_PATH = path.join(FONTS_DIR, 'Poppins-Regular.ttf');
const BODY_FONT_BOLD_PATH = path.join(FONTS_DIR, 'Poppins-SemiBold.ttf');

// Self-contained by default — override via .env if your assets live elsewhere.
const CERT_ASSETS_DIR = process.env.CERTIFICATE_ASSETS_DIR
  || path.join(__dirname, '..', 'assets', 'certificate');

const LOGO_PATH = path.join(CERT_ASSETS_DIR, 'logo.png');
const LOGO_1_PATH = path.join(CERT_ASSETS_DIR, 'logo1.jpg');
const SIGNATURE_PATH = path.join(CERT_ASSETS_DIR, 'signature.png');
const SIGNATURE_1_PATH = path.join(CERT_ASSETS_DIR, 'signature1.png');

/** Draws an image only if it exists, and warns loudly (once per process) if it doesn't. */
const _warnedPaths = new Set();
function safeImage(doc, imgPath, x, y, opts) {
  if (fs.existsSync(imgPath)) {
    doc.image(imgPath, x, y, opts);
    return true;
  }
  if (!_warnedPaths.has(imgPath)) {
    console.warn(`[certificate] Image not found, skipping: ${imgPath}`);
    _warnedPaths.add(imgPath);
  }
  return false;
}

function registerFonts(doc) {
  const hasHeadingBold = fs.existsSync(HEADING_FONT_PATH);
  const hasHeadingReg = fs.existsSync(HEADING_FONT_REG_PATH);
  const hasBody = fs.existsSync(BODY_FONT_PATH);
  const hasBodyBold = fs.existsSync(BODY_FONT_BOLD_PATH);

  [
    [hasHeadingBold, HEADING_FONT_PATH],
    [hasHeadingReg, HEADING_FONT_REG_PATH],
    [hasBody, BODY_FONT_PATH],
    [hasBodyBold, BODY_FONT_BOLD_PATH]
  ].forEach(([found, fontPath]) => {
    if (!found && !_warnedPaths.has(fontPath)) {
      console.warn(`[certificate] Font not found, falling back: ${fontPath}`);
      _warnedPaths.add(fontPath);
    }
  });

  if (hasHeadingBold) doc.registerFont('Heading-Bold', HEADING_FONT_PATH);
  if (hasHeadingReg) doc.registerFont('Heading-Regular', HEADING_FONT_REG_PATH);
  if (hasBody) doc.registerFont('Body-Regular', BODY_FONT_PATH);
  if (hasBodyBold) doc.registerFont('Body-Bold', BODY_FONT_BOLD_PATH);

  return {
    headingBold: hasHeadingBold ? 'Heading-Bold' : 'Times-Bold',
    headingRegular: hasHeadingReg ? 'Heading-Regular' : 'Times-Roman',
    bodyRegular: hasBody ? 'Body-Regular' : 'Helvetica',
    bodyBold: hasBodyBold ? 'Body-Bold' : 'Helvetica-Bold'
  };
}

function drawWatermark(doc, width, height) {
  doc.save();
  doc.opacity(0.05);
  doc.strokeColor(OLIVE);
  doc.lineWidth(1);

  const cx = width / 2;
  const cy = height / 2;
  [140, 100, 60].forEach(r => doc.circle(cx, cy, r).stroke());

  const spokes = [0, 45, 90, 135, 180, 225, 270, 315];
  spokes.forEach(angle => {
    const rad = (angle * Math.PI) / 180;
    const x1 = cx + Math.cos(rad) * 60;
    const y1 = cy + Math.sin(rad) * 60;
    const x2 = cx + Math.cos(rad) * 150;
    const y2 = cy + Math.sin(rad) * 150;
    doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
  });

  doc.restore();
}

/** Walks the rectangle's perimeter and returns the point + outward normal + edge angle at distance `d`. */
function pointAtPerimeterDistance(x, y, w, h, d) {
  if (d <= w) return { px: x + d, py: y, angle: 0 };
  d -= w;
  if (d <= h) return { px: x + w, py: y + d, angle: 90 };
  d -= h;
  if (d <= w) return { px: x + w - d, py: y + h, angle: 180 };
  d -= w;
  return { px: x, py: y + h - d, angle: 270 };
}

/** A continuous ring of small alternating gold/olive ornaments running the full perimeter. */
function drawPerimeterTrim(doc, x, y, w, h) {
  const perimeter = 2 * (w + h);
  const step = 22;
  const count = Math.floor(perimeter / step);

  doc.save();
  for (let i = 0; i < count; i++) {
    const d = i * step;
    const { px, py } = pointAtPerimeterDistance(x, y, w, h, d);
    const cycle = i % 4;

    if (cycle === 0) {
      // small solid gold dot ("berry")
      doc.circle(px, py, 2.6).fillColor(GOLD).fill();
    } else if (cycle === 2) {
      // small olive diamond
      doc.save();
      doc.translate(px, py).rotate(45);
      doc.rect(-2.4, -2.4, 4.8, 4.8).fillColor(OLIVE_DARK).fill();
      doc.restore();
    } else {
      // tiny gold connector dot
      doc.circle(px, py, 1.1).fillColor(GOLD).fill();
    }
  }
  doc.restore();
}

function drawBorders(doc, width, height) {
  const outerMargin = 24;
  const innerMargin = 40;

  doc.save();
  doc.lineJoin('round').lineCap('round');

  doc.lineWidth(8);
  doc.strokeColor(OLIVE_DARK);
  doc.roundedRect(outerMargin, outerMargin, width - outerMargin * 2, height - outerMargin * 2, 16).stroke();

  doc.lineWidth(2);
  doc.strokeColor(GOLD);
  doc.roundedRect(innerMargin, innerMargin, width - innerMargin * 2, height - innerMargin * 2, 14).stroke();

  doc.restore();

  // Continuous decorative trim wrapping the entire perimeter, sitting
  // between the two border lines.
  const trimMargin = (outerMargin + innerMargin) / 2 + 3;
  drawPerimeterTrim(
    doc,
    trimMargin, trimMargin,
    width - trimMargin * 2, height - trimMargin * 2
  );
}

function drawHeader(doc, width, fonts) {
  const logoY = 46;
  const logoSize = 66;
  const logoInset = 84; // distance from the page edge — brings logos closer to the centered header text

  safeImage(doc, LOGO_PATH, logoInset, logoY, {
    width: logoSize, height: logoSize, fit: [logoSize, logoSize], align: 'center', valign: 'center'
  });
  safeImage(doc, LOGO_1_PATH, width - logoInset - logoSize, logoY, {
    width: logoSize, height: logoSize, fit: [logoSize, logoSize], align: 'center', valign: 'center'
  });

  doc.fillColor(OLIVE_DARK)
    .font(fonts.headingBold)
    .fontSize(15)
    .text('YORUBA POLITICAL SUPPORT GROUP (YPSG)', 0, 58, { width, align: 'center' });

  doc.fillColor(TEXT_SOFT)
    .font(fonts.bodyBold)
    .fontSize(11)
    .text('YOUTH TECH EMPOWERMENT PROGRAM', 0, 82, { width, align: 'center', characterSpacing: 0.6 });
}

/** Gold oval seal, now displaying the same logo used on the left of the header. */
function drawSeal(doc, x, y, fonts) {
  doc.save();

  const rx = 78;
  const ry = 62;

  doc.save();
  doc.translate(x, y);
  doc.lineWidth(3);
  doc.strokeColor(GOLD);
  doc.ellipse(0, 0, rx, ry).fillAndStroke('#FFFFFF', GOLD);

  doc.lineWidth(1);
  doc.strokeColor(OLIVE);
  doc.ellipse(0, 0, rx - 8, ry - 8).stroke();

  const logoSize = 88;
  safeImage(doc, LOGO_PATH, -logoSize / 2, -logoSize / 2, {
    width: logoSize, height: logoSize, fit: [logoSize, logoSize], align: 'center', valign: 'center'
  });

  doc.restore();

  doc.restore();
}

function drawSignatureBlock(doc, x, y, signaturePath, name, title, fonts) {
  const signatureY = y - 34;
  const lineY = y;

  doc.save();
  safeImage(doc, signaturePath, x - 50, signatureY, { width: 100, height: 32, fit: [100, 32] });

  doc.strokeColor(TEXT_SOFT).lineWidth(0.8);
  doc.moveTo(x - 90, lineY).lineTo(x + 90, lineY).stroke();

  doc.fillColor(TEXT)
    .font(fonts.bodyBold)
    .fontSize(10)
    .text(name, x - 105, lineY + 8, { width: 210, align: 'center' });

  doc.fillColor(TEXT_SOFT)
    .font(fonts.bodyRegular)
    .fontSize(8.5)
    .text(title, x - 115, lineY + 24, { width: 230, align: 'center' });
  doc.restore();
}

/**
 * Generates the certificate PDF and writes it to outputPath.
 * @param {{ fullName: string, outputPath: string }} params
 * @returns {Promise<string>} resolves with outputPath on success
 */
function generateCertificatePdf({ fullName, outputPath }) {
  return new Promise((resolve, reject) => {
    try {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });

      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0, compress: false });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const { width, height } = doc.page;
      const fonts = registerFonts(doc);

      doc.rect(0, 0, width, height).fill('#FFFFFF');
      drawWatermark(doc, width, height);
      drawBorders(doc, width, height);
      drawHeader(doc, width, fonts);

      const centerX = width / 2;
      let cursorY = 128;

      doc.fillColor(OLIVE_DARK).font(fonts.headingBold).fontSize(30)
        .text('Certificate of Participation', 0, cursorY, { width, align: 'center' });

      cursorY += 48;
      doc.fillColor(TEXT_SOFT).font(fonts.bodyRegular).fontSize(12)
        .text('This Certificate is Proudly Presented to', 0, cursorY, { width, align: 'center' });

      cursorY += 26;
      doc.fillColor(GOLD)
        .font(fonts.headingBold)
        .fontSize(fitNameFontSize(doc, fonts.headingBold, fullName, width - 220))
        .text(fullName, 110, cursorY, { width: width - 220, align: 'center' });

      cursorY += 58;
      doc.fillColor(TEXT).font(fonts.bodyRegular).fontSize(11.5)
        .text(
          'For successfully participating in the YPSG Youth Tech Empowerment Seminar themed:',
          120, cursorY, { width: width - 240, align: 'center' }
        );

      cursorY += 22;
      doc.fillColor(TEXT).font(fonts.bodyRegular).fontSize(11.5)
        .text(
          '"Preparing the Youth for a Better Future Through Technology and Innovation."',
          120, cursorY, { width: width - 240, align: 'center', oblique: true }
        );

      cursorY += 34;
      doc.fillColor(TEXT_SOFT).font(fonts.bodyRegular).fontSize(11)
        .text('Awarded this 31st Day of July, 2026.', 0, cursorY, { width, align: 'center' });

      const sigY = height - 130;
      const leftSigX = 210;
      const rightSigX = width - 210;

      drawSignatureBlock(
        doc, leftSigX, sigY, SIGNATURE_PATH,
        'Aiyegburoju Emmanuel Oluwatosin',
        'Convenor, Youth Tech Empowerment Program YPSG, Imo State.',
        fonts
      );
      drawSignatureBlock(
        doc, rightSigX, sigY, SIGNATURE_1_PATH,
        'Arc. Amb. (Dr.) Oshinowo Adedeji',
        'National Coordinator, Yoruba Political Support Group (YPSG), Imo State.',
        fonts
      );
      drawSeal(doc, centerX, sigY - 6, fonts);

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

/** Shrinks the name's font size until it fits on one line within maxWidth. */
function fitNameFontSize(doc, font, text, maxWidth) {
  let size = 34;
  doc.font(font);
  while (size > 18 && doc.fontSize(size).widthOfString(text) > maxWidth) {
    size -= 1;
  }
  return size;
}

module.exports = { generateCertificatePdf };