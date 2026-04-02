import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, readdir, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as tar from 'tar';
import { buildFileList } from '../../../src/packer/file-filter.js';
import { createManifest, computeChecksum } from '../../../src/profile/manifest.js';
import type { ProfileInfo } from '../../../src/core/types.js';

const PROFILE_DIR = join(__dirname, '../../fixtures/fake-profile/Default');

describe('Packer round-trip', () => {
  let tmpDir: string;
  let archivePath: string;
  let extractDir: string;

  const fakeProfile: ProfileInfo = {
    browser: 'chrome',
    profileName: 'Default',
    profilePath: PROFILE_DIR,
    browserVersion: '124.0.6367.91',
    platform: 'linux',
  };

  beforeAll(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'browserpack-test-'));
    archivePath = join(tmpDir, 'test.tar.gz');
    extractDir = join(tmpDir, 'extracted');
    await mkdir(extractDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should create a tar.gz archive from profile files', async () => {
    const fileList = await buildFileList(PROFILE_DIR, {
      preset: 'sessions-only',
      includeExtensions: false,
      includeHistory: false,
      includePasswords: true,
    });

    expect(fileList.length).toBeGreaterThan(0);

    // Create archive
    await tar.create(
      { gzip: true, file: archivePath, cwd: PROFILE_DIR, portable: true },
      fileList,
    );

    // Extract and verify
    await tar.extract({ file: archivePath, cwd: extractDir });

    // Check files were extracted
    const extractedFiles = await readdir(extractDir);
    expect(extractedFiles).toContain('Cookies');
    expect(extractedFiles).toContain('Preferences');
  });

  it('should preserve file contents in round-trip', async () => {
    const originalContent = await readFile(join(PROFILE_DIR, 'Cookies'), 'utf-8');
    const extractedContent = await readFile(join(extractDir, 'Cookies'), 'utf-8');
    expect(extractedContent).toBe(originalContent);
  });

  it('should compute consistent checksum', async () => {
    const checksum1 = await computeChecksum(archivePath);
    const checksum2 = await computeChecksum(archivePath);
    expect(checksum1).toBe(checksum2);
    expect(checksum1).toHaveLength(64); // SHA-256 hex
  });

  it('should create valid manifest', async () => {
    const fileList = await buildFileList(PROFILE_DIR, {
      preset: 'sessions-only',
      includeExtensions: false,
      includeHistory: false,
      includePasswords: true,
    });
    const checksum = await computeChecksum(archivePath);
    const manifest = createManifest(fakeProfile, fileList, checksum);

    expect(manifest.version).toBe(1);
    expect(manifest.browser).toBe('chrome');
    expect(manifest.profileName).toBe('Default');
    expect(manifest.platform).toBe('linux');
    expect(manifest.checksum).toBe(checksum);
    expect(manifest.includedFiles).toEqual(fileList);
    expect(manifest.encryption.algorithm).toBe('aes-256-gcm');
  });
});
