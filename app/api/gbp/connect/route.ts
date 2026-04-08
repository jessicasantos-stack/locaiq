/**
 * Google OAuth Connect — Specifically for GBP API access
 *
 * POST /api/gbp/connect       → Start OAuth flow (returns redirect URL)
 * GET  /api/gbp/connect       → OAuth callback (exchanges code for tokens)
 *
 * This is SEPARATE from Supabase Google Auth (login).
 * This connects the user's Google account to access GBP data.
 * Requires scopes: business.manage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Scopes needed for full GBP access
const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
].join(' ');

function getRedirectUri() {
  const base = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  return `${base}/api/gbp/connect`;
}

// ── POST: Start OAuth flow ──────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'GOOGLE_CLIENT_ID não configurado no servidor' },
        { status: 500 }
      );
    }

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: getRedirectUri(),
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',      // gets refresh_token
      prompt: 'consent',            // always ask (ensures refresh_token)
      state: session.user.id,       // pass user ID for callback
    });

    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    return NextResponse.json({ url: authUrl });

  } catch (error: any) {
    console.error('[GBP Connect Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── GET: OAuth callback ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // user ID
    const error = searchParams.get('error');

    if (error) {
      const base = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${base}/dashboard?gbp_error=${error}`);
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Google credentials não configuradas' }, { status: 500 });
    }

    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getRedirectUri(),
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[GBP Token Exchange Error]', err);
      const base = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${base}/dashboard?gbp_error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();

    // Save tokens to Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { error: dbError } = await supabase
      .from('google_tokens')
      .upsert({
        user_id: state,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
        scope: SCOPES,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('[GBP Token Save Error]', dbError);
    }

    // Redirect back to dashboard with success
    const base = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${base}/dashboard?gbp_connected=true`);

  } catch (error: any) {
    console.error('[GBP Callback Error]', error);
    const base = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${base}/dashboard?gbp_error=unknown`);
  }
}
