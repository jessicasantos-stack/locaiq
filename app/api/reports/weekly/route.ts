/**
 * API: List Weekly Reports
 * GET /api/reports/weekly?client_id=xxx&limit=10&offset=0
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Validar user autenticado
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar parâmetros
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('client_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!clientId) {
      return NextResponse.json(
        { error: 'client_id is required' },
        { status: 400 }
      );
    }

    // Buscar relatórios
    const { data: reports, error, count } = await supabase
      .from('weekly_reports')
      .select('id, period_start, period_end, created_at, data', {
        count: 'exact',
      })
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: reports || [],
      count: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('[List Reports]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
