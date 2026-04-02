import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import {
  DEFAULT_KDF_TIME_COST,
  DEFAULT_KDF_MEMORY_COST,
  DEFAULT_KDF_PARALLELISM,
  DEFAULT_KDF_SALT_LENGTH,
} from '../core/constants.js';

export interface KdfParams {
  timeCost: number;
  memoryCost: number;
  parallelism: number;
  saltLength: number;
}

export const DEFAULT_KDF_PARAMS: KdfParams = {
  timeCost: DEFAULT_KDF_TIME_COST,
  memoryCost: DEFAULT_KDF_MEMORY_COST,
  parallelism: DEFAULT_KDF_PARALLELISM,
  saltLength: DEFAULT_KDF_SALT_LENGTH,
};

export function generateSalt(length: number = DEFAULT_KDF_SALT_LENGTH): Buffer {
  return randomBytes(length);
}

export async function deriveKey(
  password: string,
  salt: Buffer,
  params: KdfParams = DEFAULT_KDF_PARAMS,
): Promise<Buffer> {
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    salt,
    timeCost: params.timeCost,
    memoryCost: params.memoryCost,
    parallelism: params.parallelism,
    hashLength: 32, // 256 bits for AES-256
    raw: true,
  });

  return Buffer.from(hash);
}
