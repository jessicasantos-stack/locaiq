/**
 * Report Settings
 * GET /api/reports/settings?client_id=xxx
 * POST /api/reports/settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET - Buscar configurações
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = request.nextUrl.searchParams.get('client_id');
    if (!clientId) {
      return NextResponse.json(
        { error: 'client_id required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('report_settings')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Não encontrado, retornar defaults
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[Report Settings GET]', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

// POST - Salvar configurações
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      client_id,
      frequency,
      day,
      hour,
      timezone,
      email_recipients,
      include_ga4,
      include_ranking,
      include_gbp,
      include_insights,
    } = await request.json();

    if (!client_id || !email_recipients?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calcular próximo envio
    const nextSendAt = calculateNextSendTime(day, hour, timezone);

    const { error } = await supabase
      .from('report_settings')
      .upsert({
        client_id,
        frequency: frequency || 'weekly',
        day_of_week: day || 'friday',
        hour_utc: hour || 9,
        timezone: timezone || 'America/New_York',
        email_recipients: email_recipients || [],
        include_ga4: include_ga4 !== false,
        include_ranking: include_ranking !== false,
        include_gbp: include_gbp !== false,
        include_insights: include_insights !== false,
        next_send_at: nextSendAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('client_id', client_id);

    if (error) {
      console.error('[Report Settings POST]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Report settings saved',
      next_send_at: nextSendAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[Report Settings POST]', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * Calcula próxima data/hora para envio
 */
function calculateNextSendTime(
  dayOfWeek: string,
  hour: number,
  timezone: string
): Date {
  const dayMap: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  };

  const targetDay = dayMap[dayOfWeek] || 5; // default: friday

  const now = new Date();
  const next = new Date(now);

  // Ir pro próximo dia alvo
  let daysToAdd = targetDay - now.getDay();
  if (daysToAdd <= 0) daysToAdd += 7;

  next.setDate(next.getDate() + daysToAdd);
  next.setHours(hour, 0, 0, 0);

  return next;
}
