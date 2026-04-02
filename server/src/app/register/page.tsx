'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cliRedirect = searchParams.get('redirect_uri');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
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

  const inputClass = "w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent placeholder:text-[var(--muted)]";

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2 text-center">Create an account</h1>
      <p className="text-sm text-[var(--muted)] mb-6 text-center">
        Start syncing your browser profiles.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-1">Name (optional)</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
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
            minLength={8}
            className={inputClass}
            placeholder="Min 8 characters"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-[var(--foreground)] mb-1">Confirm password</label>
          <input
            id="confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={inputClass}
            placeholder="Repeat password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already have an account?{' '}
        <Link href={cliRedirect ? `/login?redirect_uri=${encodeURIComponent(cliRedirect)}` : '/login'} className="text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12">
        <Suspense fallback={<p className="text-[var(--muted)]">Loading...</p>}>
          <RegisterForm />
        </Suspense>
      </main>
    </>
  );
}
