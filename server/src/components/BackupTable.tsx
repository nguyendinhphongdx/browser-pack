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
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg mb-2">No backups yet</p>
        <p className="text-sm">
          Use the CLI to pack your first browser profile:
          <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-gray-800">browserpack pack</code>
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-3 font-medium">Name</th>
            <th className="pb-3 font-medium">Browser</th>
            <th className="pb-3 font-medium">Profile</th>
            <th className="pb-3 font-medium">Platform</th>
            <th className="pb-3 font-medium">Size</th>
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {backups.map((b) => (
            <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 font-medium text-gray-900">{b.name}</td>
              <td className="py-3 text-gray-600">{b.browser}</td>
              <td className="py-3 text-gray-600">{b.profileName}</td>
              <td className="py-3 text-gray-600">{b.platform}</td>
              <td className="py-3 text-gray-600">{(b.size / 1024 / 1024).toFixed(2)} MB</td>
              <td className="py-3 text-gray-600">{new Date(b.createdAt).toLocaleDateString()}</td>
              <td className="py-3">
                <button
                  onClick={() => handleDelete(b.id)}
                  disabled={deleting === b.id}
                  className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
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
