import { Command } from 'commander';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { logger } from '../../../core/logger.js';
import { CONFIG_DIR } from '../../../core/constants.js';

function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

export const purgeCommand = new Command('purge')
  .description('Remove all BrowserPack config and data (~/.bpacker)')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (opts) => {
    const configPath = join(homedir(), CONFIG_DIR);

    if (!existsSync(configPath)) {
      logger.info('Nothing to purge — config directory does not exist.');
      return;
    }

    if (!opts.yes) {
      logger.warn(`This will delete: ${configPath}`);
      const ok = await confirm('Are you sure?');
      if (!ok) {
        logger.info('Aborted.');
        return;
      }
    }

    await rm(configPath, { recursive: true, force: true });
    logger.success('BrowserPack data purged.');
    logger.info('Run `npm uninstall -g @hanoilab/bpacker` to fully uninstall.');
  });
