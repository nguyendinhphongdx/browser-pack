import { existsSync } from 'node:fs';
import { chmod, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CONFIG_DIR } from '../core/constants.js';

const AUTH_FILE = 'auth.json';

export interface AuthData {
  token: string;
  serverUrl: string;
  email: string;
  name: string;
}

function getAuthPath(): string {
  return join(homedir(), CONFIG_DIR, AUTH_FILE);
}

export async function loadAuth(): Promise<AuthData | null> {
  const authPath = getAuthPath();
  if (!existsSync(authPath)) return null;

  try {
    const raw = await readFile(authPath, 'utf-8');
    return JSON.parse(raw) as AuthData;
  } catch {
    return null;
  }
}

export async function saveAuth(data: AuthData): Promise<void> {
  const dir = join(homedir(), CONFIG_DIR);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const authPath = getAuthPath();
  await writeFile(authPath, JSON.stringify(data, null, 2), 'utf-8');
  // Owner read/write only — prevent other users from reading the token
  if (process.platform !== 'win32') {
    await chmod(authPath, 0o600);
  }
}

export async function clearAuth(): Promise<void> {
  const authPath = getAuthPath();
  if (existsSync(authPath)) {
    await rm(authPath);
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const auth = await loadAuth();
  return auth !== null;
}
