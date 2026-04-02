'use client';

import { useState } from 'react';

interface Backup {
  id: string;
  name: string;
  size: number;
  browser: string;
  platform: string;
  profileName: string;
  createdAt: string;
}

export default function BackupTable({ initialBackups }: { initialBackups: Backup[] }) {
  const [backups, setBackups] = useState(initialBackups);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm(`Delete backup "${id}"?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/backups/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBackups(backups.filter((b) => b.id !== id));
      } else {
        alert('Failed to delete backup');
      }
    } catch {
      alert('Failed to delete backup');
    }
    setDeleting(null);
  }

  if (backups.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--muted)]">
        <p className="text-lg mb-2">No backups yet</p>
        <p className="text-sm">
          Use the CLI to pack your first browser profile:
          <code className="ml-2 bg-[var(--code-bg)] px-2 py-1 rounded text-[var(--accent)]">browserpack pack</code>
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--card-border)] text-left text-[var(--muted)] bg-[var(--card-bg)]">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Browser</th>
            <th className="px-4 py-3 font-medium">Profile</th>
            <th className="px-4 py-3 font-medium">Platform</th>
            <th className="px-4 py-3 font-medium">Size</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {backups.map((b) => (
            <tr key={b.id} className="border-b border-[var(--card-border)] hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3 font-medium text-[var(--foreground)]">{b.name}</td>
              <td className="px-4 py-3 text-[var(--muted)]">{b.browser}</td>
              <td className="px-4 py-3 text-[var(--muted)]">{b.profileName}</td>
              <td className="px-4 py-3 text-[var(--muted)]">{b.platform}</td>
              <td className="px-4 py-3 text-[var(--muted)]">{(b.size / 1024 / 1024).toFixed(2)} MB</td>
              <td className="px-4 py-3 text-[var(--muted)]">{new Date(b.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleDelete(b.id)}
                  disabled={deleting === b.id}
                  className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50 transition-colors"
                >
                  {deleting === b.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
