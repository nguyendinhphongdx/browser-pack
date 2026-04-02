export class BrowserPackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrowserPackError';
  }
}

export class BrowserRunningError extends BrowserPackError {
  constructor(browser: string) {
    super(`${browser} is currently running. Please close it before packing.`);
    this.name = 'BrowserRunningError';
  }
}

export class ProfileNotFoundError extends BrowserPackError {
  constructor(path: string) {
    super(`Browser profile not found at: ${path}`);
    this.name = 'ProfileNotFoundError';
  }
}

export class DecryptionError extends BrowserPackError {
  constructor() {
    super('Decryption failed. Wrong password or corrupted file.');
    this.name = 'DecryptionError';
  }
}

export class ManifestError extends BrowserPackError {
  constructor(message: string) {
    super(`Invalid manifest: ${message}`);
    this.name = 'ManifestError';
  }
}

export class StorageError extends BrowserPackError {
  constructor(backend: string, message: string) {
    super(`Storage error (${backend}): ${message}`);
    this.name = 'StorageError';
  }
}
