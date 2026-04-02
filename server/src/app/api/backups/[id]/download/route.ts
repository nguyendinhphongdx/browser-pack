import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBackup } from '@/services/backup';
import { downloadFromStorage, getStorageObjectSize } from '@/lib/gcs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    const backup = await getBackup(id, user.id);

    if (!backup) return NextResponse.json({ error: 'Backup not found' }, { status: 404 });

    const size = await getStorageObjectSize(backup.storageKey);
    const stream = await downloadFromStorage(backup.storageKey);

    // Convert Node stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${backup.name}.bpak"`,
        'Content-Length': String(size),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
