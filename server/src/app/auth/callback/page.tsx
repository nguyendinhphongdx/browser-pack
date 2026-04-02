'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const email = searchParams.get('email');

    if (error) {
      setStatus('error');
      setMessage(searchParams.get('message') || 'Authentication failed');
      return;
    }

    if (token) {
      // Set httpOnly-like cookie via secure flags
      document.cookie = `token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax; secure`;
      if (email) {
        document.cookie = `email=${email}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax; secure`;
      }
      // Clear token from URL to prevent leaking via browser history (#5)
      window.history.replaceState({}, '', '/auth/callback');
      setStatus('success');
      setMessage(email || 'Authenticated');
      setTimeout(() => router.push('/dashboard'), 1500);
    } else {
      setStatus('error');
      setMessage('No token received');
    }
  }, [searchParams, router]);

  return (
    <div className="text-center">
      {status === 'loading' && <p className="text-gray-600">Processing login...</p>}
      {status === 'success' && (
        <>
          <div className="text-4xl mb-4">&#10003;</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login successful!</h1>
          <p className="text-gray-600">Welcome, {message}</p>
          <p className="text-sm text-gray-400 mt-2">Redirecting to dashboard...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="text-4xl mb-4">&#10007;</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Login failed</h1>
          <p className="text-gray-600">{message}</p>
        </>
      )}
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
