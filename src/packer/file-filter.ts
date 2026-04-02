import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { PackPreset } from '../core/types.js';
import {
  SESSION_FILES,
  BOOKMARK_FILES,
  HISTORY_FILES,
  ALWAYS_EXCLUDE_PATTERNS,
  EXTENSION_PATTERNS,
} from '../core/constants.js';

export interface FileFilterConfig {
  preset: PackPreset;
  includeExtensions: boolean;
  includeHistory: boolean;
  includePasswords: boolean;
  customInclude?: string[];
  customExclude?: string[];
}

export function getIncludePatterns(config: FileFilterConfig): string[] | null {
  switch (config.preset) {
    case 'sessions-only': {
      const files = [...SESSION_FILES];
      if (!config.includePasswords) {
        // Remove Login Data files
        const filtered = files.filter((f) => !f.startsWith('Login Data'));
        return filtered;
      }
      return files;
    }
    case 'bookmarks-only':
      return [...BOOKMARK_FILES];
    case 'full':
      return null; // Include everything (except excludes)
    case 'custom':
      return config.customInclude ?? null;
    default:
      return null;
  }
}

export function getExcludePatterns(config: FileFilterConfig): string[] {
  const excludes = [...ALWAYS_EXCLUDE_PATTERNS];

  if (!config.includeExtensions && config.preset !== 'sessions-only' && config.preset !== 'bookmarks-only') {
    excludes.push(...EXTENSION_PATTERNS);
  }

  if (!config.includeHistory && config.preset === 'full') {
    excludes.push(...HISTORY_FILES);
  }

  if (!config.includePasswords && config.preset === 'full') {
    excludes.push('Login Data', 'Login Data-journal');
  }

  if (config.customExclude) {
    excludes.push(...config.customExclude);
  }

  return excludes;
}

function matchesAnyPattern(filePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    // Simple glob matching without external dependency
    if (pattern.endsWith('/**')) {
      const dir = pattern.slice(0, -3);
      return filePath.startsWith(dir + '/') || filePath === dir;
    }
    if (pattern.includes('*')) {
      const regex = new RegExp(
        '^' + pattern.replace(/\./g, '\\.').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$',
      );
      return regex.test(filePath);
    }
    return filePath === pattern || filePath.startsWith(pattern + '/');
  });
}

export async function buildFileList(
  profilePath: string,
  config: FileFilterConfig,
): Promise<string[]> {
  const includePatterns = getIncludePatterns(config);
  const excludePatterns = getExcludePatterns(config);
  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(profilePath, fullPath);

      // Check exclude first
      if (matchesAnyPattern(relativePath, excludePatterns)) {
        continue;
      }

      if (entry.isDirectory()) {
        // If we have include patterns and this dir doesn't match any prefix, skip
        if (includePatterns !== null) {
          const dirCouldMatch = includePatterns.some((p) =>
            relativePath.startsWith(p) || p.startsWith(relativePath) || matchesAnyPattern(relativePath, [p]),
          );
          if (!dirCouldMatch) continue;
        }
        await walk(fullPath);
      } else if (entry.isFile()) {
        if (includePatterns !== null) {
          if (!matchesAnyPattern(relativePath, includePatterns)) {
            continue;
          }
        }
        files.push(relativePath);
      }
    }
  }

  await walk(profilePath);
  return files.sort();
}
