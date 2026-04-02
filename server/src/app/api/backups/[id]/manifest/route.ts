import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBackup } from '@/services/backup';
import { downloadFromStorage } from '@/lib/gcs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    const backup = await getBackup(id, user.id);

    if (!backup) return NextResponse.json({ error: 'Backup not found' }, { status: 404 });

    const stream = await downloadFromStorage(backup.manifestKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const data = Buffer.concat(chunks).toString('utf-8');

    return new NextResponse(data, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
