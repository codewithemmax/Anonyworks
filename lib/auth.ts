import jwt from 'jsonwebtoken';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
};

export type AuthUser = { userId: number; email: string };

export function generateToken(userId: number, email: string) {
  return jwt.sign({ userId, email }, getSecret(), { expiresIn: '7d' });
}

export function getAuthUser(request: Request): AuthUser | null {
  const header = request.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;

  try {
    return jwt.verify(token, getSecret()) as AuthUser;
  } catch {
    return null;
  }
}
