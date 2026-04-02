// === Browser & Profile ===

export type BrowserType = 'chrome' | 'chromium' | 'brave' | 'edge';
export type Platform = 'linux' | 'darwin' | 'win32';
export type PackPreset = 'full' | 'sessions-only' | 'bookmarks-only' | 'custom';

export interface ProfileInfo {
  browser: BrowserType;
  profileName: string;
  profilePath: string;
  browserVersion?: string;
  platform: Platform;
}

export interface PackManifest {
  version: 1;
  browserpack: string;
  browser: BrowserType;
  browserVersion?: string;
  profileName: string;
  platform: Platform;
  createdAt: string;
  hostname: string;
  includedFiles: string[];
  checksum: string;
  encryption: {
    algorithm: 'aes-256-gcm';
    kdf: 'argon2id';
    kdfParams: {
      timeCost: number;
      memoryCost: number;
      parallelism: number;
      saltLength: number;
    };
  };
}

// === Packer ===

export interface PackOptions {
  profile: ProfileInfo;
  preset: PackPreset;
  includeExtensions: boolean;
  includeHistory: boolean;
  includePasswords: boolean;
  customInclude?: string[];
  customExclude?: string[];
}

export interface PackResult {
  archivePath: string;
  manifest: PackManifest;
  sizeBytes: number;
}

// === Storage ===

export type ProgressCallback = (transferred: number, total: number) => void;

export interface StorageEntry {
  name: string;
  sizeBytes: number;
  uploadedAt: string;
  metadata?: Record<string, string>;
}

export interface StorageBackend {
  readonly name: string;
  upload(localPath: string, remoteName: string, onProgress?: ProgressCallback): Promise<StorageEntry>;
  download(remoteName: string, localPath: string, onProgress?: ProgressCallback): Promise<void>;
  list(): Promise<StorageEntry[]>;
  delete(remoteName: string): Promise<void>;
  validate(): Promise<void>;
}

// === Config ===

export interface S3Config {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix?: string;
}

export interface GDriveConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId?: string;
}

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  privateKeyPath?: string;
  remotePath: string;
}

export interface BrowserPackConfig {
  defaultBrowser?: BrowserType;
  defaultProfile?: string;
  defaultPreset?: PackPreset;
  storage: {
    backend: 's3' | 'gdrive' | 'ssh';
    s3?: S3Config;
    gdrive?: GDriveConfig;
    ssh?: SSHConfig;
  };
  encryption?: {
    kdfTimeCost: number;
    kdfMemoryCost: number;
  };
}
