import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { initBackup, listBackups } from '@/services/backup';

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
}

// POST /api/backups — init backup, returns signed URL for direct GCS upload
export async function POST(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, size, manifestJson } = body as {
      name?: string;
      size: number;
      manifestJson: string;
    };

    if (!manifestJson || !size) {
      return NextResponse.json({ error: 'Missing manifestJson or size' }, { status: 400 });
    }

    let manifest: Record<string, unknown>;
    try {
      manifest = JSON.parse(manifestJson);
    } catch {
      return NextResponse.json({ error: 'Invalid manifest JSON' }, { status: 400 });
    }

    const backupName = name || `${manifest.browser}-${manifest.profileName}-${Date.now()}`;

    const result = await initBackup({
      userId: user.id,
      name: backupName,
      size,
      browser: (manifest.browser as string) || 'unknown',
      platform: (manifest.platform as string) || 'unknown',
      profileName: (manifest.profileName as string) || 'Default',
      manifestJson,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Init backup error:', error);
    return NextResponse.json({ error: 'Failed to init backup' }, { status: 500 });
  }
}
