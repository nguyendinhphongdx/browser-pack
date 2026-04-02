import { Command } from 'commander';
import { execSync } from 'node:child_process';
import { logger } from '../../../core/logger.js';
import { APP_VERSION } from '../../../core/constants.js';

export const upgradeCommand = new Command('upgrade')
  .description('Upgrade BrowserPack to the latest version')
  .action(() => {
    try {
      logger.info(`Current version: ${APP_VERSION}`);
      logger.info('Checking for updates...');

      const latest = execSync('npm view @phongnd-base/browserpack version', {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();

      if (latest === APP_VERSION) {
        logger.success('Already on the latest version.');
        return;
      }

      logger.info(`New version available: ${latest}`);
      logger.info('Upgrading...');

      execSync('npm install -g @phongnd-base/browserpack@latest', {
        stdio: 'inherit',
      });

      logger.success(`Upgraded to ${latest}`);
    } catch (error) {
      logger.error((error as Error).message);
      process.exit(1);
    }
  });
