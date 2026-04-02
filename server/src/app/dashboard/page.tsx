import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import { getUserById } from '@/services/user';
import { listBackups } from '@/services/backup';
import Navbar from '@/components/Navbar';
import BackupTable from '@/components/BackupTable';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  let userId: string;
  try {
    const payload = verifyToken(token);
    userId = payload.sub;
  } catch {
    redirect('/login');
  }

  const user = await getUserById(userId);
  if (!user) redirect('/login');

  const backups = await listBackups(userId);

  const backupData = backups.map((b) => ({
    id: b.id,
    name: b.name,
    size: b.size,
    browser: b.browser,
    platform: b.platform,
    profileName: b.profileName,
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <>
      <Navbar email={user.email} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Your Backups</h1>
          <span className="text-sm text-[var(--muted)]">{backups.length} backup(s)</span>
        </div>
        <BackupTable initialBackups={backupData} />

        <div className="mt-12 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
          <h2 className="text-lg font-semibold mb-3 text-[var(--foreground)]">Quick start</h2>
          <div className="space-y-2 text-sm text-[var(--muted)]">
            <p>Pack a profile from your machine:</p>
            <code className="block bg-[var(--code-bg)] border border-[var(--card-border)] rounded-lg px-4 py-2 text-[var(--accent)]">
              browserpack pack --browser chrome
            </code>
            <p className="mt-3">Pull a backup on another machine:</p>
            <code className="block bg-[var(--code-bg)] border border-[var(--card-border)] rounded-lg px-4 py-2 text-[var(--accent)]">
              browserpack pull {backups[0]?.id || '<backup-id>'}
            </code>
          </div>
        </div>
      </main>
    </>
  );
}
