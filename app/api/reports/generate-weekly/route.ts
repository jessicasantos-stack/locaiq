/**
 * API: Generate Weekly Report
 * POST /api/reports/generate-weekly
 *
 * Coleta dados de GA4 + Local Falcon + GBP
 * Gera insights com Claude
 * Salva no banco e envia email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GA4Client } from '@/app/utils/ga4';
import { LocalFalconClient } from '@/app/utils/localfalcon';
import { generateReportHTML, generateReportText } from '@/app/utils/reportTemplate';
import { WeeklyReportData, InsightRequest } from '@/app/types/reports';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Validar autorização
    const authHeader = request.headers.get('authorization');
    const isAuthorized =
      authHeader === `Bearer ${process.env.CRON_SECRET}` ||
      authHeader?.startsWith('Bearer '); // Token de cliente

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { client_id } = body;

    if (!client_id) {
      return NextResponse.json(
        { error: 'client_id is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // ========================================================================
    // 1. BUSCAR CONFIGURAÇÕES DO CLIENTE
    // ========================================================================

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // ========================================================================
    // 2. BUSCAR DADOS DE GA4
    // ========================================================================

    let ga4Data = null;
    try {
      const { data: ga4Config } = await supabase
        .from('client_ga4_properties')
        .select('*')
        .eq('client_id', client_id)
        .single();

      if (ga4Config && ga4Config.access_token) {
        const ga4Client = new GA4Client(
          ga4Config.property_id,
          ga4Config.access_token
        );
        ga4Data = await ga4Client.getWeeklyData();
      }
    } catch (error) {
      console.error('[Weekly Report] GA4 fetch error:', error);
      // Continua mesmo sem GA4
    }

    // ========================================================================
    // 3. BUSCAR DADOS DE LOCAL FALCON
    // ========================================================================

    let rankingData = null;
    try {
      const lfClient = new LocalFalconClient();
      rankingData = await lfClient.getWeeklyData(client.google_business_profile_id);
    } catch (error) {
      console.error('[Weekly Report] LocalFalcon fetch error:', error);
      // Continua mesmo sem Local Falcon
    }

    // ========================================================================
    // 4. BUSCAR DADOS DE GBP INSIGHTS
    // ========================================================================

    let gbpData = null;
    try {
      const { data: gbpInsights } = await supabase
        .from('client_gbp_insights')
        .select('*')
        .eq('client_id', client_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (gbpInsights) {
        gbpData = gbpInsights.metrics;
      }
    } catch (error) {
      console.error('[Weekly Report] GBP insights fetch error:', error);
      // Continua mesmo sem GBP
    }

    // ========================================================================
    // 5. GERAR INSIGHTS COM CLAUDE
    // ========================================================================

    const insightRequest: InsightRequest = {
      client_name: client.name,
      client_nicho: client.industry || 'not specified',
      ga4_data: ga4Data,
      ranking_data: rankingData,
      gbp_data: gbpData,
    };

    const insights = await generateInsightsWithClaude(insightRequest);

    // ========================================================================
    // 6. MONTAR RELATÓRIO COMPLETO
    // ========================================================================

    const reportData: WeeklyReportData = {
      client_id,
      agency_id: client.agency_id,
      period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
      generated_at: new Date().toISOString(),
      ga4_data: ga4Data,
      ranking_data: rankingData,
      gbp_data: gbpData,
      insights: insights.insights,
      next_actions: insights.next_actions,
      data_quality: {
        ga4_available: !!ga4Data,
        ranking_available: !!rankingData,
        gbp_available: !!gbpData,
      },
    };

    // ========================================================================
    // 7. GERAR HTML + TEXTO
    // ========================================================================

    const htmlContent = generateReportHTML(client.name, reportData);
    const textContent = generateReportText(client.name, reportData);

    // ========================================================================
    // 8. SALVAR NO BANCO
    // ========================================================================

    const { data: savedReport, error: saveError } = await supabase
      .from('weekly_reports')
      .insert({
        client_id,
        agency_id: client.agency_id,
        period_start: reportData.period_start,
        period_end: reportData.period_end,
        data: reportData,
        html_content: htmlContent,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('[Weekly Report] Save error:', saveError);
      return NextResponse.json(
        { error: 'Failed to save report' },
        { status: 500 }
      );
    }

    // ========================================================================
    // 9. ENVIAR EMAIL (OPCIONAL - pode ficar pra depois)
    // ========================================================================

    // TODO: Implementar envio de email aqui
    // Por enquanto, só salvamos no banco

    // ========================================================================
    // SUCESSO
    // ========================================================================

    return NextResponse.json({
      success: true,
      message: 'Weekly report generated and saved',
      report_id: savedReport.id,
      period: `${reportData.period_start} a ${reportData.period_end}`,
      data_quality: reportData.data_quality,
    });
  } catch (error: any) {
    console.error('[Weekly Report]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Gera insights usando Claude
 */
