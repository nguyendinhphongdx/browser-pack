import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/services/user';
import { signToken } from '@/lib/jwt';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { email, password, name } = parsed.data;
    const user = await registerUser(email, password, name);
    const token = signToken(user.id);

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    }, { status: 201 });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === 'Email already registered') {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
