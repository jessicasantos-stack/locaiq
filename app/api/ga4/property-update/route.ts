/**
 * GA4 Property Update
 * POST /api/ga4/property-update
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id, property_id, access_token, refresh_token } = await request.json();

    if (!client_id || !property_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Salvar ou atualizar GA4 config
    const { error } = await supabase
      .from('client_ga4_properties')
      .upsert({
        client_id,
        property_id,
        access_token: access_token || null,
        refresh_token: refresh_token || null,
        updated_at: new Date().toISOString(),
      })
      .eq('client_id', client_id);

    if (error) {
      console.error('[GA4 Property Update]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'GA4 property updated',
    });
  } catch (error: any) {
    console.error('[GA4 Property Update]', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
