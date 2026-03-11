const { pool }        = require('../config/database');
const { sendContactEmails } = require('../config/sendEmail');
const jwt             = require('jsonwebtoken');
require('dotenv').config();

// Creates a 6-digit OTP for signup/login verification.
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
// OTP expires in 10 minutes for security.
const expiry10Min = () => new Date(Date.now() + 10 * 60 * 1000);

// Creates JWT so mobile app can access protected lead APIs.
const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Dev helper can expose OTP in API response for easier local testing.
const shouldExposeOtp = () => String(process.env.DEV_SHOW_OTP).toLowerCase() === 'true';
// Keep sync mode as default so SMTP errors are visible to API caller in development.
const shouldSendOtpAsync = () => String(process.env.OTP_SEND_ASYNC || 'false').toLowerCase() === 'true';

const triggerOtpEmail = async (email, otp, purpose) => {
  if (shouldSendOtpAsync()) {
    // Non-blocking mail send keeps OTP API response fast on mobile.
    sendContactEmails(email, otp).catch((err) => {
      console.error(`OTP mail async send failed (${purpose}):`, err.message);
    });
    return;
  }
  await sendContactEmails(email, otp);
};

// ── POST /api/auth/signup ─────────────────────────────────────────
// Body: { username, email, mobile }
// Saves user (unverified) and sends OTP to email
const signup = async (req, res) => {
  const { username, email, mobile } = req.body;

  if (!username || !email || !mobile)
    return res.status(400).json({ success: false, message: 'Name, email and mobile are all required' });

  const otp = generateOTP();

  try {
    // Check if email already verified
    const [existing] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length && existing[0].is_verified)
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });

    await pool.execute(
      `INSERT INTO users (username, email, mobile, otp, otp_expiry, is_verified)
       VALUES (?, ?, ?, ?, ?, FALSE)
       ON DUPLICATE KEY UPDATE
         username   = VALUES(username),
         mobile     = VALUES(mobile),
         otp        = VALUES(otp),
         otp_expiry = VALUES(otp_expiry)`,
      [username, email, mobile, otp, expiry10Min()]
    );

    await triggerOtpEmail(email, otp, 'signup');
    const response = { success: true, message: `OTP sent to ${email}` };
    if (shouldExposeOtp()) response.otp = otp;
    return res.json(response);
  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ success: false, message: 'Signup failed. Try again.' });
  }
};

// ── POST /api/auth/verify-signup ──────────────────────────────────
// Body: { email, otp }
// Marks account as verified only when OTP matches and is still valid.
const verifySignup = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ success: false, message: 'Email and OTP required' });

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'User not found' });

    const user = rows[0];
    if (user.otp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (new Date() > new Date(user.otp_expiry))
      return res.status(400).json({ success: false, message: 'OTP expired. Please signup again.' });

    await pool.execute(
      'UPDATE users SET is_verified = TRUE, otp = NULL, otp_expiry = NULL WHERE id = ?',
      [user.id]
    );

    const token = signToken(user);
    return res.json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: user.id, username: user.username, email: user.email, mobile: user.mobile },
    });
  } catch (err) {
    console.error('verifySignup error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /api/auth/send-otp ───────────────────────────────────────
// Body: { email }  — Login step 1
// Generates fresh OTP for an existing verified user.
const sendLoginOTP = async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ success: false, message: 'Email is required' });

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'No account found with this email. Please sign up.' });

    const user = rows[0];
    if (!user.is_verified)
      return res.status(400).json({ success: false, message: 'Account not verified. Please complete signup.' });

    const otp = generateOTP();
    await pool.execute(
      'UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?',
      [otp, expiry10Min(), user.id]
    );

    await triggerOtpEmail(email, otp, 'login');
    const response = { success: true, message: `OTP sent to ${email}` };
    if (shouldExposeOtp()) response.otp = otp;
    return res.json(response);
  } catch (err) {
    console.error('sendLoginOTP error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// ── POST /api/auth/verify-otp ─────────────────────────────────────
// Body: { email, otp }  — Login step 2
// Verifies OTP, clears it from DB, then returns JWT + user profile.
const verifyLoginOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ success: false, message: 'Email and OTP required' });

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'User not found' });

    const user = rows[0];
    if (user.otp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (new Date() > new Date(user.otp_expiry))
      return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });

    await pool.execute(
      'UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ?',
      [user.id]
    );

    const token = signToken(user);
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, mobile: user.mobile },
    });
  } catch (err) {
    console.error('verifyLoginOTP error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { signup, verifySignup, sendLoginOTP, verifyLoginOTP };
