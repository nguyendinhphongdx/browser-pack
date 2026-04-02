import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { BROWSER_DATA_PATHS } from '../../../src/core/constants.js';
import { listChromeProfiles } from '../../../src/profile/chrome.js';
import type { BrowserType, Platform } from '../../../src/core/types.js';

const FIXTURE_DIR = join(__dirname, '../../fixtures/fake-profile');

describe('Multi-browser support', () => {
  describe('BROWSER_DATA_PATHS', () => {
    const browsers: BrowserType[] = ['chrome', 'chromium', 'brave', 'edge'];
    const platforms: Platform[] = ['linux', 'darwin', 'win32'];

    for (const browser of browsers) {
      for (const platform of platforms) {
        it(`should have path for ${browser}/${platform}`, () => {
          const path = BROWSER_DATA_PATHS[browser]?.[platform];
          expect(path).toBeDefined();
          expect(path.length).toBeGreaterThan(0);
        });
      }
    }
  });

  describe('Chromium-based profile listing', () => {
    it('should work for brave browser type', async () => {
      // All Chromium-based browsers share the same Local State format
      const profiles = await listChromeProfiles(FIXTURE_DIR, 'brave', 'linux');
      expect(profiles).toHaveLength(2);
      expect(profiles[0].browser).toBe('brave');
      expect(profiles[0].platform).toBe('linux');
    });

    it('should work for edge browser type', async () => {
      const profiles = await listChromeProfiles(FIXTURE_DIR, 'edge', 'darwin');
      expect(profiles).toHaveLength(2);
      expect(profiles[0].browser).toBe('edge');
      expect(profiles[0].platform).toBe('darwin');
    });

    it('should work for chromium browser type', async () => {
      const profiles = await listChromeProfiles(FIXTURE_DIR, 'chromium', 'win32');
      expect(profiles).toHaveLength(2);
      expect(profiles[0].browser).toBe('chromium');
      expect(profiles[0].platform).toBe('win32');
    });
  });
});
