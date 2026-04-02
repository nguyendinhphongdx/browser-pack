import Link from 'next/link';

export default function Navbar({ email }: { email?: string }) {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-gray-900">
          BrowserPack
        </Link>
        <div className="flex items-center gap-4">
          {email ? (
            <>
              <span className="text-sm text-gray-600">{email}</span>
              <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
                Dashboard
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
