import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { pool } from './db.js';
import { generateToken, verifyToken } from './auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

    console.log(`OTP for ${email}: ${otp}`);

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

// Send OTP for login
app.post('/api/auth/send-otp', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verify user credentials
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

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Delete old OTPs for this email
    await pool.query('DELETE FROM otp_codes WHERE email = $1', [email]);

    // Insert new OTP
    await pool.query(
      'INSERT INTO otp_codes (email, code, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    console.log(`OTP for ${email}: ${otp}`);

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Send OTP error:', error);
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
