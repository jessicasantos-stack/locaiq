/**
 * Cron: Monthly Reports
 * Runs on the 1st of each month at 9am (configured in vercel.json)
 * Creates monthly summary events for each agency
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

    const { data: agencies, error: agenciesError } = await supabase
      .from('agencies')
      .select('id, name, user_id');

    if (agenciesError) throw agenciesError;
    if (!agencies || agencies.length === 0) {
      return NextResponse.json({ message: 'No agencies found', reports: 0 });
    }

    // Previous month range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const monthLabel = monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    let created = 0;

    for (const agency of agencies) {
      // Get clients for this agency
      const { data: agencyClients } = await supabase
        .from('clients')
        .select('id, business_name')
        .eq('agency_id', agency.id);

      const clientIds = agencyClients?.map(c => c.id) || [];
      if (clientIds.length === 0) continue;

      // Get score history for the month
      const { data: scores } = await supabase
        .from('score_history')
        .select('*')
        .eq('is_real', true)
        .gte('snapshot_date', monthStart.toISOString().split('T')[0])
        .lte('snapshot_date', monthEnd.toISOString().split('T')[0])
        .in('client_id', clientIds);

      // Calculate month stats
      const avgScore = scores && scores.length > 0
        ? Math.round(scores.reduce((s, r) => s + r.overall_score, 0) / scores.length)
        : 0;

      const totalReviews = scores?.reduce((s, r) => Math.max(s, r.reviews_total || 0), 0) || 0;

      // Create monthly report event
      const { error: eventError } = await supabase.from('events').insert({
        agency_id: agency.id,
        client_id: null,
        type: 'monthly_report',
        level: 'info',
        title: `Monthly Report — ${monthLabel}`,
        detail: `${clientIds.length} clients, avg score ${avgScore}, ${totalReviews} total reviews.`,
        metadata: {
          client_count: clientIds.length,
          avg_score: avgScore,
          total_reviews: totalReviews,
          period: 'monthly',
          month: monthLabel,
          generated_at: new Date().toISOString(),
        },
      });

      if (!eventError) created++;
    }

    return NextResponse.json({
      message: `Monthly reports generated for ${monthLabel}`,
      agencies: agencies.length,
      reports_created: created,
    });
  } catch (error: any) {
    console.error('[Cron: monthly-reports]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
