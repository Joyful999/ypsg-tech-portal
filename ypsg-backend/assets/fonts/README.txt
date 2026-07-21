Add these TTF files here to make the certificate PDF use the site's actual
typefaces (Cinzel for headings, Poppins for body text) instead of PDFKit's
built-in Times-Roman / Helvetica fallback:

  Cinzel-Bold.ttf
  Cinzel-Regular.ttf
  Poppins-Regular.ttf
  Poppins-SemiBold.ttf

Both families are free/open (SIL Open Font License) and available from
Google Fonts: https://fonts.google.com/specimen/Cinzel and
https://fonts.google.com/specimen/Poppins — download the family ZIP and
copy the four files above into this folder.

utils/generateCertificatePdf.js checks for these files at startup and
falls back automatically if they're missing, so the app still works
without them — the certificate just won't match the web fonts exactly.
