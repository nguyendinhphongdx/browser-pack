import { Command } from 'commander';
import Table from 'cli-table3';
import { logger } from '../../../core/logger.js';
import { loadAuth } from '../../../auth/store.js';
import { ApiClient } from '../../../api/client.js';

export const remoteProfileListCommand = new Command('list')
  .description('List profiles backed up on cloud')
  .option('--format <format>', 'Output format (table, json)', 'table')
  .action(async (opts) => {
    try {
      const auth = await loadAuth();
      if (!auth) {
        logger.error('Not logged in. Run "browserpack login" first.');
        process.exit(1);
      }

      const client = new ApiClient(auth.serverUrl, auth.token);
      const backups = await client.listBackups();

      if (backups.length === 0) {
        logger.info('No backups found on cloud.');
        return;
      }

      if (opts.format === 'json') {
        console.log(JSON.stringify(backups, null, 2));
        return;
      }

      const table = new Table({
        head: ['ID', 'Name', 'Browser', 'Profile', 'Platform', 'Size', 'Date'],
        style: { head: ['cyan'] },
      });

      for (const b of backups) {
        table.push([
          b.id.slice(0, 10),
          b.name,
          b.browser,
          b.profileName,
          b.platform,
          (b.size / 1024 / 1024).toFixed(2) + ' MB',
          new Date(b.createdAt).toLocaleDateString(),
        ]);
      }

      console.log(table.toString());
      logger.info(`Total: ${backups.length} backup(s)`);
    } catch (error) {
      logger.error((error as Error).message);
      process.exit(1);
    }
  });
