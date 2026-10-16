import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { generateToken, getAuthUser } from '../../../lib/auth';

export const runtime = 'nodejs';

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });
const bad = (message: string, status = 400) => json({ success: false, message }, status);
type PgError = Error & { code?: string; detail?: string; constraint?: string };

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

function mapDatabaseError(error: unknown, action: string) {
  const pgError = error as PgError;
  if (pgError?.code === '23503') {
    return json(
      {
        success: false,
        message: `Unable to ${action} because the authenticated user record was not found.`,
        code: pgError.code,
      },
      400,
    );
  }

  if (pgError?.code === '42P01' || pgError?.code === '42703') {
    return json(
      {
        success: false,
        message: 'Database schema is out of date. Please initialize or migrate the database schema.',
        code: pgError.code,
      },
      500,
    );
  }

  if (pgError?.code === '22P02') {
    return json({ success: false, message: 'Invalid session identifier.', code: pgError.code }, 400);
  }

  return json(
    {
      success: false,
      message: `Unable to ${action}.`,
      code: pgError?.code ?? 'UNKNOWN',
      detail: pgError?.detail ?? null,
    },
    500,
  );
}

export async function GET(request: Request, context: { params: Promise<{ route: string[] }> }) {
  try {
    const { route = [] } = await context.params;
    const path = route.join('/');
    const normalizedPath = path.replace(/^pit\//, 'session/');

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
    if (path === 'user/sessions' || path === 'user/pits') {
      const auth = requireUser(request);
      if (!auth) return bad('Unauthorized', 401);
      const result = await pool.query(
        'SELECT id, title, is_active, expires_at, created_at, force_professional FROM pits WHERE creator_id = $1 ORDER BY created_at DESC',
        [auth.userId],
      );
      return json({ success: true, sessions: result.rows, pits: result.rows });
    }

    const sessionMessages = normalizedPath.match(/^session\/([^/]+)\/messages$/);
    if (sessionMessages) {
      const auth = requireUser(request);
      if (!auth) return bad('Unauthorized', 401);
      const session = await pool.query('SELECT id FROM pits WHERE id = $1 AND creator_id = $2', [sessionMessages[1], auth.userId]);
      if (!session.rows[0]) return bad('Session not found', 404);
      const messages = await pool.query(
        'SELECT id, original_message, processed_message, is_professional, created_at FROM messages WHERE pit_id = $1 ORDER BY created_at DESC',
        [sessionMessages[1]],
      );
      return json({ success: true, messages: messages.rows });
    }

    const sessionInfo = normalizedPath.match(/^session\/([^/]+)\/info$/);
    if (sessionInfo) {
      const result = await pool.query(
        'SELECT p.*, u.user_type AS creator_type FROM pits p JOIN users u ON p.creator_id = u.id WHERE p.id = $1',
        [sessionInfo[1]],
      );
      if (!result.rows[0]) return bad('Session not found', 404);
      const session = result.rows[0];
      if (session.creator_type === 'company') session.force_professional = true;
      return json({ success: true, session, pit: session });
    }

    return bad('Not found', 404);
  } catch (error) {
    return mapDatabaseError(error, 'fetch sessions');
  }
}

export async function POST(request: Request, context: { params: Promise<{ route: string[] }> }) {
  try {
    const { route = [] } = await context.params;
    const path = route.join('/');
    const normalizedPath = path.replace(/^pit\//, 'session/');
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

    if (normalizedPath === 'session/create') {
      const auth = requireUser(request);
      if (!auth) return bad('Unauthorized', 401);
      const result = await pool.query(
        'INSERT INTO pits (creator_id, title) VALUES ($1, $2) RETURNING id, expires_at, title',
        [auth.userId, data?.title || 'Anonymous Feedback'],
      );
      return json({
        success: true,
        sessionId: result.rows[0].id,
        pitId: result.rows[0].id,
        expiresAt: result.rows[0].expires_at,
        title: result.rows[0].title,
      });
    }

    const messagePath = normalizedPath.match(/^session\/([^/]+)\/message$/);
    if (messagePath) {
      const message = typeof data?.message === 'string' ? data.message.trim() : '';
      if (!message) return bad('Message is required');
      const session = await pool.query('SELECT * FROM pits WHERE id = $1 AND is_active = TRUE AND expires_at > NOW()', [messagePath[1]]);
      if (!session.rows[0]) return bad('Session not found, inactive, or expired', 404);
      const professional = Boolean(data?.isProfessional);
      const result = await pool.query(
        'INSERT INTO messages (pit_id, original_message, processed_message, is_professional) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
        [messagePath[1], message, message, professional],
      );
      return json({ success: true, message: 'Message sent anonymously', messageId: result.rows[0].id });
    }

    const endPath = normalizedPath.match(/^session\/([^/]+)\/end$/);
    if (endPath) {
      const auth = requireUser(request);
      if (!auth) return bad('Unauthorized', 401);
      const result = await pool.query('UPDATE pits SET is_active = FALSE WHERE id = $1 AND creator_id = $2 RETURNING id', [endPath[1], auth.userId]);
      return result.rows[0] ? json({ success: true, message: 'Session ended' }) : bad('Session not found', 404);
    }

    return bad('Not found', 404);
  } catch (error) {
    return mapDatabaseError(error, 'create session');
  }
}

export async function PUT(request: Request, context: { params: Promise<{ route: string[] }> }) {
  try {
    const { route = [] } = await context.params;
    const match = route.join('/').replace(/^pit\//, 'session/').match(/^session\/([^/]+)\/professional$/);
    if (!match) return bad('Not found', 404);
    const auth = requireUser(request);
    if (!auth) return bad('Unauthorized', 401);
    const data = await body(request);
    const result = await pool.query(
      'UPDATE pits SET force_professional = $1 WHERE id = $2 AND creator_id = $3 RETURNING id',
      [Boolean(data?.forceProfessional), match[1], auth.userId],
    );
    return result.rows[0] ? json({ success: true, message: 'Professional mode updated' }) : bad('Session not found', 404);
  } catch (error) {
    return mapDatabaseError(error, 'update session');
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ route: string[] }> }) {
  try {
    const { route = [] } = await context.params;
    const match = route.join('/').replace(/^pit\//, 'session/').match(/^session\/([^/]+)$/);
    if (!match) return bad('Not found', 404);
    const auth = requireUser(request);
    if (!auth) return bad('Unauthorized', 401);
    const result = await pool.query('DELETE FROM pits WHERE id = $1 AND creator_id = $2 RETURNING id', [match[1], auth.userId]);
    return result.rows[0] ? json({ success: true, message: 'Session deleted' }) : bad('Session not found', 404);
  } catch (error) {
    return mapDatabaseError(error, 'delete session');
  }
}
