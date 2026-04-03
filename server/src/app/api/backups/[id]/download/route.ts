import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getBackup } from '@/services/backup';
import { generateSignedDownloadUrl, getStorageObjectSize } from '@/lib/gcs';

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

    const size = await getStorageObjectSize(backup.storageKey);
    const downloadUrl = await generateSignedDownloadUrl(backup.storageKey);

    return NextResponse.json({
      downloadUrl,
      size,
      name: backup.name,
    });
  } catch (err) {
    console.error('Download error:', err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
