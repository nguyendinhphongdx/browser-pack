import { Storage } from '@google-cloud/storage';
import { Readable } from 'node:stream';

let _storage: Storage | null = null;

function getStorage(): Storage {
  if (!_storage) {
    if (process.env.GCS_CREDENTIALS) {
      // Deploy: JSON string in env var (Vercel, Railway, etc.)
      const credentials = JSON.parse(process.env.GCS_CREDENTIALS);
      _storage = new Storage({ credentials });
    } else if (process.env.GCS_KEY_FILE) {
      // Local dev: path to service account JSON file
      _storage = new Storage({ keyFilename: process.env.GCS_KEY_FILE });
    } else {
      // GCP environments (Cloud Run, GKE): uses default credentials
      _storage = new Storage();
    }
  }
  return _storage;
}

function getBucket() {
  return getStorage().bucket(process.env.GCS_BUCKET!);
}

export async function uploadToStorage(key: string, filePath: string): Promise<void> {
  await getBucket().upload(filePath, { destination: key, resumable: true });
}

export async function uploadBufferToStorage(key: string, data: Buffer, contentType = 'application/json'): Promise<void> {
  await getBucket().file(key).save(data, { contentType });
}

export async function downloadFromStorage(key: string): Promise<Readable> {
  return getBucket().file(key).createReadStream();
}

export async function getStorageObjectSize(key: string): Promise<number> {
  const [metadata] = await getBucket().file(key).getMetadata();
  return Number(metadata.size) || 0;
}

export async function deleteFromStorage(key: string): Promise<void> {
  await getBucket().file(key).delete({ ignoreNotFound: true });
}

export async function generateSignedUploadUrl(key: string, expiresInMinutes = 30): Promise<string> {
  const file = getBucket().file(key);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
    contentType: 'application/octet-stream',
  });
  return url;
}

export async function generateSignedDownloadUrl(key: string, expiresInMinutes = 30): Promise<string> {
  const file = getBucket().file(key);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });
  return url;
}

export async function fileExistsInStorage(key: string): Promise<boolean> {
  const [exists] = await getBucket().file(key).exists();
  return exists;
}
