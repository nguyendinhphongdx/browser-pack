import { Command } from 'commander';
import { copyFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import ora from 'ora';
import { logger } from '../../../core/logger.js';
import { detectInstalledBrowsers, listProfiles, getProfile } from '../../../profile/detector.js';
import { packProfile } from '../../../packer/packer.js';
import { encryptFile } from '../../../crypto/encryption.js';
import { writeManifest } from '../../../profile/manifest.js';
import { loadAuth } from '../../../auth/store.js';
import { ApiClient } from '../../../api/client.js';
import type { BrowserType, PackPreset, ProfileInfo } from '../../../core/types.js';

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function interactiveSelectProfile(): Promise<ProfileInfo> {
  const browsers = detectInstalledBrowsers();
  if (browsers.length === 0) {
    throw new Error('No supported browsers found.');
  }

  const allProfiles: ProfileInfo[] = [];
  for (const browser of browsers) {
    try {
      const profiles = await listProfiles(browser);
      allProfiles.push(...profiles);
    } catch { /* skip */ }
  }

  if (allProfiles.length === 0) {
    throw new Error('No browser profiles found.');
  }

  console.log('\nAvailable profiles:');
  allProfiles.forEach((p, i) => {
    console.log(`  ${i + 1}. [${p.browser}] ${p.profileName} — ${p.profilePath}`);
  });

  const choice = await ask(`\nSelect profile (1-${allProfiles.length}): `);
  const index = parseInt(choice, 10) - 1;
  if (isNaN(index) || index < 0 || index >= allProfiles.length) {
    throw new Error('Invalid selection.');
  }

  return allProfiles[index];
}

export const packCommand = new Command('pack')
  .description('Pack a browser profile and upload to cloud')
  .option('-b, --browser <type>', 'Browser type (chrome, brave, edge, chromium)')
  .option('-p, --profile <name>', 'Profile name')
  .option('--preset <preset>', 'Pack preset (full, sessions-only, bookmarks-only)', 'sessions-only')
  .option('--include-extensions', 'Include browser extensions', false)
  .option('--include-history', 'Include browsing history', false)
  .option('--include-passwords', 'Include saved passwords (OS-bound)', false)
  .option('--password <password>', 'Encryption password (prompted if omitted)')
  .option('--no-encrypt', 'Skip encryption (not recommended)')
  .option('--local-only', 'Save locally without uploading', false)
  .option('-o, --output <path>', 'Output path for local-only mode')
  .option('--name <name>', 'Custom name for the backup')
  .action(async (opts) => {
    let finalArchivePath: string | undefined;
    try {
      const VALID_BROWSERS = ['chrome', 'chromium', 'brave', 'edge'];

      // Select profile: interactive or from flags
      let profile: ProfileInfo;
      if (opts.browser) {
        if (!VALID_BROWSERS.includes(opts.browser)) {
          logger.error(`Invalid browser: "${opts.browser}". Choose from: ${VALID_BROWSERS.join(', ')}`);
          process.exit(1);
        }
        profile = await getProfile(opts.browser as BrowserType, opts.profile || 'Default');
      } else if (opts.profile) {
        const browsers = detectInstalledBrowsers();
        profile = await getProfile(browsers[0], opts.profile);
      } else {
        profile = await interactiveSelectProfile();
      }

      logger.info(`Profile: [${profile.browser}] ${profile.profileName}`);

      if (opts.includePasswords) {
        logger.warn('Saved passwords are encrypted by OS keychain and will NOT work on other machines.');
      }

      // Pack
      let spinner = ora('Packing profile...').start();
      const result = await packProfile({
        profile,
        preset: opts.preset as PackPreset,
        includeExtensions: opts.includeExtensions,
        includeHistory: opts.includeHistory,
        includePasswords: opts.includePasswords,
      });

      const sizeMB = (result.sizeBytes / 1024 / 1024).toFixed(2);
      spinner.succeed(`Archive: ${sizeMB} MB, ${result.manifest.includedFiles.length} files`);

      // Encryption
      finalArchivePath = result.archivePath;
      const shouldEncrypt = opts.encrypt !== false;

      if (shouldEncrypt) {
        let password = opts.password as string | undefined;
        if (!password) {
          password = await ask('Encryption password: ');
          const confirm = await ask('Confirm password: ');
          if (password !== confirm) {
            logger.error('Passwords do not match.');
            process.exit(1);
          }
        }
        if (password.length < 8) {
          logger.warn('Password shorter than 8 characters.');
        }

        spinner = ora('Encrypting...').start();
        const encryptedPath = result.archivePath + '.bpak';
        await encryptFile(result.archivePath, encryptedPath, password);
        finalArchivePath = encryptedPath;
        await rm(result.archivePath, { force: true });
        spinner.succeed('Encrypted.');
      }

      if (opts.localOnly) {
        // Save locally
        const ext = shouldEncrypt ? '.bpak' : '.tar.gz';
        const outputPath = opts.output
          ? resolve(opts.output)
          : join(process.cwd(), `browserpack-${profile.browser}-${Date.now()}${ext}`);
        await copyFile(finalArchivePath, outputPath);

        const manifestPath = outputPath.replace(ext, '.manifest.json');
        await writeManifest(result.manifest, manifestPath);

        logger.success(`Saved to: ${outputPath}`);
      } else {
        // Upload to server
        const auth = await loadAuth();
        if (!auth) {
          logger.error('Not logged in. Run "browserpack login" or use --local-only.');
          process.exit(1);
        }

        const client = new ApiClient(auth.serverUrl, auth.token);

        // Write manifest to temp file
        const manifestPath = finalArchivePath.replace('.bpak', '.manifest.json').replace('.tar.gz', '.manifest.json');
        await writeManifest(result.manifest, manifestPath);

        const backupName = opts.name || `${profile.browser}-${profile.profileName}-${new Date().toISOString().slice(0, 10)}`;

        spinner = ora('Uploading to cloud...').start();
        const backup = await client.uploadBackup(finalArchivePath, manifestPath, backupName);

        // Cleanup temp files
        await rm(finalArchivePath, { force: true });
        await rm(manifestPath, { force: true });

        spinner.succeed(`Uploaded: ${backup.name} (ID: ${backup.id})`);
      }
    } catch (error) {
      // Cleanup temp files on failure
      if (finalArchivePath) await rm(finalArchivePath, { force: true }).catch(() => {});
      logger.error((error as Error).message);
      process.exit(1);
    }
  });
