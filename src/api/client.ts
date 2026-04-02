import { createReadStream, createWriteStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { ProgressCallback } from '../core/types.js';

export interface BackupInfo {
  id: string;
  name: string;
  size: number;
  browser: string;
  platform: string;
  profileName: string;
  createdAt: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export class ApiClient {
  private serverUrl: string;
  private token: string;

  constructor(serverUrl: string, token: string) {
    this.serverUrl = serverUrl.replace(/\/$/, '');
    this.token = token;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  async me(): Promise<UserInfo> {
    const res = await fetch(`${this.serverUrl}/api/me`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`);
    return (await res.json()) as UserInfo;
  }

  async uploadBackup(
    bpakPath: string,
    manifestPath: string,
    name?: string,
  ): Promise<BackupInfo> {
    const { readFile } = await import('node:fs/promises');

    const bpakData = await readFile(bpakPath);
    const manifestData = await readFile(manifestPath);

    const formData = new FormData();
    formData.append('file', new Blob([bpakData]), 'backup.bpak');
    formData.append('manifest', new Blob([manifestData]), 'manifest.json');
    if (name) formData.append('name', name);

    const res = await fetch(`${this.serverUrl}/api/backups`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: formData,
    });

    if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
    return (await res.json()) as BackupInfo;
  }

  async listBackups(): Promise<BackupInfo[]> {
    const res = await fetch(`${this.serverUrl}/api/backups`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { backups: BackupInfo[] };
    return data.backups;
  }

  async downloadBackup(
    id: string,
    destPath: string,
    onProgress?: ProgressCallback,
  ): Promise<void> {
    const res = await fetch(`${this.serverUrl}/api/backups/${id}/download`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${await res.text()}`);

    const totalSize = parseInt(res.headers.get('content-length') || '0', 10);
    const body = res.body;
    if (!body) throw new Error('Empty download response');

    const writer = createWriteStream(destPath);
    const reader = Readable.fromWeb(body as any);

    if (onProgress && totalSize > 0) {
      let transferred = 0;
      reader.on('data', (chunk: Buffer) => {
        transferred += chunk.length;
        onProgress(transferred, totalSize);
      });
    }

    await pipeline(reader, writer);
  }

  async downloadManifest(id: string, destPath: string): Promise<void> {
    const res = await fetch(`${this.serverUrl}/api/backups/${id}/manifest`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Manifest download failed: ${res.status}`);

    const data = await res.text();
    const { writeFile } = await import('node:fs/promises');
    await writeFile(destPath, data, 'utf-8');
  }

  async deleteBackup(id: string): Promise<void> {
    const res = await fetch(`${this.serverUrl}/api/backups/${id}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Delete failed: ${res.status} ${await res.text()}`);
  }
}
