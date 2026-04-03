import Link from 'next/link';

export default function Navbar({ email }: { email?: string }) {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold text-[var(--foreground)]">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#3b82f6" />
            <path d="M8 12h16v2H8zm0 4h12v2H8zm0 4h8v2H8z" fill="white" opacity="0.9" />
            <circle cx="24" cy="10" r="3" fill="white" opacity="0.7" />
          </svg>
          BrowserPack
        </Link>

        <div className="flex items-center gap-5">
          <Link
            href="https://github.com/nguyendinhphongdx/browser-pack"
            target="_blank"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            GitHub
          </Link>
          <Link
            href="#install"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Install
          </Link>
          <Link
            href="#features"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Features
          </Link>
          {email ? (
            <>
              <span className="text-sm text-[var(--muted)]">{email}</span>
              <Link
                href="/dashboard"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
