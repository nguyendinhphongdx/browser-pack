import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { BPAK_MAGIC, BPAK_VERSION } from '../core/constants.js';
import { DecryptionError } from '../core/errors.js';
import { deriveKey, generateSalt, type KdfParams, DEFAULT_KDF_PARAMS } from './key-derivation.js';

/**
 * BPAK file format:
 * [4 bytes]  Magic: "BPAK"
 * [1 byte]   Version: 0x01
 * [1 byte]   Salt length
 * [N bytes]  Salt (for Argon2id key derivation)
 * [12 bytes] IV (for AES-256-GCM)
 * [16 bytes] Auth tag (GCM)
 * [M bytes]  Ciphertext
 */

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const FIXED_HEADER_SIZE = 4 + 1 + 1; // magic + version + salt length byte

export interface EncryptResult {
  salt: Buffer;
  iv: Buffer;
}

export async function encryptFile(
  inputPath: string,
  outputPath: string,
  password: string,
  kdfParams: KdfParams = DEFAULT_KDF_PARAMS,
): Promise<EncryptResult> {
  const salt = generateSalt(kdfParams.saltLength);
  const key = await deriveKey(password, salt, kdfParams);
  const iv = randomBytes(IV_LENGTH);

  const plaintext = await readFile(inputPath);

  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Build BPAK file
  const header = Buffer.alloc(FIXED_HEADER_SIZE);
  BPAK_MAGIC.copy(header, 0);
  header.writeUInt8(BPAK_VERSION, 4);
  header.writeUInt8(salt.length, 5);

  const output = Buffer.concat([header, salt, iv, authTag, ciphertext]);
  await writeFile(outputPath, output);

  return { salt, iv };
}

export async function decryptFile(
  inputPath: string,
  outputPath: string,
  password: string,
  kdfParams: KdfParams = DEFAULT_KDF_PARAMS,
): Promise<void> {
  const data = await readFile(inputPath);

  if (data.length < FIXED_HEADER_SIZE) {
    throw new DecryptionError();
  }

  // Validate magic
  if (!data.subarray(0, 4).equals(BPAK_MAGIC)) {
    throw new DecryptionError();
  }

  // Validate version
  const version = data.readUInt8(4);
  if (version !== BPAK_VERSION) {
    throw new DecryptionError();
  }

  const saltLength = data.readUInt8(5);
  const minSize = FIXED_HEADER_SIZE + saltLength + IV_LENGTH + AUTH_TAG_LENGTH;
  if (data.length < minSize) {
    throw new DecryptionError();
  }

  let offset = FIXED_HEADER_SIZE;
  const salt = data.subarray(offset, offset + saltLength);
  offset += saltLength;
  const iv = data.subarray(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;
  const authTag = data.subarray(offset, offset + AUTH_TAG_LENGTH);
  offset += AUTH_TAG_LENGTH;
  const ciphertext = data.subarray(offset);

  // Derive key
  const key = await deriveKey(password, Buffer.from(salt), {
    ...kdfParams,
    saltLength,
  });

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  try {
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    await writeFile(outputPath, plaintext);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Unsupported state') || message.includes('unable to authenticate')) {
      throw new DecryptionError();
    }
    throw err;
  }
}
