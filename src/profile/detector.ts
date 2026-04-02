import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { BrowserType, Platform, ProfileInfo } from '../core/types.js';
import { BROWSER_DATA_PATHS } from '../core/constants.js';
import { ProfileNotFoundError } from '../core/errors.js';
import { listChromeProfiles } from './chrome.js';

export function getCurrentPlatform(): Platform {
  const p = process.platform;
  if (p === 'linux' || p === 'darwin' || p === 'win32') return p;
  throw new Error(`Unsupported platform: ${p}`);
}

export function getBrowserDataDir(browser: BrowserType, platform?: Platform): string {
  const plat = platform ?? getCurrentPlatform();
  const relativePath = BROWSER_DATA_PATHS[browser]?.[plat];
  if (!relativePath) {
    throw new Error(`Unknown browser/platform combination: ${browser}/${plat}`);
  }

  if (plat === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) {
      throw new Error('LOCALAPPDATA environment variable is not set');
    }
    return join(localAppData, relativePath);
  }

  return join(homedir(), relativePath);
}

export function detectInstalledBrowsers(platform?: Platform): BrowserType[] {
  const plat = platform ?? getCurrentPlatform();
  const browsers: BrowserType[] = ['chrome', 'chromium', 'brave', 'edge'];

  return browsers.filter((browser) => {
    try {
      const dataDir = getBrowserDataDir(browser, plat);
      return existsSync(dataDir);
    } catch {
      return false;
    }
  });
}

export async function listProfiles(
  browser: BrowserType,
  platform?: Platform,
): Promise<ProfileInfo[]> {
  const plat = platform ?? getCurrentPlatform();
  const dataDir = getBrowserDataDir(browser, plat);

  if (!existsSync(dataDir)) {
    throw new ProfileNotFoundError(dataDir);
  }

  // All supported browsers are Chromium-based, same profile structure
  return listChromeProfiles(dataDir, browser, plat);
}

export async function getProfile(
  browser: BrowserType,
  profileName: string = 'Default',
  platform?: Platform,
): Promise<ProfileInfo> {
  const profiles = await listProfiles(browser, platform);
  const match = profiles.find(
    (p) => p.profileName === profileName || p.profilePath.endsWith(profileName),
  );

  if (!match) {
    throw new ProfileNotFoundError(
      `Profile "${profileName}" not found for ${browser}. Available: ${profiles.map((p) => p.profileName).join(', ')}`,
    );
  }

  return match;
}
