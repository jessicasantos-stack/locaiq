/**
 * Local Falcon Setup
 * POST /api/localfalcon/setup
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

    const { client_id, google_business_profile_id } = await request.json();

    if (!client_id || !google_business_profile_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Atualizar client com GBP ID
    const { error } = await supabase
      .from('clients')
      .update({
        google_business_profile_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', client_id);

    if (error) {
      console.error('[Local Falcon Setup]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Começar rastreamento (chamar Local Falcon API pra primeira vez)
    // TODO: Implementar chamada inicial ao Local Falcon

    return NextResponse.json({
      success: true,
      message: 'Local Falcon configured',
    });
  } catch (error: any) {
    console.error('[Local Falcon Setup]', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
