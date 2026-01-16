import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import * as brevo from '@getbrevo/brevo';
import { pool } from './db.js';
import { generateToken, verifyToken } from './auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Brevo API
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// Function to send OTP email
const sendOTPEmail = async (email, otp) => {
  if (!process.env.BREVO_API_KEY) {
    console.log(`OTP for ${email}: ${otp}`);
    return;
  }

  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = 'Your AnonyWorks OTP Code';
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #0a0a0a; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 10px; border: 1px solid #7c3aed;">
            <h1 style="color: #7c3aed; text-align: center;">AnonyWorks</h1>
            <h2 style="text-align: center;">Your OTP Code</h2>
            <div style="background-color: #0a0a0a; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #7c3aed; font-size: 48px; letter-spacing: 10px; margin: 0;">${otp}</h1>
            </div>
            <p style="text-align: center; color: #a1a1aa;">This code will expire in 5 minutes.</p>
            <p style="text-align: center; color: #a1a1aa; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
          </div>
        </body>
      </html>
    `;
    sendSmtpEmail.sender = { name: 'AnonyWorks', email: process.env.BREVO_SENDER_EMAIL || 'olayinkaemma27@gmail.com' };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Brevo email error:', error);
    console.log(`OTP for ${email}: ${otp}`);
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name, userType } = req.body;

  try {
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, user_type) VALUES ($1, $2, $3, $4) RETURNING id, email, name, user_type',
      [email, passwordHash, name, userType]
    );

    const user = result.rows[0];

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'INSERT INTO otp_codes (email, code, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    await sendOTPEmail(email, otp);

    res.json({ 
      success: true, 
      message: 'User created. OTP sent to email',
      userId: user.id 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login endpoint (no OTP)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.user_type
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Forgot password - send OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Email not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query('DELETE FROM otp_codes WHERE email = $1', [email]);

    await pool.query(
      'INSERT INTO otp_codes (email, code, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    await sendOTPEmail(email, otp);

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reset password with OTP
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM otp_codes WHERE email = $1 AND code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    await pool.query('DELETE FROM otp_codes WHERE email = $1', [email]);

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [passwordHash, email]
    );

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify OTP and return JWT
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Get OTP from database
    const result = await pool.query(
      'SELECT * FROM otp_codes WHERE email = $1 AND code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Delete used OTP
    await pool.query('DELETE FROM otp_codes WHERE email = $1', [email]);

    // Mark user as verified
    await pool.query(
      'UPDATE users SET is_verified = TRUE WHERE email = $1',
      [email]
    );

    // Get user data
    const userResult = await pool.query(
      'SELECT id, email, name, user_type FROM users WHERE email = $1',
      [email]
    );

    const user = userResult.rows[0];

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      message: 'OTP verified',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.user_type
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Protected route example
app.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, user_type, is_verified, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Cleanup expired OTPs (run periodically)
setInterval(async () => {
  try {
    await pool.query('DELETE FROM otp_codes WHERE expires_at < NOW()');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 60000); // Every minute

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
