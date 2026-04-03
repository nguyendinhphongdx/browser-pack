import { Command } from 'commander';
import { logger } from '../../../core/logger.js';
import { loadAuth } from '../../../auth/store.js';
import { ApiClient } from '../../../api/client.js';

export const whoamiCommand = new Command('whoami')
  .description('Show current logged-in user')
  .action(async () => {
    const auth = await loadAuth();
    if (!auth) {
      logger.info('Not logged in. Run "bpacker login" first.');
      return;
    }

    try {
      const client = new ApiClient(auth.serverUrl, auth.token);
      const user = await client.me();
      console.log(`Email:  ${user.email}`);
      console.log(`Name:   ${user.name || '(not set)'}`);
      console.log(`Server: ${auth.serverUrl}`);
    } catch {
      // Fallback to cached info if server unreachable
      console.log(`Email:  ${auth.email}`);
      console.log(`Name:   ${auth.name || '(not set)'}`);
      console.log(`Server: ${auth.serverUrl}`);
      logger.warn('Could not reach server. Showing cached info.');
    }
  });
