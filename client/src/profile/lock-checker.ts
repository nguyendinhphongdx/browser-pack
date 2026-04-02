import { existsSync, readlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import type { ProfileInfo, BrowserType } from '../core/types.js';
import { BrowserRunningError } from '../core/errors.js';

const PROCESS_NAMES: Record<BrowserType, { mac: string; winExe: string }> = {
  chrome:   { mac: 'Google Chrome',   winExe: 'chrome.exe' },
  chromium: { mac: 'Chromium',        winExe: 'chrome.exe' },
  brave:    { mac: 'Brave Browser',   winExe: 'brave.exe' },
  edge:     { mac: 'Microsoft Edge',  winExe: 'msedge.exe' },
};

export async function isBrowserRunning(profile: ProfileInfo): Promise<boolean> {
  const dataDir = dirname(profile.profilePath);

  switch (profile.platform) {
    case 'linux':
      return checkLinuxLock(dataDir);
    case 'darwin':
      return checkMacProcess(profile.browser);
    case 'win32':
      return checkWindowsProcess(profile.browser, dataDir);
    default:
      return false;
  }
}

export async function assertBrowserClosed(profile: ProfileInfo): Promise<void> {
  if (await isBrowserRunning(profile)) {
    throw new BrowserRunningError(profile.browser);
  }
}

function checkLinuxLock(dataDir: string): boolean {
  const lockPath = join(dataDir, 'SingletonLock');
  if (!existsSync(lockPath)) return false;

  try {
    const target = readlinkSync(lockPath);
    const pid = parseInt(target.split('-')[1], 10);
    if (isNaN(pid)) return true;

    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  } catch {
    return existsSync(lockPath);
  }
}

function checkMacProcess(browser: BrowserType): boolean {
  const name = PROCESS_NAMES[browser]?.mac;
  if (!name) return false;

  try {
    const result = execSync(`pgrep -x "${name}"`, { encoding: 'utf-8', stdio: 'pipe' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

function checkWindowsProcess(browser: BrowserType, dataDir: string): boolean {
  const lockFile = join(dataDir, 'lockfile');
  if (!existsSync(lockFile)) return false;

  const exeName = PROCESS_NAMES[browser]?.winExe;
  if (!exeName) return existsSync(lockFile);

  try {
    const result = execSync(`tasklist /FI "IMAGENAME eq ${exeName}" /NH`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return result.includes(exeName);
  } catch {
    return existsSync(lockFile);
  }
}
