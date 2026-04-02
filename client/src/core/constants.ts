import type { BrowserType, Platform } from './types.js';

export const APP_NAME = 'browserpack';
import { createRequire } from 'node:module';
const __require = createRequire(import.meta.url);
export const APP_VERSION: string = __require('../../../package.json').version;
export const CONFIG_DIR = '.browserpack';
export const CONFIG_FILE = 'config.json';

// Chrome profile data directory paths per OS
export const CHROME_DATA_PATHS: Record<Platform, string> = {
  linux: '.config/google-chrome',
  darwin: 'Library/Application Support/Google/Chrome',
  win32: 'Google/Chrome/User Data',
};

// Browser data directory paths (relative to home or LOCALAPPDATA on Windows)
export const BROWSER_DATA_PATHS: Record<BrowserType, Record<Platform, string>> = {
  chrome: {
    linux: '.config/google-chrome',
    darwin: 'Library/Application Support/Google/Chrome',
    win32: 'Google/Chrome/User Data',
  },
  chromium: {
    linux: '.config/chromium',
    darwin: 'Library/Application Support/Chromium',
    win32: 'Chromium/User Data',
  },
  brave: {
    linux: '.config/BraveSoftware/Brave-Browser',
    darwin: 'Library/Application Support/BraveSoftware/Brave-Browser',
    win32: 'BraveSoftware/Brave-Browser/User Data',
  },
  edge: {
    linux: '.config/microsoft-edge',
    darwin: 'Library/Application Support/Microsoft Edge',
    win32: 'Microsoft/Edge/User Data',
  },
};

// Files always included in "sessions-only" preset
export const SESSION_FILES = [
  'Cookies',
  'Cookies-journal',
  'Login Data',
  'Login Data-journal',
  'Web Data',
  'Web Data-journal',
  'Preferences',
  'Secure Preferences',
];

// Bookmark files
export const BOOKMARK_FILES = [
  'Bookmarks',
  'Bookmarks.bak',
];

// History files
export const HISTORY_FILES = [
  'History',
  'History-journal',
  'Top Sites',
  'Top Sites-journal',
  'Favicons',
  'Favicons-journal',
  'Visited Links',
  'Shortcuts',
  'Shortcuts-journal',
];

// Patterns always excluded (cache, temp, large blobs)
export const ALWAYS_EXCLUDE_PATTERNS = [
  'GPUCache/**',
  'GrShaderCache/**',
  'DawnGraphiteCache/**',
  'DawnWebGPUCache/**',
  'ShaderCache/**',
  'Service Worker/CacheStorage/**',
  'blob_storage/**',
  'BrowserMetrics/**',
  'DeferredBrowserMetrics/**',
  'Safe Browsing*',
  'CRXTelemetry',
  'Code Cache/**',
  'Cache/**',
  'component_crx_cache/**',
  '*.tmp',
  'LOCK',
  'LOG',
  'LOG.old',
  '.com.google.Chrome.*',
  'SingletonLock',
  'SingletonSocket',
  'SingletonCookie',
];

// Extension-related directories
export const EXTENSION_PATTERNS = [
  'Extensions/**',
  'Extension State/**',
  'Extension Cookies',
  'Extension Cookies-journal',
  'Local Extension Settings/**',
  'Sync Extension Settings/**',
  'Extension Rules/**',
  'Extension Scripts/**',
];

// Encryption defaults
export const DEFAULT_KDF_TIME_COST = 3;
export const DEFAULT_KDF_MEMORY_COST = 65536; // 64 MiB in KiB
export const DEFAULT_KDF_PARALLELISM = 4;
export const DEFAULT_KDF_SALT_LENGTH = 32;

// BPAK file format
export const BPAK_MAGIC = Buffer.from('BPAK');
export const BPAK_VERSION = 1;
