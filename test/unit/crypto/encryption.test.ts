import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, readFile, writeFile, rm, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { encryptFile, decryptFile } from '../../../src/crypto/encryption.js';
import { deriveKey, generateSalt } from '../../../src/crypto/key-derivation.js';
import { DecryptionError } from '../../../src/core/errors.js';

const FAST_KDF_PARAMS = {
  timeCost: 1,
  memoryCost: 1024, // 1 MiB — fast for tests
  parallelism: 1,
  saltLength: 16,
};

describe('Key derivation', () => {
  it('should produce consistent output for same password and salt', async () => {
    const salt = generateSalt(16);
    const key1 = await deriveKey('testpassword', salt, FAST_KDF_PARAMS);
    const key2 = await deriveKey('testpassword', salt, FAST_KDF_PARAMS);
    expect(key1.equals(key2)).toBe(true);
    expect(key1.length).toBe(32); // 256 bits
  });

  it('should produce different output for different salts', async () => {
    const salt1 = generateSalt(16);
    const salt2 = generateSalt(16);
    const key1 = await deriveKey('testpassword', salt1, FAST_KDF_PARAMS);
    const key2 = await deriveKey('testpassword', salt2, FAST_KDF_PARAMS);
    expect(key1.equals(key2)).toBe(false);
  });

  it('should produce different output for different passwords', async () => {
    const salt = generateSalt(16);
    const key1 = await deriveKey('password1', salt, FAST_KDF_PARAMS);
    const key2 = await deriveKey('password2', salt, FAST_KDF_PARAMS);
    expect(key1.equals(key2)).toBe(false);
  });
});

describe('Encryption', () => {
  let tmpDir: string;
  const password = 'test-encryption-password-2024';

  beforeAll(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'browserpack-crypto-test-'));
  });

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should encrypt and decrypt a file (round-trip)', async () => {
    const inputPath = join(tmpDir, 'plaintext.txt');
    const encryptedPath = join(tmpDir, 'encrypted.bpak');
    const decryptedPath = join(tmpDir, 'decrypted.txt');

    const original = 'Hello, BrowserPack! This is a test of AES-256-GCM encryption.';
    await writeFile(inputPath, original, 'utf-8');

    await encryptFile(inputPath, encryptedPath, password, FAST_KDF_PARAMS);
    await decryptFile(encryptedPath, decryptedPath, password, FAST_KDF_PARAMS);

    const result = await readFile(decryptedPath, 'utf-8');
    expect(result).toBe(original);
  });

  it('should handle binary data correctly', async () => {
    const inputPath = join(tmpDir, 'binary.dat');
    const encryptedPath = join(tmpDir, 'binary.bpak');
    const decryptedPath = join(tmpDir, 'binary-dec.dat');

    const original = Buffer.alloc(1024 * 100); // 100 KB of random-ish data
    for (let i = 0; i < original.length; i++) {
      original[i] = i % 256;
    }
    await writeFile(inputPath, original);

    await encryptFile(inputPath, encryptedPath, password, FAST_KDF_PARAMS);
    await decryptFile(encryptedPath, decryptedPath, password, FAST_KDF_PARAMS);

    const result = await readFile(decryptedPath);
    expect(result.equals(original)).toBe(true);
  });

  it('should fail with wrong password', async () => {
    const inputPath = join(tmpDir, 'wrong-pw.txt');
    const encryptedPath = join(tmpDir, 'wrong-pw.bpak');
    const decryptedPath = join(tmpDir, 'wrong-pw-dec.txt');

    await writeFile(inputPath, 'secret data', 'utf-8');
    await encryptFile(inputPath, encryptedPath, password, FAST_KDF_PARAMS);

    await expect(
      decryptFile(encryptedPath, decryptedPath, 'wrong-password', FAST_KDF_PARAMS),
    ).rejects.toThrow(DecryptionError);
  });

  it('should fail with corrupted ciphertext', async () => {
    const inputPath = join(tmpDir, 'corrupt.txt');
    const encryptedPath = join(tmpDir, 'corrupt.bpak');
    const decryptedPath = join(tmpDir, 'corrupt-dec.txt');

    await writeFile(inputPath, 'data to corrupt', 'utf-8');
    await encryptFile(inputPath, encryptedPath, password, FAST_KDF_PARAMS);

    // Corrupt a byte in the middle of ciphertext
    const encrypted = await readFile(encryptedPath);
    encrypted[60] ^= 0xff; // Flip bits at offset 60 (inside ciphertext area)
    await writeFile(encryptedPath, encrypted);

    await expect(
      decryptFile(encryptedPath, decryptedPath, password, FAST_KDF_PARAMS),
    ).rejects.toThrow(DecryptionError);
  });

  it('should fail with truncated file', async () => {
    const encryptedPath = join(tmpDir, 'truncated.bpak');
    const decryptedPath = join(tmpDir, 'truncated-dec.txt');

    // Write a file too small to be valid
    await writeFile(encryptedPath, Buffer.alloc(10));

    await expect(
      decryptFile(encryptedPath, decryptedPath, password, FAST_KDF_PARAMS),
    ).rejects.toThrow(DecryptionError);
  });

  it('should fail with invalid magic bytes', async () => {
    const encryptedPath = join(tmpDir, 'bad-magic.bpak');
    const decryptedPath = join(tmpDir, 'bad-magic-dec.txt');

    const fakeFile = Buffer.alloc(100);
    fakeFile.write('FAKE', 0); // Wrong magic
    await writeFile(encryptedPath, fakeFile);

    await expect(
      decryptFile(encryptedPath, decryptedPath, password, FAST_KDF_PARAMS),
    ).rejects.toThrow(DecryptionError);
  });

  it('should produce different ciphertext for same plaintext (random IV)', async () => {
    const inputPath = join(tmpDir, 'same-input.txt');
    const enc1 = join(tmpDir, 'same-enc1.bpak');
    const enc2 = join(tmpDir, 'same-enc2.bpak');

    await writeFile(inputPath, 'same content', 'utf-8');

    await encryptFile(inputPath, enc1, password, FAST_KDF_PARAMS);
    await encryptFile(inputPath, enc2, password, FAST_KDF_PARAMS);

    const data1 = await readFile(enc1);
    const data2 = await readFile(enc2);
    expect(data1.equals(data2)).toBe(false);
  });
});
