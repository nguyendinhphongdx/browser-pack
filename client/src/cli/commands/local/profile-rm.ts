import { Command } from 'commander';
import { basename, dirname } from 'node:path';
import { createInterface } from 'node:readline';
import { logger } from '../../../core/logger.js';
import { detectInstalledBrowsers, listProfiles } from '../../../profile/detector.js';
import { isBrowserRunning } from '../../../profile/lock-checker.js';
import { removeProfile } from '../../../profile/chrome.js';
import type { BrowserType, ProfileInfo } from '../../../core/types.js';

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export const profileRmCommand = new Command('rm')
  .description('Remove a local browser profile')
  .option('-b, --browser <type>', 'Browser type')
  .option('--force', 'Skip confirmation', false)
  .action(async (opts) => {
    try {
      // List all profiles for selection
      let browsers: BrowserType[];
      if (opts.browser) {
        browsers = [opts.browser as BrowserType];
      } else {
        browsers = detectInstalledBrowsers();
      }

      const allProfiles: ProfileInfo[] = [];
      for (const browser of browsers) {
        try {
          const profiles = await listProfiles(browser);
          allProfiles.push(...profiles);
        } catch { /* skip */ }
      }

      if (allProfiles.length === 0) {
        logger.info('No profiles found.');
        return;
      }

      console.log('\nAvailable profiles:');
      allProfiles.forEach((p, i) => {
        console.log(`  ${i + 1}. [${p.browser}] ${p.profileName} — ${p.profilePath}`);
      });

      const choice = await ask(`\nSelect profile to remove (1-${allProfiles.length}): `);
      const index = parseInt(choice, 10) - 1;
      if (isNaN(index) || index < 0 || index >= allProfiles.length) {
        logger.error('Invalid selection.');
        process.exit(1);
      }

      const selected = allProfiles[index];

      // Prevent removing "Default" profile
      if (basename(selected.profilePath) === 'Default') {
        logger.error('Cannot remove the Default profile.');
        process.exit(1);
      }

      // Check browser not running
      const running = await isBrowserRunning(selected);
      if (running) {
        logger.error(`${selected.browser} is running. Close it first.`);
        process.exit(1);
      }

      // Confirm
      if (!opts.force) {
        const confirm = await ask(`Delete [${selected.browser}] "${selected.profileName}"? This cannot be undone. (y/N): `);
        if (confirm.toLowerCase() !== 'y') {
          logger.info('Cancelled.');
          return;
        }
      }

      const chromeDataDir = dirname(selected.profilePath);
      const profileDir = basename(selected.profilePath);

      await removeProfile(chromeDataDir, profileDir);
      logger.success(`Removed: [${selected.browser}] ${selected.profileName}`);
    } catch (error) {
      logger.error((error as Error).message);
      process.exit(1);
    }
  });
