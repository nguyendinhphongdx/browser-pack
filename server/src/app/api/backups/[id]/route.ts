import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { deleteBackup } from '@/services/backup';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    const deleted = await deleteBackup(id, user.id);

    if (!deleted) return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
