import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { listChromeProfiles, getChromeVersion } from '../../../src/profile/chrome.js';

const FIXTURE_DIR = join(__dirname, '../../fixtures/fake-profile');

describe('Chrome profile detection', () => {
  it('should list profiles from Local State', async () => {
    const profiles = await listChromeProfiles(FIXTURE_DIR, 'chrome', 'linux');

    expect(profiles).toHaveLength(2);
    expect(profiles[0].profileName).toBe('Test User');
    expect(profiles[0].browser).toBe('chrome');
    expect(profiles[0].platform).toBe('linux');
    expect(profiles[0].profilePath).toBe(join(FIXTURE_DIR, 'Default'));

    expect(profiles[1].profileName).toBe('Work');
    expect(profiles[1].profilePath).toBe(join(FIXTURE_DIR, 'Profile 1'));
  });

  it('should detect browser version', async () => {
    const version = await getChromeVersion(FIXTURE_DIR);
    expect(version).toBe('124.0.6367.91');
  });

  it('should include version in profile info', async () => {
    const profiles = await listChromeProfiles(FIXTURE_DIR, 'chrome', 'linux');
    expect(profiles[0].browserVersion).toBe('124.0.6367.91');
  });
});
