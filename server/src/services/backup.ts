import { prisma } from '@/lib/prisma';
import { uploadBufferToStorage, deleteFromStorage, generateSignedUploadUrl, fileExistsInStorage } from '@/lib/gcs';

interface InitBackupInput {
  userId: string;
  name: string;
  size: number;
  browser: string;
  platform: string;
  profileName: string;
  manifestJson: string;
}

export async function initBackup(input: InitBackupInput) {
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

  // Update DB with storage keys
  await prisma.backup.update({
    where: { id: backup.id },
    data: { storageKey, manifestKey },
  });

  // Upload manifest (small JSON, ok through Vercel)
  await uploadBufferToStorage(manifestKey, Buffer.from(input.manifestJson, 'utf-8'));

  // Generate signed URL for client to upload .bpak directly to GCS
  const uploadUrl = await generateSignedUploadUrl(storageKey);

  return { backupId: backup.id, uploadUrl };
}

export async function confirmBackup(backupId: string, userId: string) {
  const backup = await prisma.backup.findFirst({
    where: { id: backupId, userId },
  });

  if (!backup) return null;

  // Verify the file actually exists in GCS
  const exists = await fileExistsInStorage(backup.storageKey);
  if (!exists) {
    // File not uploaded, cleanup
    await prisma.backup.delete({ where: { id: backupId } }).catch(() => {});
    await deleteFromStorage(backup.manifestKey).catch(() => {});
    return null;
  }

  return backup;
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
