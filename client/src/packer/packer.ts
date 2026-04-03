import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as tar from 'tar';
import type { PackOptions, PackResult } from '../core/types.js';
import { buildFileList } from './file-filter.js';
import { createManifest, computeChecksum, writeManifest } from '../profile/manifest.js';
import { assertBrowserClosed } from '../profile/lock-checker.js';
import { logger } from '../core/logger.js';
import { stat } from 'node:fs/promises';

export async function packProfile(options: PackOptions): Promise<PackResult> {
  // 1. Ensure browser is closed
  await assertBrowserClosed(options.profile);

  // 2. Build file list based on preset/options
  logger.info('Scanning profile files...');
  const fileList = await buildFileList(options.profile.profilePath, {
    preset: options.preset,
    includeExtensions: options.includeExtensions,
    includeHistory: options.includeHistory,
    includePasswords: options.includePasswords,
    customInclude: options.customInclude,
    customExclude: options.customExclude,
  });

  if (fileList.length === 0) {
    throw new Error('No files matched the selected preset/filters.');
  }

  logger.info(`Found ${fileList.length} files to pack.`);

  // 3. Create temp directory and tar.gz
  const tmpDir = await mkdtemp(join(tmpdir(), 'bpacker-'));
  const archivePath = join(tmpDir, 'profile.tar.gz');
  const manifestPath = join(tmpDir, 'manifest.json');

  try {
    logger.info('Creating archive...');
    await tar.create(
      {
        gzip: true,
        file: archivePath,
        cwd: options.profile.profilePath,
        portable: true,
      },
      fileList,
    );

    // 4. Compute checksum
    const checksum = await computeChecksum(archivePath);

    // 5. Create manifest
    const manifest = await createManifest(options.profile, fileList, checksum);
    await writeManifest(manifest, manifestPath);

    // 6. Get archive size
    const archiveStat = await stat(archivePath);

    return {
      archivePath,
      manifest,
      sizeBytes: archiveStat.size,
    };
  } catch (error) {
    // Cleanup on failure
    await rm(tmpDir, { recursive: true, force: true });
    throw error;
  }
}
