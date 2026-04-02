import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/google-oauth';

export async function GET(request: NextRequest) {
  const redirectUri = request.nextUrl.searchParams.get('redirect_uri');
  if (!redirectUri) {
    return NextResponse.json({ error: 'Missing redirect_uri' }, { status: 400 });
  }

  // Allow localhost/127.0.0.1 (CLI) and relative paths (web)
  const isLocalhost = redirectUri.startsWith('http://localhost:') || redirectUri.startsWith('http://127.0.0.1:');
  const isRelative = redirectUri.startsWith('/');
  if (!isLocalhost && !isRelative) {
    return NextResponse.json({ error: 'Invalid redirect_uri. Must be localhost or relative path.' }, { status: 400 });
  }

  const state = Buffer.from(JSON.stringify({ redirectUri })).toString('base64url');
  const authUrl = getGoogleAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
