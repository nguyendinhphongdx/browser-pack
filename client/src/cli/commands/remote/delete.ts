import { Command } from 'commander';
import { createInterface } from 'node:readline';
import { logger } from '../../../core/logger.js';
import { loadAuth } from '../../../auth/store.js';
import { ApiClient } from '../../../api/client.js';

export const remoteDeleteCommand = new Command('rm')
  .description('Delete a backup from cloud')
  .argument('<id>', 'Backup ID to delete')
  .option('--force', 'Skip confirmation', false)
  .action(async (id: string, opts) => {
    try {
      const auth = await loadAuth();
      if (!auth) {
        logger.error('Not logged in. Run "bpacker login" first.');
        process.exit(1);
      }

      if (!opts.force) {
        const rl = createInterface({ input: process.stdin, output: process.stderr });
        const answer = await new Promise<string>((resolve) => {
          rl.question(`Delete backup "${id}" from cloud? (y/N): `, resolve);
          rl.once('close', () => resolve('n'));
        });
        rl.close();

        if (answer.toLowerCase() !== 'y') {
          logger.info('Cancelled.');
          return;
        }
      }

      const client = new ApiClient(auth.serverUrl, auth.token);
      await client.deleteBackup(id);
      logger.success(`Deleted: ${id}`);
    } catch (error) {
      logger.error((error as Error).message);
      process.exit(1);
    }
  });
