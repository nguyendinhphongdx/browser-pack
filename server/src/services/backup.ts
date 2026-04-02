import { prisma } from '@/lib/prisma';
import { uploadToStorage, uploadBufferToStorage, deleteFromStorage } from '@/lib/gcs';
import { rm } from 'node:fs/promises';

interface CreateBackupInput {
  userId: string;
  name: string;
  size: number;
  browser: string;
  platform: string;
  profileName: string;
  bpakFilePath: string;
  manifestJson: string;
}

export async function createBackup(input: CreateBackupInput) {
  const backup = await prisma.backup.create({
    data: {
      userId: input.userId,
      name: input.name,
      size: input.size,
      browser: input.browser,
      platform: input.platform,
      profileName: input.profileName,
      storageKey: '',
      manifestKey: '',
    },
  });

  const storageKey = `${input.userId}/${backup.id}.bpak`;
  const manifestKey = `${input.userId}/${backup.id}.manifest.json`;

  try {
    await uploadToStorage(storageKey, input.bpakFilePath);
    await uploadBufferToStorage(manifestKey, Buffer.from(input.manifestJson, 'utf-8'));

    const updated = await prisma.backup.update({
      where: { id: backup.id },
      data: { storageKey, manifestKey },
    });

    await rm(input.bpakFilePath, { force: true });
    return updated;
  } catch (error) {
    await prisma.backup.delete({ where: { id: backup.id } }).catch(() => {});
    await deleteFromStorage(storageKey).catch(() => {});
    await deleteFromStorage(manifestKey).catch(() => {});
    await rm(input.bpakFilePath, { force: true });
    throw error;
  }
}

export async function listBackups(userId: string) {
  return prisma.backup.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getBackup(id: string, userId: string) {
  return prisma.backup.findFirst({ where: { id, userId } });
}

export async function deleteBackup(id: string, userId: string) {
  const backup = await prisma.backup.findFirst({ where: { id, userId } });
  if (!backup) return null;

  await deleteFromStorage(backup.storageKey).catch(() => {});
  await deleteFromStorage(backup.manifestKey).catch(() => {});
  await prisma.backup.delete({ where: { id } });
  return backup;
}
