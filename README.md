# BrowserPack

Pack, encrypt, and sync browser profiles across machines. No re-login needed.

## How it works

1. **Pack** your browser profile (cookies, sessions, extensions, bookmarks) into an encrypted archive
2. **Push** it to the cloud via your BrowserPack account
3. **Pull** it on another machine and restore — all sessions intact

## Install

```bash
npm install -g bpacker
```

Requires Node.js 18+.

## Quick start

```bash
# Login
bpacker login

# See local browser profiles
bpacker profile ls

# Pack and upload a profile
bpacker pack

# On another machine: login and pull
bpacker login
bpacker remote profile ls
bpacker pull --name <backup-name>
```

## CLI Commands

### Auth

| Command | Description |
|---------|-------------|
| `bpacker login` | Login via browser (Google or email) |
| `bpacker login --email` | Login with email/password in terminal |
| `bpacker logout` | Clear saved credentials |
| `bpacker whoami` | Show current logged-in user |

### Local profiles

| Command | Description |
|---------|-------------|
| `bpacker profile ls` | List all local browser profiles |
| `bpacker profile ls --browser chrome` | Filter by browser |
| `bpacker profile rm` | Remove a local profile (interactive) |
| `bpacker pack` | Interactive: pick profile, encrypt, upload |
| `bpacker pack --browser chrome --profile "base.vn"` | Pack specific profile |
| `bpacker pack --local-only -o backup.bpak` | Save locally only |

### Remote backups

| Command | Description |
|---------|-------------|
| `bpacker remote profile ls` | List backups on cloud |
| `bpacker pull --id <id>` | Pull backup by ID |
| `bpacker pull --name <name>` | Pull backup by name |
| `bpacker pull --from-file backup.bpak` | Restore from local file |
| `bpacker remote rm <id>` | Delete a backup from cloud |

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
bpacker login  ──OAuth──►   Google OAuth → JWT
bpacker pack   ──upload──►  API → GCS bucket
bpacker pull   ◄──download── API → GCS bucket
```

- **CLI**: TypeScript/Node.js (npm package)
- **Server**: Next.js (App Router) on Vercel
- **Database**: PostgreSQL (Supabase)
- **Storage**: Google Cloud Storage
- **Auth**: Google OAuth 2.0 + Email/Password

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL (Supabase free tier works)
- Google Cloud Console project (for OAuth + GCS)

### Server

```bash
cd server
npm install
cp .env.example .env          # fill in your values
npx prisma migrate dev        # create database tables
npm run dev                   # http://localhost:3000
```

### CLI

```bash
cd client
npm install

# Run directly from source (no build needed)
npx tsx bin/bpacker.ts --help
npx tsx bin/bpacker.ts profile ls
npx tsx bin/bpacker.ts login --server http://localhost:3000

# Or link globally for "bpacker" command
npm run build
npm link                      # creates global "bpacker" symlink
bpacker --help
bpacker login --server http://localhost:3000

# After code changes, rebuild
npm run build                 # npm link only needs to run once

# Remove global link
npm unlink -g

# Run tests
npm test
```

### Environment variables

Set `BROWSERPACK_SERVER` to avoid passing `--server` every time:

```bash
export BROWSERPACK_SERVER=http://localhost:3000
bpacker login
```

## Release & Publish

### 1. Setup (one-time)

1. Create npm token: [npmjs.com](https://www.npmjs.com) → Avatar → Access Tokens → Generate New Token (Automation)
2. Add to GitHub: Repo → Settings → Secrets → Actions → New secret → Name: `NPM_TOKEN`

### 2. Publish a new version

```bash
# Update version in client/package.json
cd client
npm version patch   # or minor, major

# Push code + tag
git add -A
git commit -m "v0.1.1"
git push origin main
git push origin --tags
```

Then go to GitHub → Releases → Create release from the tag → Publish.

CI will automatically:
1. Run tests on Linux/macOS/Windows
2. Build the CLI
3. Publish to npm

### Manual publish (without CI)

```bash
cd client
npm run build
npm publish --access public
```

## License

MIT
