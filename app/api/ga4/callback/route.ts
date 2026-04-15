/**
 * GA4 OAuth Callback
 * GET /api/ga4/callback?code=xxx&scope=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const scope = searchParams.get('scope');

    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code' },
        { status: 400 }
      );
    }

    // Trocar código por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ga4/callback`,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      console.error('[GA4 Callback] Token exchange failed');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=auth_failed`
      );
    }

    const tokens = await tokenResponse.json();

    // Salvar no banco (por enquanto, redirecionar e deixar o componente salvar)
    // TODO: Implementar salvar automático no banco

    // Redirecionar de volta pro dashboard (o cliente vai salvar property_id depois)
    const redirectUrl = new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL);
    redirectUrl.searchParams.set('access_token', tokens.access_token);
    redirectUrl.searchParams.set('refresh_token', tokens.refresh_token);
    redirectUrl.searchParams.set('ga4_connected', 'true');

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('[GA4 Callback]', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=callback_failed`
    );
  }
}
