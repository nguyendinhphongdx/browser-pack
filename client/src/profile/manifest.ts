import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { hostname } from 'node:os';
import type { PackManifest, ProfileInfo } from '../core/types.js';
import {
  APP_VERSION,
  DEFAULT_KDF_TIME_COST,
  DEFAULT_KDF_MEMORY_COST,
  DEFAULT_KDF_PARALLELISM,
  DEFAULT_KDF_SALT_LENGTH,
} from '../core/constants.js';
import { ManifestError } from '../core/errors.js';

export function createManifest(
  profile: ProfileInfo,
  includedFiles: string[],
  checksum: string,
): PackManifest {
  return {
    version: 1,
    browserpack: APP_VERSION,
    browser: profile.browser,
    browserVersion: profile.browserVersion,
    profileName: profile.profileName,
    platform: profile.platform,
    createdAt: new Date().toISOString(),
    hostname: hostname(),
    includedFiles,
    checksum,
    encryption: {
      algorithm: 'aes-256-gcm',
      kdf: 'argon2id',
      kdfParams: {
        timeCost: DEFAULT_KDF_TIME_COST,
        memoryCost: DEFAULT_KDF_MEMORY_COST,
        parallelism: DEFAULT_KDF_PARALLELISM,
        saltLength: DEFAULT_KDF_SALT_LENGTH,
      },
    },
  };
}

export async function computeChecksum(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

export async function writeManifest(manifest: PackManifest, filePath: string): Promise<void> {
  await writeFile(filePath, JSON.stringify(manifest, null, 2), 'utf-8');
}

export async function readManifest(filePath: string): Promise<PackManifest> {
  const content = await readFile(filePath, 'utf-8');
  const parsed = JSON.parse(content) as PackManifest;
  validateManifest(parsed);
  return parsed;
}

function validateManifest(manifest: unknown): asserts manifest is PackManifest {
  const m = manifest as Record<string, unknown>;
  if (m.version !== 1) {
    throw new ManifestError(`unsupported version: ${m.version}`);
  }
  if (typeof m.browser !== 'string') {
    throw new ManifestError('missing browser field');
  }
  if (typeof m.profileName !== 'string') {
    throw new ManifestError('missing profileName field');
  }
  if (typeof m.checksum !== 'string') {
    throw new ManifestError('missing checksum field');
  }
  if (!Array.isArray(m.includedFiles)) {
    throw new ManifestError('missing includedFiles field');
  }
}
