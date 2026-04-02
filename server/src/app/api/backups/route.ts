import { NextRequest, NextResponse } from 'next/server';
import { writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { requireAuth } from '@/lib/auth';
import { createBackup, listBackups } from '@/services/backup';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const backups = await listBackups(user.id);

    return NextResponse.json({
      backups: backups.map((b: { id: string; name: string; size: number; browser: string; platform: string; profileName: string; createdAt: Date }) => ({
        id: b.id,
        name: b.name,
        size: b.size,
        browser: b.browser,
        platform: b.platform,
        profileName: b.profileName,
        createdAt: b.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const manifestFile = formData.get('manifest') as File | null;
    const name = formData.get('name') as string | null;

    if (!file || !manifestFile) {
      return NextResponse.json(
        { error: 'Both "file" (.bpak) and "manifest" (.json) are required' },
        { status: 400 },
      );
    }

    // Save .bpak to temp file
    const bpakBuffer = Buffer.from(await file.arrayBuffer());
    const bpakPath = join(tmpdir(), `upload-${Date.now()}.bpak`);
    await writeFile(bpakPath, bpakBuffer);

    // Parse manifest
    const manifestJson = await manifestFile.text();
    let manifest: Record<string, unknown>;
    try {
      manifest = JSON.parse(manifestJson);
    } catch {
      await rm(bpakPath, { force: true });
      return NextResponse.json({ error: 'Invalid manifest JSON' }, { status: 400 });
    }

    const backupName = name || `${manifest.browser}-${manifest.profileName}-${Date.now()}`;

    const backup = await createBackup({
      userId: user.id,
      name: backupName,
      size: bpakBuffer.length,
      browser: (manifest.browser as string) || 'unknown',
      platform: (manifest.platform as string) || 'unknown',
      profileName: (manifest.profileName as string) || 'Default',
      bpakFilePath: bpakPath,
      manifestJson,
    });

    return NextResponse.json(
      {
        id: backup.id,
        name: backup.name,
        size: backup.size,
        browser: backup.browser,
        platform: backup.platform,
        profileName: backup.profileName,
        createdAt: backup.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
