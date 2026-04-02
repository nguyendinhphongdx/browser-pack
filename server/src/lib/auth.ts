import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';

export function getAuthUser(request: NextRequest): { id: string } | null {
  // Check Authorization header (CLI)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(authHeader.slice(7));
      return { id: payload.sub };
    } catch {
      return null;
    }
  }

  // Check cookie (Web)
  const token = request.cookies.get('token')?.value;
  if (token) {
    try {
      const payload = verifyToken(token);
      return { id: payload.sub };
    } catch {
      return null;
    }
  }

  return null;
}

export function requireAuth(request: NextRequest): { id: string } {
  const user = getAuthUser(request);
  if (!user) throw new Error('Unauthorized');
  return user;
}
