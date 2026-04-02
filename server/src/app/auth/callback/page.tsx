'use client';

import { Suspense, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handled = useRef(false);

  const token = searchParams.get('token');
  const error = searchParams.get('error');
  const email = searchParams.get('email');
  const errorMessage = searchParams.get('message') || 'Authentication failed';

  const status = useMemo(() => {
    if (error) return 'error' as const;
    if (token) return 'success' as const;
    return 'loading' as const;
  }, [error, token]);

  useEffect(() => {
    if (handled.current || status !== 'success' || !token) return;
    handled.current = true;

    document.cookie = `token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
    if (email) {
      document.cookie = `email=${email}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
    }
    window.history.replaceState({}, '', '/auth/callback');

    const timer = setTimeout(() => router.push('/dashboard'), 1500);
    return () => clearTimeout(timer);
  }, [status, token, email, router]);

  if (status === 'loading') {
    return <p className="text-gray-600">Processing login...</p>;
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">&#10007;</div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Login failed</h1>
        <p className="text-gray-600">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-4xl mb-4">&#10003;</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Login successful!</h1>
      <p className="text-gray-600">Welcome, {email || 'user'}</p>
      <p className="text-sm text-gray-400 mt-2">Redirecting to dashboard...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <main className="flex-1 flex items-center justify-center">
      <Suspense fallback={<p className="text-gray-600">Loading...</p>}>
        <CallbackHandler />
      </Suspense>
    </main>
  );
}
