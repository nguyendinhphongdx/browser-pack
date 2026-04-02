import { Command } from 'commander';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createInterface } from 'node:readline';
import ora from 'ora';
import { logger } from '../../../core/logger.js';
import { detectInstalledBrowsers, getProfile } from '../../../profile/detector.js';
import { unpackProfile } from '../../../packer/unpacker.js';
import { decryptFile } from '../../../crypto/encryption.js';
import { loadAuth } from '../../../auth/store.js';
import { ApiClient } from '../../../api/client.js';
import type { BrowserType } from '../../../core/types.js';

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export const pullCommand = new Command('pull')
  .description('Download and restore a browser profile from cloud')
  .option('--id <id>', 'Backup ID to pull')
  .option('--name <name>', 'Backup name to pull')
  .option('-b, --browser <type>', 'Target browser type')
  .option('-p, --profile <name>', 'Target profile name', 'Default')
  .option('--password <password>', 'Decryption password (prompted if omitted)')
  .option('--force', 'Overwrite existing profile instead of creating new', false)
  .option('--skip-version-check', 'Skip version mismatch warning', false)
  .option('--from-file <path>', 'Restore from local .bpak file instead of cloud')
  .action(async (opts) => {
    let tmpDir: string | undefined;
    try {
      let bpakPath: string;
      let manifestPath: string;
      let backupId: string;
      let backupName: string;

      if (opts.fromFile) {
        bpakPath = resolve(opts.fromFile);
        const ext = bpakPath.endsWith('.bpak') ? '.bpak' : '.tar.gz';
        manifestPath = bpakPath.replace(ext, '.manifest.json');
        backupId = 'local';
        backupName = 'local';
      } else {
        // Download from cloud
        const auth = await loadAuth();
        if (!auth) {
          logger.error('Not logged in. Run "browserpack login" first.');
          process.exit(1);
        }

        const client = new ApiClient(auth.serverUrl, auth.token);

        // Resolve backup ID from --id or --name
        if (opts.id) {
          backupId = opts.id;
          backupName = opts.id;
        } else if (opts.name) {
          // Find backup by name
          const backups = await client.listBackups();
          const match = backups.find((b) => b.name === opts.name);
          if (!match) {
            logger.error(`Backup "${opts.name}" not found. Run "browserpack remote profile ls" to see available backups.`);
            process.exit(1);
          }
          backupId = match.id;
          backupName = match.name;
        } else {
          logger.error('Specify --id or --name. Run "browserpack remote profile ls" to see available backups.');
          process.exit(1);
        }

        tmpDir = await mkdtemp(join(tmpdir(), 'browserpack-pull-'));
        bpakPath = join(tmpDir, `${backupId}.bpak`);
        manifestPath = join(tmpDir, `${backupId}.manifest.json`);

        const dlSpinner = ora('Downloading from cloud...').start();
        await client.downloadBackup(backupId, bpakPath, (transferred, total) => {
          const pct = Math.round((transferred / total) * 100);
          dlSpinner.text = `Downloading... ${pct}%`;
        });

        await client.downloadManifest(backupId, manifestPath);
        dlSpinner.succeed('Download complete.');
      }

      // Decrypt if .bpak
      let archivePath: string;
      if (bpakPath.endsWith('.bpak')) {
        const decDir = tmpDir ?? await mkdtemp(join(tmpdir(), 'browserpack-dec-'));
        if (!tmpDir) tmpDir = decDir;
        archivePath = join(decDir, 'profile.tar.gz');

        let password = opts.password as string | undefined;
        const maxRetries = password ? 1 : 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          if (!password) {
            password = await ask('Decryption password: ');
          }
          const decSpinner = ora('Decrypting...').start();
          try {
            await decryptFile(bpakPath, archivePath, password);
            decSpinner.succeed('Decrypted.');
            break;
          } catch {
            decSpinner.fail('Wrong password.');
            if (attempt === maxRetries) {
              throw new Error('Decryption failed after maximum retries.');
            }
            password = undefined; // Reset to prompt again
          }
        }
      } else {
        archivePath = bpakPath;
      }

      // Determine target browser
      let browser: BrowserType;
      if (opts.browser) {
        browser = opts.browser as BrowserType;
      } else {
        const installed = detectInstalledBrowsers();
        if (installed.length === 0) {
          logger.error('No supported browsers found.');
          process.exit(1);
        }
        browser = installed[0];
        logger.info(`Auto-detected browser: ${browser}`);
      }

      const targetProfile = await getProfile(browser, opts.profile);

      const restored = await unpackProfile({
        archivePath,
        manifestPath,
        targetProfile,
        backupId,
        backupName,
        force: opts.force,
        skipVersionCheck: opts.skipVersionCheck,
      });

      logger.success('Profile restored successfully!');
      logger.info(`Open ${browser} and switch to "${restored.profileName}" to use it.`);
    } catch (error) {
      logger.error((error as Error).message);
      process.exit(1);
    } finally {
      if (tmpDir) {
        await rm(tmpDir, { recursive: true, force: true });
      }
    }
  });
