'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handled = useRef(false);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [displayEmail, setDisplayEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (handled.current) return;

    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const email = searchParams.get('email');
    const message = searchParams.get('message');

    if (error) {
      handled.current = true;
      setStatus('error');
      setErrorMsg(message || 'Authentication failed');
      return;
    }

    if (token) {
      handled.current = true;
      // Save token as cookie
      document.cookie = `token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
      if (email) {
        document.cookie = `email=${email}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
      }
      // Clear token from URL
      window.history.replaceState({}, '', '/auth/callback');
      setStatus('success');
      setDisplayEmail(email || 'user');
      // Redirect to dashboard
      setTimeout(() => router.push('/dashboard'), 1500);
    }
    // If no token and no error yet, stay in 'processing' — params may not be hydrated yet
  }, [searchParams, router]);

  if (status === 'processing') {
    return <p className="text-gray-600">Processing login...</p>;
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">&#10007;</div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Login failed</h1>
        <p className="text-gray-600">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-4xl mb-4">&#10003;</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Login successful!</h1>
      <p className="text-gray-600">Welcome, {displayEmail}</p>
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
