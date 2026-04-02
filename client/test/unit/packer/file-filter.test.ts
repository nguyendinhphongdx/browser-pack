import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { buildFileList, getIncludePatterns, getExcludePatterns } from '../../../src/packer/file-filter.js';

const PROFILE_DIR = join(__dirname, '../../fixtures/fake-profile/Default');

describe('File filter', () => {
  describe('getIncludePatterns', () => {
    it('should return session files for sessions-only preset', () => {
      const patterns = getIncludePatterns({
        preset: 'sessions-only',
        includeExtensions: false,
        includeHistory: false,
        includePasswords: true,
      });

      expect(patterns).toContain('Cookies');
      expect(patterns).toContain('Login Data');
      expect(patterns).toContain('Preferences');
    });

    it('should exclude Login Data when includePasswords is false', () => {
      const patterns = getIncludePatterns({
        preset: 'sessions-only',
        includeExtensions: false,
        includeHistory: false,
        includePasswords: false,
      });

      expect(patterns).toContain('Cookies');
      expect(patterns).not.toContain('Login Data');
    });

    it('should return bookmark files for bookmarks-only preset', () => {
      const patterns = getIncludePatterns({
        preset: 'bookmarks-only',
        includeExtensions: false,
        includeHistory: false,
        includePasswords: false,
      });

      expect(patterns).toEqual(['Bookmarks', 'Bookmarks.bak']);
    });

    it('should return null (include all) for full preset', () => {
      const patterns = getIncludePatterns({
        preset: 'full',
        includeExtensions: true,
        includeHistory: true,
        includePasswords: true,
      });

      expect(patterns).toBeNull();
    });
  });

  describe('getExcludePatterns', () => {
    it('should always exclude cache directories', () => {
      const patterns = getExcludePatterns({
        preset: 'full',
        includeExtensions: true,
        includeHistory: true,
        includePasswords: true,
      });

      expect(patterns).toContain('GPUCache/**');
      expect(patterns).toContain('LOCK');
      expect(patterns).toContain('LOG');
    });

    it('should exclude extensions when not included', () => {
      const patterns = getExcludePatterns({
        preset: 'full',
        includeExtensions: false,
        includeHistory: true,
        includePasswords: true,
      });

      expect(patterns).toContain('Extensions/**');
    });
  });

  describe('buildFileList', () => {
    it('should list session files for sessions-only preset', async () => {
      const files = await buildFileList(PROFILE_DIR, {
        preset: 'sessions-only',
        includeExtensions: false,
        includeHistory: false,
        includePasswords: true,
      });

      expect(files).toContain('Cookies');
      expect(files).toContain('Login Data');
      expect(files).toContain('Preferences');
      expect(files).not.toContain('History');
      expect(files).not.toContain('Bookmarks');
    });

    it('should exclude cache in full preset', async () => {
      const files = await buildFileList(PROFILE_DIR, {
        preset: 'full',
        includeExtensions: true,
        includeHistory: true,
        includePasswords: true,
      });

      // Should include normal files
      expect(files).toContain('Cookies');
      expect(files).toContain('Bookmarks');
      expect(files).toContain('History');

      // Should exclude cache and lock files
      const hasCache = files.some((f) => f.startsWith('GPUCache'));
      expect(hasCache).toBe(false);

      expect(files).not.toContain('LOCK');
      expect(files).not.toContain('LOG');
    });

    it('should only include bookmarks for bookmarks-only preset', async () => {
      const files = await buildFileList(PROFILE_DIR, {
        preset: 'bookmarks-only',
        includeExtensions: false,
        includeHistory: false,
        includePasswords: false,
      });

      expect(files).toEqual(['Bookmarks', 'Bookmarks.bak']);
    });
  });
});
