import { Command } from 'commander';
import { APP_VERSION } from '../core/constants.js';

// Local commands
import { loginCommand } from './commands/local/login.js';
import { logoutCommand } from './commands/local/logout.js';
import { whoamiCommand } from './commands/local/whoami.js';
import { profileListCommand } from './commands/local/profile-list.js';
import { profileRmCommand } from './commands/local/profile-rm.js';
import { packCommand } from './commands/local/pack.js';
import { upgradeCommand } from './commands/local/upgrade.js';
import { purgeCommand } from './commands/local/purge.js';

// Remote commands
import { remoteProfileListCommand } from './commands/remote/profile-list.js';
import { pullCommand } from './commands/remote/pull.js';
import { remoteDeleteCommand } from './commands/remote/delete.js';

export function createProgram(): Command {
  const program = new Command('browserpack')
    .version(APP_VERSION)
    .description('Pack, encrypt, and sync browser profiles across machines');

  // Auth commands (top-level)
  program.addCommand(loginCommand);
  program.addCommand(logoutCommand);
  program.addCommand(whoamiCommand);

  // Local profile commands
  const profileCmd = new Command('profile')
    .description('Manage local browser profiles');
  profileCmd.addCommand(profileListCommand);
  profileCmd.addCommand(profileRmCommand);
  program.addCommand(profileCmd);

  // Pack (top-level)
  program.addCommand(packCommand);
  program.addCommand(upgradeCommand);
  program.addCommand(purgeCommand);

  // Pull (top-level)
  program.addCommand(pullCommand);

  // Remote commands
  const remoteCmd = new Command('remote')
    .description('Manage cloud backups');

  const remoteProfileCmd = new Command('profile')
    .description('Manage remote profiles');
  remoteProfileCmd.addCommand(remoteProfileListCommand);
  remoteCmd.addCommand(remoteProfileCmd);

  remoteCmd.addCommand(remoteDeleteCommand);
  program.addCommand(remoteCmd);

  return program;
}
