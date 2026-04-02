import { Command } from 'commander';
import { logger } from '../../../core/logger.js';
import { clearAuth, loadAuth } from '../../../auth/store.js';

export const logoutCommand = new Command('logout')
  .description('Logout from BrowserPack')
  .action(async () => {
    const auth = await loadAuth();
    if (!auth) {
      logger.info('Not logged in.');
      return;
    }
    await clearAuth();
    logger.success(`Logged out (was ${auth.email}).`);
  });
