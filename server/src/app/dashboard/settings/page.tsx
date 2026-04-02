import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import { getUserById } from '@/services/user';
import Navbar from '@/components/Navbar';

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  let userId: string;
  try {
    const payload = verifyToken(token);
    userId = payload.sub;
  } catch {
    redirect('/login');
  }

  const user = await getUserById(userId);
  if (!user) redirect('/login');

  return (
    <>
      <Navbar email={user.email} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Name</label>
            <p className="text-gray-900">{user.name || '(not set)'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Member since</label>
            <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mt-8">
          <LogoutButton />
        </div>
      </main>
    </>
  );
}

function LogoutButton() {
  return (
    <form
      action={async () => {
        'use server';
        const cookieStore = await cookies();
        cookieStore.delete('token');
        cookieStore.delete('email');
        redirect('/');
      }}
    >
      <button
        type="submit"
        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Logout
      </button>
    </form>
  );
}
