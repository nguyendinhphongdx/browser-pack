import { existsSync } from 'node:fs';
import { readFile, writeFile, rm } from 'node:fs/promises';
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

async function readFullLocalState(chromeDataDir: string): Promise<Record<string, unknown>> {
  const content = await readFile(join(chromeDataDir, 'Local State'), 'utf-8');
  return JSON.parse(content);
}

async function writeLocalState(chromeDataDir: string, state: Record<string, unknown>): Promise<void> {
  await writeFile(join(chromeDataDir, 'Local State'), JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Create a new profile entry in Chrome's Local State.
 * Returns the ProfileInfo for the newly created profile slot.
 * Does NOT create the directory — caller should extract archive into profilePath.
 */
export async function createNewProfile(
  chromeDataDir: string,
  profileName: string,
  browser: ProfileInfo['browser'],
  platform: Platform,
): Promise<ProfileInfo> {
  const state = await readFullLocalState(chromeDataDir);

  // Ensure profile.info_cache exists
  if (!state.profile || typeof state.profile !== 'object') {
    state.profile = {};
  }
  const profile = state.profile as Record<string, unknown>;
  if (!profile.info_cache || typeof profile.info_cache !== 'object') {
    profile.info_cache = {};
  }
  const infoCache = profile.info_cache as Record<string, Record<string, unknown>>;

  // Find next available "Profile N" directory
  let n = 1;
  while (existsSync(join(chromeDataDir, `Profile ${n}`)) || infoCache[`Profile ${n}`]) {
    n++;
  }
  const profileDir = `Profile ${n}`;

  // Add entry to info_cache with minimum fields Chrome requires
  infoCache[profileDir] = {
    active_time: Date.now() / 1000,
    avatar_icon: 'chrome://theme/IDR_PROFILE_AVATAR_26',
    background_apps: false,
    default_avatar_fill_color: -1842205,
    default_avatar_stroke_color: -10197916,
    force_signin_profile_locked: false,
    is_consented_primary_account: false,
    is_ephemeral: false,
    is_using_default_avatar: true,
    is_using_default_name: false,
    name: profileName,
    user_name: '',
  };

  // Write updated Local State
  await writeLocalState(chromeDataDir, state);

  const version = await getChromeVersion(chromeDataDir);

  return {
    browser,
    profileName,
    profilePath: join(chromeDataDir, profileDir),
    browserVersion: version,
    platform,
  };
}

/**
 * Remove a profile: delete its directory and remove entry from Local State.
 */
export async function removeProfile(
  chromeDataDir: string,
  profileDir: string,
): Promise<void> {
  const profilePath = join(chromeDataDir, profileDir);

  // Remove from Local State
  const state = await readFullLocalState(chromeDataDir);
  const profile = state.profile as Record<string, unknown> | undefined;
  if (profile) {
    const infoCache = profile.info_cache as Record<string, unknown> | undefined;
    if (infoCache && infoCache[profileDir]) {
      delete infoCache[profileDir];
      await writeLocalState(chromeDataDir, state);
    }
  }

  // Delete profile directory
  if (existsSync(profilePath)) {
    await rm(profilePath, { recursive: true, force: true });
  }
}
