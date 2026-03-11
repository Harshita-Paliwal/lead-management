const nodemailer = require('nodemailer');
require('dotenv').config();

const toBool = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  return fallback;
};

// Converts env values to boolean secure flag (auto true for port 465).
const parseSecure = (secureValue, portValue) => {
  if (typeof secureValue === 'string') return secureValue.trim().toLowerCase() === 'true';
  return Number(portValue) === 465;
};

// Builds nodemailer config in one place for primary/fallback providers.
const buildTransportConfig = ({ host, port, secure, user, pass }) => ({
  host,
  port: Number(port),
  secure: parseSecure(secure, port),
  auth: { user, pass },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
  tls: {
    // Some private SMTP providers use custom/self-signed cert chains.
    rejectUnauthorized: toBool(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, true),
  },
});

const primary = {
  host: process.env.SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || process.env.MAIL_PORT || '587',
  secure: process.env.SMTP_SECURE,
  user: process.env.SMTP_USER || process.env.MAIL_USER,
  pass: process.env.SMTP_PASS || process.env.MAIL_PASS,
};

// Preferred delivery path: Gmail app password (if provided).
const gmailPrimary = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: process.env.GMAIL_SMTP_USER,
  pass: process.env.GMAIL_SMTP_PASS,
};

const useGmailPrimary = Boolean(gmailPrimary.user && gmailPrimary.pass);

// Optional fallback SMTP (set these env vars if you want a second provider/account).
const fallback = {
  host: process.env.SMTP_FALLBACK_HOST,
  port: process.env.SMTP_FALLBACK_PORT,
  secure: process.env.SMTP_FALLBACK_SECURE,
  user: process.env.SMTP_FALLBACK_USER,
  pass: process.env.SMTP_FALLBACK_PASS,
};

const hasFallback = Boolean(
  fallback.host && fallback.port && fallback.user && fallback.pass
);

const activePrimary = useGmailPrimary ? gmailPrimary : primary;
const primaryTransporter = nodemailer.createTransport(buildTransportConfig(activePrimary));
const fallbackTransporter = hasFallback
  ? nodemailer.createTransport(buildTransportConfig(fallback))
  : null;

/**
 * Send an OTP email
 * @param {string} toEmail  - recipient email
 * @param {string} otp      - 6-digit OTP
 * @param {string} purpose  - 'login' | 'signup'
 */
const sendOTPEmail = async (toEmail, otp, purpose = 'login') => {
  const subject = purpose === 'signup'
    ? 'LeadManager - Verify your account'
    : 'LeadManager - Your login OTP';

  const fromAddress = activePrimary.user;
  const fromHeader = process.env.MAIL_FROM || fromAddress;

  const text = [
    'LeadManager OTP',
    '',
    purpose === 'signup'
      ? 'Use this OTP to verify your account:'
      : 'Use this OTP to login:',
    otp,
    '',
    'Valid for 10 minutes.',
    'Do not share this OTP with anyone.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #F9FAFB; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #4F46E5; color: #fff; font-size: 22px; font-weight: 900; padding: 14px 24px; border-radius: 14px; letter-spacing: 1px;">LM</div>
        <h2 style="color: #0F172A; margin-top: 16px;">LeadManager</h2>
      </div>

      <div style="background: #fff; border-radius: 12px; padding: 28px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
        <p style="color: #64748B; font-size: 15px; margin-bottom: 8px;">
          ${purpose === 'signup' ? 'Use this OTP to verify your account' : 'Use this OTP to login to your account'}
        </p>
        <div style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #4F46E5; padding: 20px 0;">${otp}</div>
        <p style="color: #94A3B8; font-size: 13px; margin-top: 8px;">Valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.</p>
      </div>

      <p style="color: #94A3B8; font-size: 12px; text-align: center; margin-top: 20px;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  // Reused for primary and fallback transports so message content stays identical.
  const createMessage = (envelopeFrom) => ({
    envelope: { from: envelopeFrom, to: [toEmail] },
    from: fromHeader,
    replyTo: envelopeFrom,
    to: toEmail,
    subject,
    text,
    html,
  });

  const sendWith = async (transporter, label, envelopeFrom) => {
    const info = await transporter.sendMail(createMessage(envelopeFrom));
    console.log(`OTP mail sent via ${label}:`, {
      to: toEmail,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      messageId: info.messageId,
    });
    return info;
  };

  try {
    // First try primary SMTP to keep normal path fast.
    return await sendWith(primaryTransporter, 'primary', activePrimary.user);
  } catch (primaryErr) {
    console.error('Primary SMTP failed:', primaryErr.message);
    // If configured, fallback SMTP gives better delivery resilience.
    if (!fallbackTransporter) throw primaryErr;

    return sendWith(fallbackTransporter, 'fallback', fallback.user);
  }
};

const verifyPrimaryTransport = async () => {
  try {
    await primaryTransporter.verify();
    console.log('SMTP primary connection verified');
  } catch (err) {
    console.error('SMTP primary verification failed:', err.message);
  }
};

module.exports = { sendOTPEmail, verifyPrimaryTransport };
