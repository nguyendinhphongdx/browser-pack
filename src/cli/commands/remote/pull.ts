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
  .argument('<id>', 'Backup ID to pull')
  .option('-b, --browser <type>', 'Target browser type')
  .option('-p, --profile <name>', 'Target profile name', 'Default')
  .option('--password <password>', 'Decryption password (prompted if omitted)')
  .option('--force', 'Overwrite existing profile', false)
  .option('--skip-version-check', 'Skip version mismatch warning', false)
  .option('--from-file <path>', 'Restore from local .bpak file instead of cloud')
  .action(async (id: string, opts) => {
    let tmpDir: string | undefined;
    try {
      let bpakPath: string;
      let manifestPath: string;

      if (opts.fromFile) {
        bpakPath = resolve(opts.fromFile);
        const ext = bpakPath.endsWith('.bpak') ? '.bpak' : '.tar.gz';
        manifestPath = bpakPath.replace(ext, '.manifest.json');
      } else {
        // Download from cloud
        const auth = await loadAuth();
        if (!auth) {
          logger.error('Not logged in. Run "browserpack login" first.');
          process.exit(1);
        }

        const client = new ApiClient(auth.serverUrl, auth.token);
        tmpDir = await mkdtemp(join(tmpdir(), 'browserpack-pull-'));
        bpakPath = join(tmpDir, `${id}.bpak`);
        manifestPath = join(tmpDir, `${id}.manifest.json`);

        const dlSpinner = ora('Downloading from cloud...').start();
        await client.downloadBackup(id, bpakPath, (transferred, total) => {
          const pct = Math.round((transferred / total) * 100);
          dlSpinner.text = `Downloading... ${pct}%`;
        });

        await client.downloadManifest(id, manifestPath);
        dlSpinner.succeed('Download complete.');
      }

      // Decrypt if .bpak
      let archivePath: string;
      if (bpakPath.endsWith('.bpak')) {
        let password = opts.password as string | undefined;
        if (!password) {
          password = await ask('Decryption password: ');
        }

        const decSpinner = ora('Decrypting...').start();
        const decDir = tmpDir ?? await mkdtemp(join(tmpdir(), 'browserpack-dec-'));
        if (!tmpDir) tmpDir = decDir;
        archivePath = join(decDir, 'profile.tar.gz');
        await decryptFile(bpakPath, archivePath, password);
        decSpinner.succeed('Decrypted.');
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
      logger.info(`Target: [${browser}] ${targetProfile.profileName}`);

      await unpackProfile({
        archivePath,
        manifestPath,
        targetProfile,
        force: opts.force,
        skipVersionCheck: opts.skipVersionCheck,
      });

      logger.success('Profile restored successfully!');
      logger.info(`Open ${browser} to use the restored profile.`);
    } catch (error) {
      logger.error((error as Error).message);
      process.exit(1);
    } finally {
      if (tmpDir) {
        await rm(tmpDir, { recursive: true, force: true });
      }
    }
  });
