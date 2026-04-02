import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Sync browser profiles
            <br />
            <span className="text-blue-600">across machines</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Pack your browser cookies, sessions, extensions, and bookmarks into an encrypted archive.
            Pull them on another machine — no re-login needed.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Get Started
            </Link>
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-xl border border-gray-200 p-6">
              <div className="text-3xl font-bold text-blue-600 mb-3">1</div>
              <h3 className="text-lg font-semibold mb-2">Install CLI</h3>
              <code className="block bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-800">
                npm install -g browserpack
              </code>
            </div>
            <div className="rounded-xl border border-gray-200 p-6">
              <div className="text-3xl font-bold text-blue-600 mb-3">2</div>
              <h3 className="text-lg font-semibold mb-2">Login &amp; Pack</h3>
              <code className="block bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-800">
                browserpack login<br />
                browserpack pack
              </code>
            </div>
            <div className="rounded-xl border border-gray-200 p-6">
              <div className="text-3xl font-bold text-blue-600 mb-3">3</div>
              <h3 className="text-lg font-semibold mb-2">Pull on another machine</h3>
              <code className="block bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-800">
                browserpack login<br />
                browserpack pull &lt;id&gt;
              </code>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-gray-50 py-24">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-12">Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: 'End-to-end encrypted', desc: 'AES-256-GCM encryption with Argon2id key derivation. Your data is encrypted before it leaves your machine.' },
                { title: 'Multi-browser support', desc: 'Chrome, Brave, Edge, and Chromium. All Chromium-based browsers supported.' },
                { title: 'Cross-platform', desc: 'Works on Linux, macOS, and Windows. Pack on one OS, pull on another.' },
                { title: 'Selective packing', desc: 'Choose what to include: sessions only, bookmarks only, or full profile with extensions.' },
              ].map((f) => (
                <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-gray-600 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        BrowserPack &mdash; Open source browser profile sync tool
      </footer>
    </>
  );
}
