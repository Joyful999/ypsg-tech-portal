const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    },

    connectionTimeout: 60000,
    greetingTimeout: 60000,
    socketTimeout: 60000
});

async function verifyMailer() {
    await transporter.verify();
}

module.exports = {
    transporter,
    verifyMailer
};