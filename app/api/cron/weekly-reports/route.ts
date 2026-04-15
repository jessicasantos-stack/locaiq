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

    // Get all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, agency_id, name');

    if (clientsError) throw clientsError;
    if (!clients || clients.length === 0) {
      return NextResponse.json({ message: 'No clients found', reports: 0 });
    }

    let created = 0;
    let errors = 0;

    // Gera relatório pra cada cliente
    for (const client of clients) {
      try {
        // Chama a API de geração de relatório
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/generate-weekly`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({
              client_id: client.id,
            }),
          }
        );

        if (response.ok) {
          created++;
        } else {
          errors++;
          console.error(`[Cron] Failed to generate report for client ${client.id}`);
        }
      } catch (error) {
        errors++;
        console.error(`[Cron] Error generating report for client ${client.id}:`, error);
      }
    }

    return NextResponse.json({
      message: 'Weekly reports generation completed',
      total_clients: clients.length,
      reports_created: created,
      errors: errors,
    });
  } catch (error: any) {
    console.error('[Cron: weekly-reports]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
