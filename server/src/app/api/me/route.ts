import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getUserById } from '@/services/user';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const dbUser = await getUserById(user.id);
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      createdAt: dbUser.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
