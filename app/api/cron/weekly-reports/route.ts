/**
 * Cron: Weekly Reports
 * Runs every Monday at 9am (configured in vercel.json)
 * Creates weekly digest events for each agency
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get all agencies
    const { data: agencies, error: agenciesError } = await supabase
      .from('agencies')
      .select('id, name, user_id');

    if (agenciesError) throw agenciesError;
    if (!agencies || agencies.length === 0) {
      return NextResponse.json({ message: 'No agencies found', reports: 0 });
    }

    let created = 0;

    for (const agency of agencies) {
      // Get client count and recent score data
      const { count: clientCount } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('agency_id', agency.id);

      // Get last 7 days of score history
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: scores } = await supabase
        .from('score_history')
        .select('overall_score, client_id, snapshot_date')
        .eq('is_real', true)
        .gte('snapshot_date', weekAgo.toISOString().split('T')[0])
        .in('client_id', (
          await supabase.from('clients').select('id').eq('agency_id', agency.id)
        ).data?.map(c => c.id) || []);

      const avgScore = scores && scores.length > 0
        ? Math.round(scores.reduce((s, r) => s + r.overall_score, 0) / scores.length)
        : 0;

      // Create weekly digest event
      const { error: eventError } = await supabase.from('events').insert({
        agency_id: agency.id,
        client_id: null,
        type: 'weekly_digest',
        level: 'info',
        title: `Weekly Report — ${clientCount || 0} clients, avg score ${avgScore}`,
        detail: `Weekly digest generated automatically.`,
        metadata: {
          client_count: clientCount || 0,
          avg_score: avgScore,
          period: 'weekly',
          generated_at: new Date().toISOString(),
        },
      });

      if (!eventError) created++;
    }

    return NextResponse.json({
      message: 'Weekly reports generated',
      agencies: agencies.length,
      reports_created: created,
    });
  } catch (error: any) {
    console.error('[Cron: weekly-reports]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
