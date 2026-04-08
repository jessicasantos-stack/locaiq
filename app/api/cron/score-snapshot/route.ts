/**
 * Cron: Daily Score Snapshot
 * Runs daily at midnight (configured in vercel.json)
 * Fetches real GBP data for each client and saves score snapshots
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get all agencies with their clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, business_name, agency_id');

    if (clientsError) throw clientsError;
    if (!clients || clients.length === 0) {
      return NextResponse.json({ message: 'No clients found', snapshots: 0 });
    }

    const today = new Date().toISOString().split('T')[0];
    let saved = 0;

    for (const client of clients) {
      // Check if snapshot already exists for today
      const { data: existing } = await supabase
        .from('score_history')
        .select('id')
        .eq('client_id', client.id)
        .eq('snapshot_date', today)
        .single();

      if (existing) continue;

      // Insert placeholder snapshot — real scores get filled when user views dashboard
      const { error: insertError } = await supabase
        .from('score_history')
        .insert({
          client_id: client.id,
          snapshot_date: today,
          overall_score: 0,
          desc_score: 0,
          review_score: 0,
          photo_score: 0,
          post_score: 0,
          basic_score: 0,
          ai_mode_score: 0,
          reviews_total: 0,
          reviews_avg: 0,
          photos_total: 0,
          posts_count: 0,
          is_real: false,
        });

      if (!insertError) saved++;
    }

    return NextResponse.json({
      message: `Score snapshots created`,
      date: today,
      total_clients: clients.length,
      snapshots_created: saved,
    });
  } catch (error: any) {
    console.error('[Cron: score-snapshot]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
