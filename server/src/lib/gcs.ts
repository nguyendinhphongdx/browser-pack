import { Storage } from '@google-cloud/storage';
import { Readable } from 'node:stream';

let _storage: Storage | null = null;

function getStorage(): Storage {
  if (!_storage) {
    _storage = new Storage({
      keyFilename: process.env.GCS_KEY_FILE || undefined,
    });
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
