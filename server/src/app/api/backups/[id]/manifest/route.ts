import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getBackup } from '@/services/backup';
import { generateSignedDownloadUrl } from '@/lib/gcs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const backup = await getBackup(id, user.id);

    if (!backup) return NextResponse.json({ error: 'Backup not found' }, { status: 404 });

    const downloadUrl = await generateSignedDownloadUrl(backup.manifestKey);
    return NextResponse.json({ downloadUrl });
  } catch (err) {
    console.error('Manifest error:', err);
    return NextResponse.json({ error: 'Failed to get manifest' }, { status: 500 });
  }
}
