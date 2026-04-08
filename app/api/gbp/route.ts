/**
 * GBP API Routes — Server-side proxy
 *
 * Keeps Google OAuth tokens safe on the server.
 * Frontend calls these routes to get real GBP data.
 *
 * Endpoints (via ?action= query param):
 *   GET /api/gbp?action=accounts        → List GBP accounts
 *   GET /api/gbp?action=locations&accountId=X  → List locations
 *   GET /api/gbp?action=profile&accountId=X&locationId=X  → Full profile + reviews + posts + photos
 *   GET /api/gbp?action=reviews&accountId=X&locationId=X  → Reviews only
 *   GET /api/gbp?action=posts&accountId=X&locationId=X    → Posts only
 *   GET /api/gbp?action=photos&accountId=X&locationId=X   → Photos only
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  listAccounts,
  listLocations,
  getLocation,
  getAllReviews,
  getPosts,
  getPhotos,
  adaptToZenithClient,
  refreshAccessToken,
  updateDescription,
  type GBPTokens,
} from '@/lib/google-business';

// ── Helper: Get tokens from Supabase ─────────────────────────

async function getTokensForUser(userId: string): Promise<GBPTokens | null> {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('google_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as GBPTokens;
}

async function saveTokensForUser(userId: string, tokens: GBPTokens) {
  const supabase = createRouteHandlerClient({ cookies });

  await supabase
    .from('google_tokens')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
}

// ── Helper: Get authenticated user ──────────────────────────

async function getAuthUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

// ── Helper: Auto-refresh tokens ─────────────────────────────

async function getValidTokens(userId: string): Promise<GBPTokens> {
  const tokens = await getTokensForUser(userId);
  if (!tokens) {
    throw new Error('NO_TOKENS');
  }

  const now = Math.floor(Date.now() / 1000);
  if (tokens.expires_at <= now + 60) {
    const refreshed = await refreshAccessToken(tokens.refresh_token);
    await saveTokensForUser(userId, refreshed);
    return refreshed;
  }

  return tokens;
}

// ── Main Handler ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const accountId = searchParams.get('accountId');
    const locationId = searchParams.get('locationId');

    // Get valid tokens (auto-refreshes if expired)
    let tokens: GBPTokens;
    try {
      tokens = await getValidTokens(user.id);
    } catch (e: any) {
      if (e.message === 'NO_TOKENS') {
        return NextResponse.json(
          { error: 'Google não conectado. Conecte sua conta Google primeiro.', code: 'NO_GOOGLE_AUTH' },
          { status: 403 }
        );
      }
      throw e;
    }

    switch (action) {
      // ── List accounts ───────────────────────────────────
      case 'accounts': {
        const accounts = await listAccounts(tokens);
        return NextResponse.json({ accounts });
      }

      // ── List locations ──────────────────────────────────
      case 'locations': {
        if (!accountId) {
          return NextResponse.json({ error: 'accountId é obrigatório' }, { status: 400 });
        }
        const locations = await listLocations(tokens, accountId);

        // Return simplified list for selection
        const simplified = locations.map(loc => ({
          id: loc.name.split('/').pop(),
          resourceName: loc.name,
          title: loc.title,
          placeId: loc.metadata?.placeId,
          city: loc.storefrontAddress?.locality || '',
          state: loc.storefrontAddress?.administrativeArea || '',
          category: loc.categories?.primaryCategory?.displayName || '',
        }));

        return NextResponse.json({ locations: simplified });
      }

      // ── Full profile (location + reviews + posts + photos) ──
      case 'profile': {
        if (!accountId || !locationId) {
          return NextResponse.json({ error: 'accountId e locationId são obrigatórios' }, { status: 400 });
        }

        // Fetch all data in parallel
        const [location, reviews, posts, photos] = await Promise.all([
          getLocation(tokens, `accounts/${accountId}/locations/${locationId}`),
          getAllReviews(tokens, accountId, locationId),
          getPosts(tokens, accountId, locationId),
          getPhotos(tokens, accountId, locationId),
        ]);

        // Convert to Zenith format
        const zenithClient = adaptToZenithClient(location, reviews, posts, photos);

        return NextResponse.json({ client: zenithClient });
      }

      // ── Reviews only ────────────────────────────────────
      case 'reviews': {
        if (!accountId || !locationId) {
          return NextResponse.json({ error: 'accountId e locationId são obrigatórios' }, { status: 400 });
        }
        const reviews = await getAllReviews(tokens, accountId, locationId);
        return NextResponse.json({ reviews });
      }

      // ── Posts only ──────────────────────────────────────
      case 'posts': {
        if (!accountId || !locationId) {
          return NextResponse.json({ error: 'accountId e locationId são obrigatórios' }, { status: 400 });
        }
        const posts = await getPosts(tokens, accountId, locationId);
        return NextResponse.json({ posts });
      }

      // ── Photos only ─────────────────────────────────────
      case 'photos': {
        if (!accountId || !locationId) {
          return NextResponse.json({ error: 'accountId e locationId são obrigatórios' }, { status: 400 });
        }
        const photos = await getPhotos(tokens, accountId, locationId);
        return NextResponse.json({ photos });
      }

      default:
        return NextResponse.json(
          { error: `Ação desconhecida: ${action}. Use: accounts, locations, profile, reviews, posts, photos` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[GBP API Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ── POST: Update GBP data ───────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, accountId, locationId, description } = body;

    let tokens: GBPTokens;
    try {
      tokens = await getValidTokens(user.id);
    } catch (e: any) {
      if (e.message === 'NO_TOKENS') {
        return NextResponse.json(
          { error: 'Google não conectado.', code: 'NO_GOOGLE_AUTH' },
          { status: 403 }
        );
      }
      throw e;
    }

    switch (action) {
      case 'update-description': {
        if (!accountId || !locationId || typeof description !== 'string') {
          return NextResponse.json(
            { error: 'accountId, locationId e description são obrigatórios' },
            { status: 400 }
          );
        }

        const locationName = `accounts/${accountId}/locations/${locationId}`;
        const updated = await updateDescription(tokens, locationName, description);
        return NextResponse.json({ success: true, description: updated.profile?.description });
      }

      default:
        return NextResponse.json(
          { error: `Ação POST desconhecida: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[GBP API POST Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
