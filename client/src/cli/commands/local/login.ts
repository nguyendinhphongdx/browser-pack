import { Command } from 'commander';
import { createServer, type Server } from 'node:http';
import { createInterface } from 'node:readline';
import { exec } from 'node:child_process';
import { logger } from '../../../core/logger.js';
import { saveAuth } from '../../../auth/store.js';

const DEFAULT_SERVER_URL = process.env.BROWSERPACK_SERVER || 'https://browser-pack.vercel.app';

function ask(question: string, hide = false): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function openBrowser(url: string): void {
  const platform = process.platform;
  const cmd =
    platform === 'darwin' ? 'open' :
    platform === 'win32' ? 'start' :
    'xdg-open';
  exec(`${cmd} "${url}"`);
}

async function loginWithBrowser(serverUrl: string): Promise<{ token: string; email: string; name: string }> {
  let server: Server | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await new Promise<{ token: string; email: string; name: string }>((resolve, reject) => {
      server = createServer((req, res) => {
        const port = (server!.address() as { port: number }).port;
        const url = new URL(req.url!, `http://localhost:${port}`);

        if (url.pathname === '/callback') {
          const tokenParam = url.searchParams.get('token');
          const error = url.searchParams.get('error');
          const email = url.searchParams.get('email') || '';
          const name = url.searchParams.get('name') || '';

          if (error) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<html><body><h2>Login failed</h2><p>You can close this tab.</p></body></html>');
            reject(new Error(`Login failed: ${error}`));
            return;
          }

          if (tokenParam) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<html><body><h2>Login successful!</h2><p>You can close this tab and return to the terminal.</p></body></html>');
            resolve({ token: tokenParam, email, name });
            return;
          }

          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Missing token');
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      server.on('error', (err) => {
        reject(new Error(`Failed to start callback server: ${err.message}`));
      });

      server.listen(0, '127.0.0.1', () => {
        const addr = server!.address();
        if (!addr || typeof addr !== 'object') {
          reject(new Error('Failed to get server address'));
          return;
        }

        const port = addr.port;
        const redirectUri = `http://localhost:${port}/callback`;
        const authUrl = `${serverUrl}/login?redirect_uri=${encodeURIComponent(redirectUri)}`;

        logger.info('Opening browser...');
        openBrowser(authUrl);
        logger.info(`Waiting for login (callback on port ${port})...`);
      });

      timeout = setTimeout(() => {
        reject(new Error('Login timed out after 120 seconds'));
      }, 120000);
    });
  } finally {
    if (timeout) clearTimeout(timeout);
    if (server) server.close();
  }
}

async function loginWithEmail(serverUrl: string): Promise<{ token: string; email: string; name: string }> {
  const email = await ask('Email: ');
  const password = await ask('Password: ');

  const res = await fetch(`${serverUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }

  return { token: data.token, email: data.user.email, name: data.user.name || '' };
}

export const loginCommand = new Command('login')
  .description('Login to BrowserPack')
  .option('--server <url>', 'Server URL (or set BROWSERPACK_SERVER env)', DEFAULT_SERVER_URL)
  .option('--email', 'Login with email/password instead of browser', false)
  .action(async (opts) => {
    const serverUrl = (opts.server as string).replace(/\/$/, '');

    try {
      let result: { token: string; email: string; name: string };

      if (opts.email) {
        result = await loginWithEmail(serverUrl);
      } else {
        result = await loginWithBrowser(serverUrl);
      }

      await saveAuth({
        token: result.token,
        serverUrl,
        email: result.email,
        name: result.name,
      });

      logger.success(`Logged in as ${result.email}`);
    } catch (error) {
      logger.error((error as Error).message);
      process.exit(1);
    }
  });
