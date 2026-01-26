import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

import * as brevo from '@getbrevo/brevo';
import { GoogleGenAI } from '@google/genai';

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { pool } from './db.js';
import { generateToken, verifyToken } from './auth.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// WebSocket connections by pit ID
const pitConnections = new Map();

// Initialize Gemini AI
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
// Function to check if email is from a company domain
const isCompanyEmail = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  const personalDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'aol.com', 'icloud.com', 'protonmail.com', 'yandex.com'
  ];
  return !personalDomains.includes(domain);
};

// Function to refine message with Gemini
const refineMessage = async (message) => {
  if (!process.env.GEMINI_API_KEY) {
    return message;
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Please refine this feedback message to be professional, constructive, and appropriate for workplace communication. Keep the core message and intent, but make it polite and professional. If it's already professional, return it exactly as is:

"${message}"`;
    
    const result = await model.generateContent(prompt);
    const refinedMessage = result.response.text().trim();
    
    // Check if message was actually changed
    if (refinedMessage.toLowerCase() !== message.toLowerCase()) {
      return `${refinedMessage}

*This message has been refined by Gemini AI for professional communication.*`;
    }
    
    return refinedMessage;
  } catch (error) {
    console.error('Gemini API error:', error);
    return message;
  }
};

// Initialize Brevo API
// 1. Change your import to destructure exactly what you need

// ... (Rest of your imports)

// 2. Initialize using the direct class name
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

// Send OTP for signup
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Delete any existing OTP for this email
    await pool.query('DELETE FROM otp_codes WHERE email = $1', [email]);

    await pool.query(
      'INSERT INTO otp_codes (email, code, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    await sendOTPEmail(email, otp);

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name, userType, otp } = req.body;

  try {
    // Verify OTP first
    const otpResult = await pool.query(
      'SELECT * FROM otp_codes WHERE email = $1 AND code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Delete used OTP
    await pool.query('DELETE FROM otp_codes WHERE email = $1', [email]);

    // Validate company email for company accounts
    if (userType === 'company' && !isCompanyEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please use a company email address for business accounts' 
      });
    }

    // Check if user exists (double check)
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
      'INSERT INTO users (email, password_hash, name, user_type, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, user_type',
      [email, passwordHash, name, userType, true]
    );

    const user = result.rows[0];

    res.json({ 
      success: true, 
      message: 'Account created successfully',
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

// Google OAuth endpoint
app.post('/api/auth/google', async (req, res) => {
  const { email, name, googleId } = req.body;

  try {
    // Check if user exists
    let result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    let user;
    if (result.rows.length === 0) {
      // Create new user
      const insertResult = await pool.query(
        'INSERT INTO users (email, password_hash, name, user_type, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, user_type',
        [email, 'google_oauth', name, 'individual', true]
      );
      user = insertResult.rows[0];
    } else {
      user = result.rows[0];
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
    console.error('Google auth error:', error);
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

    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's active pits
app.get('/api/user/pits', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, is_active, expires_at, created_at FROM pits WHERE creator_id = $1 AND expires_at > NOW() ORDER BY created_at DESC',
      [req.user.userId]
    );

    res.json({ success: true, pits: result.rows });
  } catch (error) {
    console.error('Get pits error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new pit
app.post('/api/pit/create', verifyToken, async (req, res) => {
  const { userId } = req.user;
  const { title } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO pits (creator_id, title) VALUES ($1, $2) RETURNING id, expires_at, title',
      [userId, title || 'Anonymous Feedback']
    );

    res.json({ 
      success: true, 
      pitId: result.rows[0].id,
      expiresAt: result.rows[0].expires_at,
      title: result.rows[0].title
    });

  } catch (error) {
    console.error('Create pit error:', error);
    res.status(500).json({ success: false, message: 'Could not create anonymous session' });
  }
});

// Get pit messages (protected)
app.get('/api/pit/:id/messages', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const pitResult = await pool.query(
      'SELECT * FROM pits WHERE id = $1 AND creator_id = $2',
      [id, req.user.userId]
    );

    if (pitResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pit not found' });
    }

    const messagesResult = await pool.query(
      'SELECT id, original_message, processed_message, is_professional, created_at FROM messages WHERE pit_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({ success: true, messages: messagesResult.rows });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Submit message to pit (public)
app.post('/api/pit/:id/message', async (req, res) => {
  const { id } = req.params;
  const { message, isProfessional } = req.body;

  try {
    const pitResult = await pool.query(
      'SELECT * FROM pits WHERE id = $1 AND is_active = TRUE AND expires_at > NOW()',
      [id]
    );

    if (pitResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pit not found, inactive, or expired' });
    }

    let processedMessage = message;
    
    if (isProfessional) {
      processedMessage = await refineMessage(message);
    }

    const result = await pool.query(
      'INSERT INTO messages (pit_id, original_message, processed_message, is_professional) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
      [id, message, processedMessage, isProfessional]
    );

    const newMessage = {
      id: result.rows[0].id,
      original_message: message,
      processed_message: processedMessage,
      is_professional: isProfessional,
      created_at: result.rows[0].created_at
    };

    // Broadcast to connected clients
    broadcastToPit(id, newMessage);

    res.json({ success: true, message: 'Message sent anonymously' });
  } catch (error) {
    console.error('Submit message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// End pit session (protected)
app.post('/api/pit/:id/end', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE pits SET is_active = FALSE WHERE id = $1 AND creator_id = $2 RETURNING id',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pit not found' });
    }

    res.json({ success: true, message: 'Pit session ended' });
  } catch (error) {
    console.error('End pit error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete pit (protected)
app.delete('/api/pit/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM messages WHERE pit_id = $1', [id]);
    
    const result = await pool.query(
      'DELETE FROM pits WHERE id = $1 AND creator_id = $2 RETURNING id',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pit not found' });
    }

    res.json({ success: true, message: 'Pit deleted' });
  } catch (error) {
    console.error('Delete pit error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Cleanup expired OTPs and pits (run periodically)
setInterval(async () => {
  try {
    await pool.query('DELETE FROM otp_codes WHERE expires_at < NOW()');
    await pool.query('UPDATE pits SET is_active = FALSE WHERE expires_at < NOW() AND is_active = TRUE');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 60000); // Every minute

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log("New WebSocket connection attempt")
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'join' && data.pitId) {
        ws.pitId = data.pitId;
        if (!pitConnections.has(data.pitId)) {
          pitConnections.set(data.pitId, new Set());
        }
        pitConnections.get(data.pitId).add(ws);
        console.log("User added")
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    if (ws.pitId && pitConnections.has(ws.pitId)) {
      pitConnections.get(ws.pitId).delete(ws);
      if (pitConnections.get(ws.pitId).size === 0) {
        pitConnections.delete(ws.pitId);
      }
    }
  });
});

// Broadcast new message to pit subscribers
const broadcastToPit = (pitId, message) => {
  if (pitConnections.has(pitId)) {
    pitConnections.get(pitId).forEach(ws => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'newMessage', message }));
      }
    });
  }
};

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
