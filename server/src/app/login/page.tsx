'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cliRedirect = searchParams.get('redirect_uri');
  const redirectUri = cliRedirect || '/auth/callback';
  const googleUrl = `/api/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cliRedirect && document.cookie.includes('token=')) {
      router.replace('/dashboard');
    }
  }, [cliRedirect, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      if (cliRedirect) {
        const params = new URLSearchParams({ token: data.token, email: data.user.email, name: data.user.name || '' });
        window.location.href = `${cliRedirect}?${params.toString()}`;
        return;
      }

      document.cookie = `token=${data.token}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax; secure`;
      document.cookie = `email=${data.user.email}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax; secure`;
      router.push('/dashboard');
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2 text-center">Sign in to BrowserPack</h1>
      <p className="text-sm text-[var(--muted)] mb-6 text-center">
        Sync your browser profiles securely across machines.
      </p>

      <a
        href={googleUrl}
        className="inline-flex items-center justify-center gap-3 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-white/[0.04] transition-colors"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </a>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 border-t border-[var(--card-border)]" />
        <span className="text-xs text-[var(--muted)] uppercase">or</span>
        <div className="flex-1 border-t border-[var(--card-border)]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent placeholder:text-[var(--muted)]"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent placeholder:text-[var(--muted)]"
            placeholder="Min 8 characters"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Don&apos;t have an account?{' '}
        <Link href={cliRedirect ? `/register?redirect_uri=${encodeURIComponent(cliRedirect)}` : '/register'} className="text-[var(--accent)] hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12">
        <Suspense fallback={<p className="text-[var(--muted)]">Loading...</p>}>
          <LoginForm />
        </Suspense>
      </main>
    </>
  );
}
