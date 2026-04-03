import { createReadStream, createWriteStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
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
    onProgress?: ProgressCallback,
  ): Promise<BackupInfo> {
    const manifestJson = await readFile(manifestPath, 'utf-8');
    const fileSize = (await stat(bpakPath)).size;

    // Step 1: Init backup — server creates DB record + returns signed GCS URL
    const initRes = await fetch(`${this.serverUrl}/api/backups`, {
      method: 'POST',
      headers: { ...this.headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, size: fileSize, manifestJson }),
    });

    if (!initRes.ok) throw new Error(`Init failed: ${initRes.status} ${await initRes.text()}`);
    const { backupId, uploadUrl } = (await initRes.json()) as { backupId: string; uploadUrl: string };

    // Step 2: Upload .bpak directly to GCS via signed URL
    const fileData = await readFile(bpakPath);
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: fileData,
    });

    if (!uploadRes.ok) throw new Error(`GCS upload failed: ${uploadRes.status}`);

    // Step 3: Confirm upload — server verifies file exists
    const confirmRes = await fetch(`${this.serverUrl}/api/backups/${backupId}/confirm`, {
      method: 'POST',
      headers: this.headers(),
    });

    if (!confirmRes.ok) throw new Error(`Confirm failed: ${confirmRes.status} ${await confirmRes.text()}`);
    return (await confirmRes.json()) as BackupInfo;
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
    // Step 1: Get signed download URL from server
    const metaRes = await fetch(`${this.serverUrl}/api/backups/${id}/download`, {
      headers: this.headers(),
    });
    if (!metaRes.ok) throw new Error(`Download failed: ${metaRes.status} ${await metaRes.text()}`);

    const { downloadUrl, size } = (await metaRes.json()) as { downloadUrl: string; size: number };

    // Step 2: Download directly from GCS
    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error(`GCS download failed: ${res.status}`);

    const body = res.body;
    if (!body) throw new Error('Empty download response');

    const writer = createWriteStream(destPath);
    const reader = Readable.fromWeb(body as any);

    if (onProgress && size > 0) {
      let transferred = 0;
      reader.on('data', (chunk: Buffer) => {
        transferred += chunk.length;
        onProgress(transferred, size);
      });
    }

    await pipeline(reader, writer);
  }

  async downloadManifest(id: string, destPath: string): Promise<void> {
    // Get signed URL then download from GCS
    const metaRes = await fetch(`${this.serverUrl}/api/backups/${id}/manifest`, {
      headers: this.headers(),
    });
    if (!metaRes.ok) throw new Error(`Manifest download failed: ${metaRes.status}`);

    const { downloadUrl } = (await metaRes.json()) as { downloadUrl: string };

    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error(`GCS manifest download failed: ${res.status}`);

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
