import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/services/user';
import { signToken } from '@/lib/jwt';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signToken(user.id);

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
