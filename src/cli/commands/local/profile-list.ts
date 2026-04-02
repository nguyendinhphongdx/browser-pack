import { Command } from 'commander';
import Table from 'cli-table3';
import { detectInstalledBrowsers, listProfiles } from '../../../profile/detector.js';
import { isBrowserRunning } from '../../../profile/lock-checker.js';
import { logger } from '../../../core/logger.js';
import type { BrowserType } from '../../../core/types.js';

export const profileListCommand = new Command('list')
  .description('List local browser profiles')
  .option('-b, --browser <type>', 'Filter by browser (chrome, brave, edge, chromium)')
  .action(async (opts) => {
    try {
      let browsers: BrowserType[];
      if (opts.browser) {
        browsers = [opts.browser as BrowserType];
      } else {
        browsers = detectInstalledBrowsers();
      }

      if (browsers.length === 0) {
        logger.info('No supported browsers found.');
        return;
      }

      const table = new Table({
        head: ['Browser', 'Profile', 'Path', 'Status'],
        style: { head: ['cyan'] },
      });

      for (const browser of browsers) {
        try {
          const profiles = await listProfiles(browser);
          for (const profile of profiles) {
            const running = await isBrowserRunning(profile);
            table.push([
              browser,
              profile.profileName,
              profile.profilePath,
              running ? 'Running' : 'Ready',
            ]);
          }
        } catch {
          // Browser detected but can't list profiles (no Local State file)
          table.push([browser, '-', '-', 'No profiles']);
        }
      }

      console.log(table.toString());
    } catch (error) {
      logger.error((error as Error).message);
      process.exit(1);
    }
  });
