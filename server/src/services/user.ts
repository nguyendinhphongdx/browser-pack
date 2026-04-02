import { prisma } from '@/lib/prisma';
import type { GoogleUserInfo } from '@/lib/google-oauth';

export async function findOrCreateUser(googleUser: GoogleUserInfo) {
  const existing = await prisma.user.findUnique({
    where: { googleId: googleUser.id },
  });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      email: googleUser.email,
      name: googleUser.name,
      googleId: googleUser.id,
    },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
