const nodemailer = require('nodemailer');

function getMailer() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || 'true').toLowerCase() === 'true',
    },
  });
}

const normalizeInput = (emailOrPayload, otp) => {
  if (emailOrPayload && typeof emailOrPayload === 'object') {
    return {
      email: emailOrPayload.email,
      otp: emailOrPayload.otp,
    };
  }

  return { email: emailOrPayload, otp };
};

async function sendContactEmails(emailOrPayload, otpArg) {
  const { email, otp } = normalizeInput(emailOrPayload, otpArg);

  if (!email || !otp) {
    throw new Error('Email and OTP are required to send OTP email.');
  }

  const transporter = getMailer();
  if (!transporter) {
    throw new Error('SMTP configuration is missing.');
  }

  const fromName = process.env.MAIL_FROM_NAME || 'LeadManager OTP';
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;
  const fromHeader = process.env.MAIL_FROM || `"${fromName}" <${fromEmail}>`;

  const customerText = `Your OTP is : ${otp}`;

  const info = await transporter.sendMail({
    from: fromHeader,
    to: email,
    subject: 'Your OTP',
    text: customerText,
  });

  console.log('OTP mail queued:', {
    to: email,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
    messageId: info.messageId,
  });

  return info;
}

module.exports = { sendContactEmails };