async function generateInsightsWithClaude(
  request: InsightRequest
): Promise<{
  insights: Array<{ type: string; title: string; description: string; metric: string; value: string | number; impact: string }>;
  next_actions: Array<{ action: string; reason: string; priority: string; effort: string; estimated_impact: string }>;
}> {
  try {
    const prompt = `
You are a Google Business Profile optimization expert. Analyze the following data and generate insights and actionable recommendations.

CLIENT: ${request.client_name}
INDUSTRY: ${request.client_nicho}

GA4 DATA (Last 7 days):
${
  request.ga4_data
    ? `
- Total Users: ${request.ga4_data.total_users}
- Total Sessions: ${request.ga4_data.total_sessions}
- Total Page Views: ${request.ga4_data.total_page_views}
- Avg Session Duration: ${request.ga4_data.avg_session_duration}s
- Bounce Rate: ${request.ga4_data.bounce_rate}%
- Top Sources: ${request.ga4_data.sources
        .map((s) => `${s.source} (${s.users} users)`)
        .join(', ')}
`
    : 'No GA4 data available'
}

RANKING DATA (Local Falcon):
${
  request.ranking_data
    ? `
- Total Keywords Tracked: ${request.ranking_data.total_keywords_tracked}
- Keywords in Top 3: ${request.ranking_data.top_3_positions}
- Keywords in Top 5: ${request.ranking_data.top_5_positions}
- Keywords in Top 10: ${request.ranking_data.top_10_positions}
- Top Cities: ${request.ranking_data.cities
        .map((c) => `${c.city} (#${c.avg_position.toFixed(1)})`)
        .join(', ')}
`
    : 'No ranking data available'
}

GBP DATA:
${
  request.gbp_data
    ? `
- Profile Views: ${request.gbp_data.profile_views}
- Phone Calls: ${request.gbp_data.phone_calls}
- Messages: ${request.gbp_data.messages_received}
- New Reviews: ${request.gbp_data.new_reviews}
- Average Rating: ${request.gbp_data.average_rating}
`
    : 'No GBP data available'
}

TASK:
Generate 3-5 insights (mix of positive, concerns, opportunities) and 3-5 actionable recommendations.

Format your response as JSON:
{
  "insights": [
    {
      "type": "positive" | "concern" | "opportunity",
      "title": "Short title",
      "description": "Brief description",
      "metric": "Metric name",
      "value": "Metric value",
      "impact": "high" | "medium" | "low"
    }
  ],
  "next_actions": [
    {
      "action": "Specific action to take",
      "reason": "Why this matters",
      "priority": "high" | "medium" | "low",
      "effort": "low" | "medium" | "high",
      "estimated_impact": "Expected impact description"
    }
  ]
}

Be concise and practical. Focus on actionable insights relevant to local SEO and GBP optimization.
    `;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extrai JSON da resposta
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Claude] No JSON found in response:', content.text);
      return {
        insights: [],
        next_actions: [],
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      insights: parsed.insights || [],
      next_actions: parsed.next_actions || [],
    };
  } catch (error) {
    console.error('[Claude Insights] Error:', error);
    return {
      insights: [],
      next_actions: [],
    };
  }
}
