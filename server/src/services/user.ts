import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { GoogleUserInfo } from '@/lib/google-oauth';

export async function findOrCreateUser(googleUser: GoogleUserInfo) {
  // Check if user exists by googleId
  const byGoogle = await prisma.user.findUnique({
    where: { googleId: googleUser.id },
  });
  if (byGoogle) return byGoogle;

  // Check if user exists by email (registered with password, now linking Google)
  const byEmail = await prisma.user.findUnique({
    where: { email: googleUser.email },
  });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { googleId: googleUser.id, name: byEmail.name || googleUser.name },
    });
  }

  return prisma.user.create({
    data: {
      email: googleUser.email,
      name: googleUser.name,
      googleId: googleUser.id,
    },
  });
}

export async function registerUser(email: string, password: string, name?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: { email, name: name || null, passwordHash },
  });
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
