import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/lib/google-oauth';
import { findOrCreateUser } from '@/services/user';
import { signToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const stateParam = request.nextUrl.searchParams.get('state');

  if (!code || !stateParam) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  let redirectUri: string;
  try {
    const state = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
    redirectUri = state.redirectUri;
    // Validate redirect_uri again to prevent open redirect
    const isLocalhost = redirectUri.startsWith('http://localhost:') || redirectUri.startsWith('http://127.0.0.1:');
    const isRelative = redirectUri.startsWith('/');
    if (!isLocalhost && !isRelative) {
      return NextResponse.json({ error: 'Invalid redirect_uri in state' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  try {
    const accessToken = await exchangeCodeForTokens(code);
    const googleUser = await getGoogleUserInfo(accessToken);
    const user = await findOrCreateUser(googleUser);
    const jwt = signToken(user.id);

    const params = new URLSearchParams({
      token: jwt,
      email: user.email,
      name: user.name || '',
    });

    // Relative path = web, localhost = CLI
    if (redirectUri.startsWith('/')) {
      const serverUrl = process.env.SERVER_URL || request.nextUrl.origin;
      return NextResponse.redirect(`${serverUrl}${redirectUri}?${params.toString()}`);
    }

    return NextResponse.redirect(`${redirectUri}?${params.toString()}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    try {
      const errorParams = new URLSearchParams({
        error: 'auth_failed',
        message: (error as Error).message,
      });
      if (redirectUri.startsWith('/')) {
        const serverUrl = process.env.SERVER_URL || request.nextUrl.origin;
        return NextResponse.redirect(`${serverUrl}${redirectUri}?${errorParams.toString()}`);
      }
      return NextResponse.redirect(`${redirectUri}?${errorParams.toString()}`);
    } catch {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
  }
}
