import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import * as tar from 'tar';
import type { PackManifest, ProfileInfo } from '../core/types.js';
import { computeChecksum, readManifest } from '../profile/manifest.js';
import { assertBrowserClosed } from '../profile/lock-checker.js';
import { createNewProfile } from '../profile/chrome.js';
import { logger } from '../core/logger.js';
import { BrowserPackError } from '../core/errors.js';

const MARKER_FILE = '.bpacker';

interface BrowserPackMarker {
  backupId: string;
  backupName: string;
  restoredAt: string;
}

export interface UnpackOptions {
  archivePath: string;
  manifestPath: string;
  targetProfile: ProfileInfo;
  backupId: string;
  backupName: string;
  force: boolean;
  skipVersionCheck: boolean;
}

export async function unpackProfile(options: UnpackOptions): Promise<ProfileInfo> {
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

  // 5. Find or create target profile
  const chromeDataDir = dirname(options.targetProfile.profilePath);
  let restoreProfile: ProfileInfo;

  if (options.force) {
    // Force: overwrite the specified profile directly
    restoreProfile = options.targetProfile;
    logger.warn(`Overwriting profile: ${restoreProfile.profileName}`);
  } else {
    // Check if we previously pulled this backup — find profile with matching marker
    const existingProfile = await findProfileByBackupId(chromeDataDir, options.backupId);

    if (existingProfile) {
      // Same backup pulled before → update in place
      restoreProfile = {
        ...options.targetProfile,
        profilePath: existingProfile.path,
        profileName: existingProfile.name,
      };
      logger.info(`Updating previously pulled profile: ${restoreProfile.profileName}`);
    } else {
      // New pull → create new profile with distinct name
      const baseName = manifest.profileName || 'Restored';
      const profileName = `${baseName} (bpacker)`;
      logger.info(`Creating new profile: ${profileName}`);
      restoreProfile = await createNewProfile(
        chromeDataDir,
        profileName,
        options.targetProfile.browser,
        options.targetProfile.platform,
        manifest.profileMeta,
      );
    }
  }

  // 6. Create target directory and extract
  await mkdir(restoreProfile.profilePath, { recursive: true });

  logger.info('Extracting archive...');
  await tar.extract({
    file: options.archivePath,
    cwd: restoreProfile.profilePath,
  });

  // 7. Write marker file
  const marker: BrowserPackMarker = {
    backupId: options.backupId,
    backupName: options.backupName,
    restoredAt: new Date().toISOString(),
  };
  await writeFile(
    join(restoreProfile.profilePath, MARKER_FILE),
    JSON.stringify(marker, null, 2),
    'utf-8',
  );

  logger.success(`Profile restored to: ${restoreProfile.profilePath}`);
  logger.info(`Profile name: ${restoreProfile.profileName}`);
  logger.info(`Files restored: ${manifest.includedFiles.length}`);

  return restoreProfile;
}

async function findProfileByBackupId(
  chromeDataDir: string,
  backupId: string,
): Promise<{ path: string; name: string } | null> {
  try {
    const entries = await readdir(chromeDataDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const markerPath = join(chromeDataDir, entry.name, MARKER_FILE);
      if (!existsSync(markerPath)) continue;

      try {
        const raw = await readFile(markerPath, 'utf-8');
        const marker = JSON.parse(raw) as BrowserPackMarker;
        if (marker.backupId === backupId) {
          return { path: join(chromeDataDir, entry.name), name: marker.backupName };
        }
      } catch {
        continue;
      }
    }
  } catch {
    // Can't read directory
  }
  return null;
}

function checkCompatibility(manifest: PackManifest, target: ProfileInfo): void {
  if (manifest.platform !== target.platform) {
    logger.warn(
      `Cross-platform restore: packed on ${manifest.platform}, restoring on ${target.platform}.`,
    );
    logger.warn('Saved passwords (Login Data) will NOT work across platforms.');
  }

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
