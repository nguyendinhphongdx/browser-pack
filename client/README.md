# BrowserPack

Pack, encrypt, and sync browser profiles across machines. No re-login needed.

## How it works

1. **Pack** your browser profile (cookies, sessions, extensions, bookmarks) into an encrypted archive
2. **Push** it to the cloud via your BrowserPack account
3. **Pull** it on another machine and restore — all sessions intact

## Install

```bash
npm install -g browserpack
```

Requires Node.js 18+.

## Quick start

```bash
# Login
browserpack login

# See local browser profiles
browserpack profile ls

# Pack and upload a profile
browserpack pack

# On another machine: login and pull
browserpack login
browserpack remote profile ls
browserpack pull --name <backup-name>
```

## CLI Commands

### Auth

| Command | Description |
|---------|-------------|
| `browserpack login` | Login via browser (Google or email) |
| `browserpack login --email` | Login with email/password in terminal |
| `browserpack logout` | Clear saved credentials |
| `browserpack whoami` | Show current logged-in user |

### Local profiles

| Command | Description |
|---------|-------------|
| `browserpack profile ls` | List all local browser profiles |
| `browserpack profile ls --browser chrome` | Filter by browser |
| `browserpack profile rm` | Remove a local profile (interactive) |
| `browserpack pack` | Interactive: pick profile, encrypt, upload |
| `browserpack pack --browser chrome --profile "base.vn"` | Pack specific profile |
| `browserpack pack --local-only -o backup.bpak` | Save locally only |

### Remote backups

| Command | Description |
|---------|-------------|
| `browserpack remote profile ls` | List backups on cloud |
| `browserpack pull --id <id>` | Pull backup by ID |
| `browserpack pull --name <name>` | Pull backup by name |
| `browserpack pull --from-file backup.bpak` | Restore from local file |
| `browserpack remote rm <id>` | Delete a backup from cloud |

### Pack options

```
--browser <type>       chrome, brave, edge, chromium
--profile <name>       Profile name
--preset <preset>      full, sessions-only, bookmarks-only (default: sessions-only)
--include-extensions   Include browser extensions
--include-history      Include browsing history
--include-passwords    Include saved passwords (OS-bound, won't work on other machines)
--password <pass>      Encryption password (prompted if omitted)
--no-encrypt           Skip encryption (not recommended)
--local-only           Save locally without uploading
--name <name>          Custom backup name
```

### Pull behavior

- **First pull**: Creates a new browser profile (visible in Chrome profile switcher)
- **Same backup pulled again**: Updates the previously created profile
- **`--force`**: Overwrites the target profile instead of creating new

## Supported browsers

- Google Chrome
- Brave
- Microsoft Edge
- Chromium

## Supported platforms

- Linux
- macOS
- Windows

## Security

- **AES-256-GCM** encryption with **Argon2id** key derivation
- Password never stored — prompted each time
- Data encrypted **before** leaving your machine
- Saved passwords (Login Data) are OS-keychain bound and will **not** transfer between machines

## License

MIT
