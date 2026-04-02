import { existsSync } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import * as tar from 'tar';
import type { PackManifest, ProfileInfo } from '../core/types.js';
import { computeChecksum, readManifest } from '../profile/manifest.js';
import { assertBrowserClosed } from '../profile/lock-checker.js';
import { logger } from '../core/logger.js';
import { BrowserPackError } from '../core/errors.js';

export interface UnpackOptions {
  archivePath: string;
  manifestPath: string;
  targetProfile: ProfileInfo;
  force: boolean;
  skipVersionCheck: boolean;
}

export async function unpackProfile(options: UnpackOptions): Promise<void> {
  // 1. Ensure browser is closed
  await assertBrowserClosed(options.targetProfile);

  // 2. Read and validate manifest
  logger.info('Reading manifest...');
  const manifest = await readManifest(options.manifestPath);

  // 3. Verify checksum
  logger.info('Verifying archive integrity...');
  const checksum = await computeChecksum(options.archivePath);
  if (checksum !== manifest.checksum) {
    throw new BrowserPackError(
      'Archive checksum mismatch. The file may be corrupted.',
    );
  }

  // 4. Version/platform warnings
  if (!options.skipVersionCheck) {
    checkCompatibility(manifest, options.targetProfile);
  }

  // 5. Backup existing profile if it exists
  const targetPath = options.targetProfile.profilePath;
  if (existsSync(targetPath)) {
    if (!options.force) {
      throw new BrowserPackError(
        `Profile already exists at ${targetPath}. Use --force to overwrite.`,
      );
    }

    const backupPath = `${targetPath}.browserpack-backup-${Date.now()}`;
    logger.warn(`Backing up existing profile to: ${backupPath}`);
    await rename(targetPath, backupPath);
  }

  // 6. Create target directory and extract
  await mkdir(targetPath, { recursive: true });

  logger.info('Extracting archive...');
  await tar.extract({
    file: options.archivePath,
    cwd: targetPath,
  });

  logger.success(`Profile restored to: ${targetPath}`);
  logger.info(`Files restored: ${manifest.includedFiles.length}`);
}

function checkCompatibility(manifest: PackManifest, target: ProfileInfo): void {
  // Platform warning
  if (manifest.platform !== target.platform) {
    logger.warn(
      `Cross-platform restore: packed on ${manifest.platform}, restoring on ${target.platform}.`,
    );
    logger.warn('Saved passwords (Login Data) will NOT work across platforms.');
  }

  // Browser version warning
  if (manifest.browserVersion && target.browserVersion) {
    const sourceMajor = parseInt(manifest.browserVersion.split('.')[0], 10);
    const targetMajor = parseInt(target.browserVersion.split('.')[0], 10);

    if (targetMajor < sourceMajor) {
      logger.warn(
        `Downgrading profile from Chrome ${sourceMajor} to ${targetMajor}. This may cause issues.`,
      );
    } else if (targetMajor > sourceMajor + 5) {
      logger.warn(
        `Large version gap: Chrome ${sourceMajor} → ${targetMajor}. Some settings may not migrate correctly.`,
      );
    }
  }
}
