import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { CopyButton } from '@/components/CopyButton';

const FEATURES = [
  {
    icon: '🔒',
    title: 'End-to-End Encrypted',
    desc: 'AES-256-GCM encryption with Argon2id key derivation. Your data is encrypted before it ever leaves your machine. Zero-knowledge architecture.',
  },
  {
    icon: '🌐',
    title: 'Multi-Browser Support',
    desc: 'Chrome, Brave, Edge, and Chromium. All major Chromium-based browsers are supported out of the box.',
  },
  {
    icon: '💻',
    title: 'Cross-Platform',
    desc: 'Works on Linux, macOS, and Windows. Pack on one OS, pull on another — seamlessly.',
  },
  {
    icon: '📦',
    title: 'Selective Packing',
    desc: 'Choose what to include: sessions only, bookmarks only, or full profile with extensions and history.',
  },
  {
    icon: '☁️',
    title: 'Cloud Sync',
    desc: 'Securely upload encrypted backups to the cloud. Access your profiles from anywhere, on any machine.',
  },
  {
    icon: '⚡',
    title: 'Fast & Lightweight',
    desc: 'Built with Node.js and optimized for speed. Pack and restore profiles in seconds, not minutes.',
  },
];

const CLI_COMMANDS = [
  { cmd: 'bpacker login', desc: 'Login via browser (Google or email)' },
  { cmd: 'bpacker profile ls', desc: 'List all local browser profiles' },
  { cmd: 'bpacker pack', desc: 'Pack & upload a browser profile' },
  { cmd: 'bpacker pull --name <name>', desc: 'Pull a backup on another machine' },
  { cmd: 'bpacker remote profile ls', desc: 'List backups on cloud' },
  { cmd: 'bpacker whoami', desc: 'Show current logged-in user' },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="hero-glow" />
          <div className="mx-auto max-w-4xl px-6 pt-28 pb-20 text-center relative z-10">
            <div className="animate-in">
              <span className="badge mb-6 inline-flex">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                v1.0 — Now available
              </span>
            </div>

            <h1 className="animate-in animate-delay-1 text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
              Sync browser profiles
              <br />
              <span className="text-[var(--accent)]">across machines</span>
            </h1>

            <p className="animate-in animate-delay-2 mt-6 text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
              Pack your browser cookies, sessions, extensions, and bookmarks into an encrypted archive.
              Pull them on another machine — no re-login needed.
            </p>

            <div className="animate-in animate-delay-3 mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="#install"
                className="rounded-xl bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="https://github.com/nicktoan2s/bpacker"
                target="_blank"
                className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-7 py-3.5 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--muted)] transition-colors"
              >
                View on GitHub
              </Link>
            </div>

            {/* Quick install one-liner */}
            <div className="animate-in animate-delay-4 mt-12 max-w-md mx-auto">
              <div className="code-block relative">
                <pre className="text-left">
                  <span className="text-[var(--muted)]">$</span>{' '}
                  <span className="text-[var(--accent)]">npm</span> install -g @hanoilab/bpacker
                </pre>
                <CopyButton text="npm install -g @hanoilab/bpacker" />
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider mx-auto max-w-4xl" />

        {/* Install Guide */}
        <section id="install" className="mx-auto max-w-4xl px-6 py-24">
          <h2 className="text-3xl font-bold text-center mb-4">Quick Start</h2>
          <p className="text-[var(--muted)] text-center mb-14 max-w-xl mx-auto">
            Get up and running in under a minute. BrowserPack works entirely from the command line.
          </p>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-5 items-start">
              <div className="step-number mt-1">1</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Install the CLI</h3>
                <p className="text-sm text-[var(--muted)] mb-3">
                  Requires Node.js 18+. Install globally via npm.
                </p>
                <div className="code-block relative">
                  <div className="code-block-header">
                    <div className="code-block-dot" style={{ background: '#ff5f57' }} />
                    <div className="code-block-dot" style={{ background: '#febc2e' }} />
                    <div className="code-block-dot" style={{ background: '#28c840' }} />
                  </div>
                  <pre>
                    <span className="text-[var(--muted)]">$</span>{' '}
                    <span className="text-[var(--accent)]">npm</span> install -g @hanoilab/bpacker
                  </pre>
                  <CopyButton text="npm install -g @hanoilab/bpacker" />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-5 items-start">
              <div className="step-number mt-1">2</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Login & pack your profile</h3>
                <p className="text-sm text-[var(--muted)] mb-3">
                  Authenticate with your account, then pack any browser profile.
                </p>
                <div className="code-block relative">
                  <div className="code-block-header">
                    <div className="code-block-dot" style={{ background: '#ff5f57' }} />
                    <div className="code-block-dot" style={{ background: '#febc2e' }} />
                    <div className="code-block-dot" style={{ background: '#28c840' }} />
                  </div>
                  <pre>
                    <span className="text-[var(--muted)]">$</span>{' '}
                    <span className="text-[var(--accent)]">bpacker</span> login{'\n'}
                    <span className="text-[var(--muted)]"># Opens browser for Google or email login</span>{'\n'}
                    {'\n'}
                    <span className="text-[var(--muted)]">$</span>{' '}
                    <span className="text-[var(--accent)]">bpacker</span> profile ls{'\n'}
                    <span className="text-[var(--muted)]"># Lists all local browser profiles</span>{'\n'}
                    {'\n'}
                    <span className="text-[var(--muted)]">$</span>{' '}
                    <span className="text-[var(--accent)]">bpacker</span> pack{'\n'}
                    <span className="text-[var(--muted)]"># Interactive: pick profile, encrypt, upload</span>
                  </pre>
                  <CopyButton text="bpacker login && bpacker profile ls && bpacker pack" />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-5 items-start">
              <div className="step-number mt-1">3</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Pull on another machine</h3>
                <p className="text-sm text-[var(--muted)] mb-3">
                  Login on your new machine and restore the profile. All sessions stay intact.
                </p>
                <div className="code-block relative">
                  <div className="code-block-header">
                    <div className="code-block-dot" style={{ background: '#ff5f57' }} />
                    <div className="code-block-dot" style={{ background: '#febc2e' }} />
                    <div className="code-block-dot" style={{ background: '#28c840' }} />
                  </div>
                  <pre>
                    <span className="text-[var(--muted)]">$</span>{' '}
                    <span className="text-[var(--accent)]">bpacker</span> login{'\n'}
                    {'\n'}
                    <span className="text-[var(--muted)]">$</span>{' '}
                    <span className="text-[var(--accent)]">bpacker</span> remote profile ls{'\n'}
                    <span className="text-[var(--muted)]"># Shows your cloud backups</span>{'\n'}
                    {'\n'}
                    <span className="text-[var(--muted)]">$</span>{' '}
                    <span className="text-[var(--accent)]">bpacker</span> pull --name my-profile{'\n'}
                    <span className="text-[var(--muted)]"># Decrypts and restores the profile</span>
                  </pre>
                  <CopyButton text="bpacker login && bpacker remote profile ls && bpacker pull --name my-profile" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider mx-auto max-w-4xl" />

        {/* Features */}
        <section id="features" className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-3xl font-bold text-center mb-4">Features</h2>
          <p className="text-[var(--muted)] text-center mb-14 max-w-xl mx-auto">
            Everything you need to manage and sync browser profiles securely.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="section-divider mx-auto max-w-4xl" />

        {/* CLI Reference */}
        <section className="mx-auto max-w-4xl px-6 py-24">
          <h2 className="text-3xl font-bold text-center mb-4">CLI Commands</h2>
          <p className="text-[var(--muted)] text-center mb-14 max-w-xl mx-auto">
            Simple, powerful commands to manage your browser profiles.
          </p>
          <div className="code-block">
            <div className="code-block-header">
              <div className="code-block-dot" style={{ background: '#ff5f57' }} />
              <div className="code-block-dot" style={{ background: '#febc2e' }} />
              <div className="code-block-dot" style={{ background: '#28c840' }} />
              <span className="ml-3 text-xs text-[var(--muted)]">Terminal</span>
            </div>
            <div className="divide-y divide-[var(--card-border)]">
              {CLI_COMMANDS.map((c) => (
                <div key={c.cmd} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <code className="text-sm font-mono text-[var(--accent)]">{c.cmd}</code>
                  <span className="text-xs text-[var(--muted)] ml-4 text-right">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider mx-auto max-w-4xl" />

        {/* Platforms & Browsers */}
        <section className="mx-auto max-w-4xl px-6 py-24">
          <h2 className="text-3xl font-bold text-center mb-4">Works Everywhere</h2>
          <p className="text-[var(--muted)] text-center mb-14 max-w-xl mx-auto">
            Supports all major Chromium browsers and operating systems.
          </p>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* Browsers */}
            <div className="feature-card">
              <h3 className="text-base font-semibold mb-5">Supported Browsers</h3>
              <div className="flex flex-wrap gap-3">
                {['Chrome', 'Brave', 'Edge', 'Chromium'].map((b) => (
                  <span key={b} className="platform-pill">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div className="feature-card">
              <h3 className="text-base font-semibold mb-5">Supported Platforms</h3>
              <div className="flex flex-wrap gap-3">
                {['Linux', 'macOS', 'Windows'].map((p) => (
                  <span key={p} className="platform-pill">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider mx-auto max-w-4xl" />

        {/* Security */}
        <section className="mx-auto max-w-4xl px-6 py-24">
          <h2 className="text-3xl font-bold text-center mb-4">Security First</h2>
          <p className="text-[var(--muted)] text-center mb-14 max-w-xl mx-auto">
            Your data never leaves your machine unencrypted.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { title: 'AES-256-GCM', desc: 'Military-grade encryption for all backup data.' },
              { title: 'Argon2id KDF', desc: 'Industry-leading key derivation from your password.' },
              { title: 'Zero Knowledge', desc: 'Password is never stored — prompted each time.' },
              { title: 'Client-Side Encryption', desc: 'Data is encrypted before it leaves your machine.' },
            ].map((s) => (
              <div key={s.title} className="feature-card">
                <h3 className="text-base font-semibold mb-2 text-[var(--accent)]">{s.title}</h3>
                <p className="text-sm text-[var(--muted)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to sync?</h2>
          <p className="text-[var(--muted)] mb-10 max-w-md mx-auto">
            Install BrowserPack in seconds and never worry about re-logging in again.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-[var(--accent)] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-8 py-3.5 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--muted)] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--card-border)] py-10">
        <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[var(--muted)]">
            BrowserPack &mdash; Open source browser profile sync tool
          </div>
          <div className="flex items-center gap-6">
            <Link href="https://github.com/nicktoan2s/bpacker" target="_blank" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
              GitHub
            </Link>
            <Link href="https://www.npmjs.com/package/@hanoilab/bpacker" target="_blank" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
              npm
            </Link>
            <span className="text-sm text-[var(--muted)]">MIT License</span>
          </div>
        </div>
      </footer>
    </>
  );
}
