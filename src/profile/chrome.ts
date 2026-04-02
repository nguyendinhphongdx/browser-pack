import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProfileInfo, Platform } from '../core/types.js';

interface ProfileInfoCache {
  [profileDir: string]: {
    name?: string;
    gaia_name?: string;
    user_name?: string;
  };
}

interface LocalState {
  profile?: {
    info_cache?: ProfileInfoCache;
  };
}

export async function getChromeVersion(chromeDataDir: string): Promise<string | undefined> {
  try {
    const localState = await readLocalState(chromeDataDir);
    // Chrome stores version info in Local State under various keys depending on version
    const raw = localState as Record<string, unknown>;
    if (typeof raw['browser'] === 'object' && raw['browser'] !== null) {
      const browser = raw['browser'] as Record<string, unknown>;
      if (typeof browser['last_version'] === 'string') {
        return browser['last_version'];
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function listChromeProfiles(
  chromeDataDir: string,
  browser: ProfileInfo['browser'],
  platform: Platform,
): Promise<ProfileInfo[]> {
  const localState = await readLocalState(chromeDataDir);
  const infoCache = localState?.profile?.info_cache;

  if (!infoCache) {
    // Fallback: assume "Default" profile exists
    return [{
      browser,
      profileName: 'Default',
      profilePath: join(chromeDataDir, 'Default'),
      platform,
    }];
  }

  const version = await getChromeVersion(chromeDataDir);

  return Object.keys(infoCache).map((profileDir) => ({
    browser,
    profileName: infoCache[profileDir].name || infoCache[profileDir].gaia_name || profileDir,
    profilePath: join(chromeDataDir, profileDir),
    browserVersion: version,
    platform,
  }));
}

async function readLocalState(chromeDataDir: string): Promise<LocalState> {
  const content = await readFile(join(chromeDataDir, 'Local State'), 'utf-8');
  return JSON.parse(content) as LocalState;
}
