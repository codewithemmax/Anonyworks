import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';
import { generateToken, getAuthUser } from '../../../../lib/auth';

export const runtime = 'nodejs';

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });
const bad = (message: string, status = 400) => json({ success: false, message }, status);

async function body(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function requireUser(request: Request) {
  const user = getAuthUser(request);
  return user ?? null;
}

export async function GET(request: Request, context: { params: Promise<{ route: string[] }> }) {
  const { route = [] } = await context.params;
  const path = route.join('/');

  if (path === 'health') return json({ message: 'Backend is running!' });
  if (path === 'user/profile') {
    const auth = requireUser(request);
    if (!auth) return bad('Unauthorized', 401);
    const result = await pool.query(
      'SELECT id, email, name, user_type, is_verified, created_at FROM users WHERE id = $1',
      [auth.userId],
    );
    return result.rows[0] ? json({ success: true, user: result.rows[0] }) : bad('User not found', 404);
  }
  if (path === 'user/pits') {
    const auth = requireUser(request);
    if (!auth) return bad('Unauthorized', 401);
    const result = await pool.query(
      'SELECT id, title, is_active, expires_at, created_at, force_professional FROM pits WHERE creator_id = $1 ORDER BY created_at DESC',
      [auth.userId],
    );
    return json({ success: true, pits: result.rows });
  }

  const pitMessages = path.match(/^pit\/([^/]+)\/messages$/);
  if (pitMessages) {
    const auth = requireUser(request);
    if (!auth) return bad('Unauthorized', 401);
    const pit = await pool.query('SELECT id FROM pits WHERE id = $1 AND creator_id = $2', [pitMessages[1], auth.userId]);
    if (!pit.rows[0]) return bad('Pit not found', 404);
    const messages = await pool.query(
      'SELECT id, original_message, processed_message, is_professional, created_at FROM messages WHERE pit_id = $1 ORDER BY created_at DESC',
      [pitMessages[1]],
    );
    return json({ success: true, messages: messages.rows });
  }

  const pitInfo = path.match(/^pit\/([^/]+)\/info$/);
  if (pitInfo) {
    const result = await pool.query(
      'SELECT p.*, u.user_type AS creator_type FROM pits p JOIN users u ON p.creator_id = u.id WHERE p.id = $1',
      [pitInfo[1]],
    );
    if (!result.rows[0]) return bad('Pit not found', 404);
    const pit = result.rows[0];
    if (pit.creator_type === 'company') pit.force_professional = true;
    return json({ success: true, pit });
  }

  return bad('Not found', 404);
}

export async function POST(request: Request, context: { params: Promise<{ route: string[] }> }) {
  const { route = [] } = await context.params;
  const path = route.join('/');
  const data = await body(request);

  if (path === 'auth/signup') {
    const { email, password, name, userType } = data ?? {};
    if (!email || !password || !name || !['individual', 'company'].includes(userType)) return bad('Please complete all fields');
    if (password.length < 6) return bad('Password must be at least 6 characters');
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) return bad('Email already registered');
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, user_type, is_verified) VALUES ($1, $2, $3, $4, TRUE) RETURNING id, email, name, user_type',
      [email, hash, name, userType],
    );
    const user = result.rows[0];
    return json({ success: true, token: generateToken(user.id, user.email), user: { ...user, userType: user.user_type } });
  }

  if (path === 'auth/login') {
    const { email, password } = data ?? {};
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password ?? '', user.password_hash))) return bad('Invalid credentials');
    return json({ success: true, token: generateToken(user.id, user.email), user: { id: user.id, email: user.email, name: user.name, userType: user.user_type } });
  }

  if (path === 'pit/create') {
    const auth = requireUser(request);
    if (!auth) return bad('Unauthorized', 401);
    const result = await pool.query(
      'INSERT INTO pits (creator_id, title) VALUES ($1, $2) RETURNING id, expires_at, title',
      [auth.userId, data?.title || 'Anonymous Feedback'],
    );
    return json({ success: true, pitId: result.rows[0].id, expiresAt: result.rows[0].expires_at, title: result.rows[0].title });
  }

  const messagePath = path.match(/^pit\/([^/]+)\/message$/);
  if (messagePath) {
    const message = typeof data?.message === 'string' ? data.message.trim() : '';
    if (!message) return bad('Message is required');
    const pit = await pool.query('SELECT * FROM pits WHERE id = $1 AND is_active = TRUE AND expires_at > NOW()', [messagePath[1]]);
    if (!pit.rows[0]) return bad('Pit not found, inactive, or expired', 404);
    const professional = Boolean(data?.isProfessional);
    const result = await pool.query(
      'INSERT INTO messages (pit_id, original_message, processed_message, is_professional) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
      [messagePath[1], message, message, professional],
    );
    return json({ success: true, message: 'Message sent anonymously', messageId: result.rows[0].id });
  }

  const endPath = path.match(/^pit\/([^/]+)\/end$/);
  if (endPath) {
    const auth = requireUser(request);
    if (!auth) return bad('Unauthorized', 401);
    const result = await pool.query('UPDATE pits SET is_active = FALSE WHERE id = $1 AND creator_id = $2 RETURNING id', [endPath[1], auth.userId]);
    return result.rows[0] ? json({ success: true, message: 'Pit session ended' }) : bad('Pit not found', 404);
  }

  return bad('Not found', 404);
}

export async function PUT(request: Request, context: { params: Promise<{ route: string[] }> }) {
  const { route = [] } = await context.params;
  const match = route.join('/').match(/^pit\/([^/]+)\/professional$/);
  if (!match) return bad('Not found', 404);
  const auth = requireUser(request);
  if (!auth) return bad('Unauthorized', 401);
  const data = await body(request);
  const result = await pool.query(
    'UPDATE pits SET force_professional = $1 WHERE id = $2 AND creator_id = $3 RETURNING id',
    [Boolean(data?.forceProfessional), match[1], auth.userId],
  );
  return result.rows[0] ? json({ success: true, message: 'Professional mode updated' }) : bad('Pit not found', 404);
}

export async function DELETE(request: Request, context: { params: Promise<{ route: string[] }> }) {
  const { route = [] } = await context.params;
  const match = route.join('/').match(/^pit\/([^/]+)$/);
  if (!match) return bad('Not found', 404);
  const auth = requireUser(request);
  if (!auth) return bad('Unauthorized', 401);
  const result = await pool.query('DELETE FROM pits WHERE id = $1 AND creator_id = $2 RETURNING id', [match[1], auth.userId]);
  return result.rows[0] ? json({ success: true, message: 'Pit deleted' }) : bad('Pit not found', 404);
}
