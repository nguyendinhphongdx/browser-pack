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
# Login with Google
browserpack login

# See local browser profiles
browserpack profile list

# Pack and upload a profile
browserpack pack

# On another machine: login and pull
browserpack login
browserpack remote profile list
browserpack pull <backup-id>
```

## CLI Commands

### Auth

| Command | Description |
|---------|-------------|
| `browserpack login` | Login with Google (opens browser) |
| `browserpack logout` | Clear saved credentials |
| `browserpack whoami` | Show current logged-in user |

### Local

| Command | Description |
|---------|-------------|
| `browserpack profile list` | List all local browser profiles |
| `browserpack profile list --browser chrome` | Filter by browser |
| `browserpack pack` | Interactive: pick profile, encrypt, upload |
| `browserpack pack --browser chrome --profile Default` | Pack specific profile |
| `browserpack pack --local-only -o backup.bpak` | Save locally only |

### Remote

| Command | Description |
|---------|-------------|
| `browserpack remote profile list` | List backups on cloud |
| `browserpack pull <id>` | Download, decrypt, restore a backup |
| `browserpack pull <id> --from-file backup.bpak` | Restore from local file |
| `browserpack remote delete <id>` | Delete a backup from cloud |

### Pack options

```
--browser <type>       chrome, brave, edge, chromium
--profile <name>       Profile name (default: "Default")
--preset <preset>      full, sessions-only, bookmarks-only (default: sessions-only)
--include-extensions   Include browser extensions
--include-history      Include browsing history
--include-passwords    Include saved passwords (OS-bound, won't work on other machines)
--password <pass>      Encryption password (prompted if omitted)
--no-encrypt           Skip encryption (not recommended)
--local-only           Save locally without uploading
--name <name>          Custom backup name
```

## Supported browsers

- Google Chrome
- Brave
- Microsoft Edge
- Chromium

All Chromium-based browsers share the same profile format.

## Supported platforms

- Linux
- macOS
- Windows

## Security

- **AES-256-GCM** encryption with **Argon2id** key derivation
- Password never stored — prompted each time
- Data encrypted **before** leaving your machine
- Saved passwords (Login Data) are OS-keychain bound and will **not** transfer between machines

## Architecture

```
CLI (your machine)              Server (Vercel)
──────────────────              ────────────────
browserpack login  ──OAuth──►   Google OAuth → JWT
browserpack pack   ──upload──►  API → GCS bucket
browserpack pull   ◄──download── API → GCS bucket
```

- **CLI**: TypeScript/Node.js
- **Server**: Next.js (App Router) on Vercel
- **Database**: PostgreSQL (Supabase)
- **Storage**: Google Cloud Storage
- **Auth**: Google OAuth 2.0

## Development

```bash
# CLI
npm install
npm run dev -- profile list
npm test

# Server
cd server
npm install
cp .env.example .env  # fill in your values
npm run dev
```

## License

MIT
