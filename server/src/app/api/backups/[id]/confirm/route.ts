import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { confirmBackup } from '@/services/backup';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const backup = await confirmBackup(id, user.id);

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found or file not uploaded' }, { status: 404 });
    }

    return NextResponse.json({
      id: backup.id,
      name: backup.name,
      size: backup.size,
      browser: backup.browser,
      platform: backup.platform,
      profileName: backup.profileName,
      createdAt: backup.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Confirm backup error:', error);
    return NextResponse.json({ error: 'Failed to confirm backup' }, { status: 500 });
  }
}
