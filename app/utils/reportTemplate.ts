/**
 * Template HTML para Relatório Semanal
 * GA4 + Local Falcon + GBP Insights
 */

import { WeeklyReportData } from '@/app/types/reports';
import { getTrendEmoji, getPositionColor } from './localfalcon';

export function generateReportHTML(
  clientName: string,
  data: WeeklyReportData
): string {
  const ga4 = data.ga4_data;
  const ranking = data.ranking_data;
  const gbp = data.gbp_data;
  const insights = data.insights;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Semanal - ${clientName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f9fafb;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
    }

    .header {
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      color: #1f2937;
      font-size: 28px;
      margin-bottom: 8px;
    }

    .header p {
      color: #6b7280;
      font-size: 14px;
    }

    .period {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 30px 0;
    }

    @media (max-width: 600px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }

    .metric-card {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }

    .metric-card.positive {
      border-left-color: #10b981;
    }

    .metric-card.warning {
      border-left-color: #f59e0b;
    }

    .metric-card.danger {
      border-left-color: #ef4444;
    }

    .metric-label {
      color: #6b7280;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .metric-value {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .metric-change {
      font-size: 12px;
      color: #6b7280;
    }

    .section {
      margin: 40px 0;
      border-top: 1px solid #e5e7eb;
      padding-top: 30px;
    }

    .section h2 {
      color: #1f2937;
      font-size: 18px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .heatmap {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
      margin: 20px 0;
    }

    .heatmap-cell {
      padding: 15px;
      border-radius: 6px;
      color: white;
      text-align: center;
      font-weight: 600;
      font-size: 12px;
    }

    .insight-item {
      padding: 15px;
      margin: 10px 0;
      border-radius: 6px;
      background: #f0fdf4;
      border-left: 4px solid #10b981;
    }

    .insight-item.concern {
      background: #fef3c7;
      border-left-color: #f59e0b;
    }

    .insight-item.opportunity {
      background: #dbeafe;
      border-left-color: #3b82f6;
    }

    .insight-title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .insight-desc {
      color: #6b7280;
      font-size: 14px;
    }

    .action-list {
      list-style: none;
      margin: 20px 0;
    }

    .action-list li {
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      gap: 12px;
    }

    .action-list li:last-child {
      border-bottom: none;
    }

    .action-badge {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      min-width: 50px;
      text-align: center;
    }

    .action-badge.high {
      background: #ef4444;
    }

    .action-badge.medium {
      background: #f59e0b;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }

    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }

    @media (max-width: 600px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }

    table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }

    table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    .cta-button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- HEADER -->
    <div class="header">
      <h1>📊 Relatório Semanal</h1>
      <p>${clientName}</p>
      <span class="period">${data.period_start} a ${data.period_end}</span>
    </div>

    <!-- METRICS PRINCIPAIS -->
    ${ga4 ? `
    <div class="metrics-grid">
      <div class="metric-card positive">
        <div class="metric-label">👥 Visitantes Únicos</div>
        <div class="metric-value">${ga4.total_users.toLocaleString()}</div>
        <div class="metric-change">+0% vs semana anterior</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">🎯 Sessões</div>
        <div class="metric-value">${ga4.total_sessions.toLocaleString()}</div>
        <div class="metric-change">Duração média: ${ga4.avg_session_duration.toFixed(1)}s</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">📄 Visualizações</div>
        <div class="metric-value">${ga4.total_page_views.toLocaleString()}</div>
        <div class="metric-change">Taxa de rejeição: ${ga4.bounce_rate.toFixed(1)}%</div>
      </div>

      ${gbp ? `
      <div class="metric-card">
        <div class="metric-label">📱 Ações GBP</div>
        <div class="metric-value">${(gbp.phone_calls || 0) + (gbp.messages_received || 0)}</div>
        <div class="metric-change">Chamadas: ${gbp.phone_calls || 0} | Mensagens: ${gbp.messages_received || 0}</div>
      </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- GA4: FONTES -->
    ${ga4 && ga4.sources.length > 0 ? `
    <div class="section">
      <h2>🔍 Origem do Tráfego</h2>
      <table>
        <thead>
          <tr>
            <th>Fonte</th>
            <th>Visitantes</th>
            <th>Sessões</th>
            <th>Conversões</th>
          </tr>
        </thead>
        <tbody>
          ${ga4.sources
            .sort((a, b) => b.users - a.users)
            .map(
              (source) => `
            <tr>
              <td><strong>${source.source.charAt(0).toUpperCase() + source.source.slice(1)}</strong></td>
              <td>${source.users.toLocaleString()}</td>
              <td>${source.sessions.toLocaleString()}</td>
              <td>${source.conversion_count || 0}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <!-- LOCAL FALCON: RANKING HEATMAP -->
    ${ranking && ranking.cities.length > 0 ? `
    <div class="section">
      <h2>🗺️ Ranqueamento por Cidade</h2>
      <div class="grid-2">
        ${ranking.cities
          .map(
            (city) => `
          <div style="padding: 15px; background: #f3f4f6; border-radius: 6px;">
            <div style="font-weight: 600; color: #1f2937; margin-bottom: 10px;">
              ${getTrendEmoji(city.trend)} ${city.city}
            </div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 8px;">
              #${city.avg_position.toFixed(1)}
            </div>
            <div style="color: #6b7280; font-size: 12px;">
              🥇 Top 3: ${city.top_3_count} keywords<br>
              🥈 Top 5: ${city.top_5_count} keywords<br>
              🥉 Top 10: ${city.top_10_count} keywords
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
    ` : ''}

    <!-- GBP: MÉTRICAS -->
    ${gbp ? `
    <div class="section">
      <h2>📍 Google Business Profile</h2>
      <div class="grid-2">
        <div class="metric-card">
          <div class="metric-label">👁️ Visualizações do Perfil</div>
          <div class="metric-value">${gbp.profile_views || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">⭐ Novos Reviews</div>
          <div class="metric-value">${gbp.new_reviews || 0}</div>
          <div style="color: #f59e0b; font-weight: 600;">Rating: ${gbp.average_rating?.toFixed(1) || 'N/A'}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">📞 Chamadas</div>
          <div class="metric-value">${gbp.phone_calls || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">💬 Mensagens</div>
          <div class="metric-value">${gbp.messages_received || 0}</div>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- INSIGHTS -->
    ${insights && insights.length > 0 ? `
    <div class="section">
      <h2>💡 Insights da Semana</h2>
      ${insights
        .map(
          (insight) => `
        <div class="insight-item ${insight.type === 'concern' ? 'concern' : insight.type === 'opportunity' ? 'opportunity' : ''}">
          <div class="insight-title">${insight.title}</div>
          <div class="insight-desc">${insight.description}</div>
          <div style="margin-top: 8px; color: #6b7280; font-size: 12px;">
            <strong>${insight.metric}:</strong> ${insight.value}
          </div>
        </div>
      `
        )
        .join('')}
    </div>
    ` : ''}

    <!-- PRÓXIMAS AÇÕES -->
    ${data.next_actions && data.next_actions.length > 0 ? `
    <div class="section">
      <h2>🎯 Próximas Ações Sugeridas</h2>
      <ul class="action-list">
        ${data.next_actions
          .sort((a, b) => {
            const priorityMap = { high: 0, medium: 1, low: 2 };
            return priorityMap[a.priority] - priorityMap[b.priority];
          })
          .map(
            (action) => `
          <li>
            <span class="action-badge ${action.priority}">${action.priority.toUpperCase()}</span>
            <div>
              <div style="font-weight: 600; color: #1f2937;">${action.action}</div>
              <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">
                ${action.reason}
              </div>
            </div>
          </li>
        `
          )
          .join('')}
      </ul>
    </div>
    ` : ''}

    <!-- FOOTER -->
    <div class="footer">
      <p>Relatório gerado automaticamente pelo <strong>Zenith</strong> em ${new Date().toLocaleDateString('pt-BR')}</p>
      <p style="margin-top: 8px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zenith.local'}/dashboard">
          Ver detalhes completos no dashboard
        </a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Remove tags HTML para texto plano (se necessário)
 */
export function generateReportText(clientName: string, data: WeeklyReportData): string {
  const lines: string[] = [];

  lines.push(`RELATÓRIO SEMANAL - ${clientName.toUpperCase()}`);
  lines.push(`Período: ${data.period_start} a ${data.period_end}`);
  lines.push('');

  if (data.ga4_data) {
    lines.push('📊 TRÁFEGO (GA4)');
    lines.push(`  Visitantes: ${data.ga4_data.total_users.toLocaleString()}`);
    lines.push(`  Sessões: ${data.ga4_data.total_sessions.toLocaleString()}`);
    lines.push(`  Visualizações: ${data.ga4_data.total_page_views.toLocaleString()}`);
    lines.push('');
  }

  if (data.ranking_data) {
    lines.push('🗺️ RANQUEAMENTO');
    lines.push(`  Total de keywords rastreadas: ${data.ranking_data.total_keywords_tracked}`);
    lines.push(`  Top 3: ${data.ranking_data.top_3_positions}`);
    lines.push(`  Top 5: ${data.ranking_data.top_5_positions}`);
    lines.push(`  Top 10: ${data.ranking_data.top_10_positions}`);
    lines.push('');
  }

  if (data.gbp_data) {
    lines.push('📍 GOOGLE BUSINESS PROFILE');
    lines.push(`  Visualizações: ${data.gbp_data.profile_views || 0}`);
    lines.push(`  Chamadas: ${data.gbp_data.phone_calls || 0}`);
    lines.push(`  Mensagens: ${data.gbp_data.messages_received || 0}`);
    lines.push(`  Novos Reviews: ${data.gbp_data.new_reviews || 0}`);
    lines.push('');
  }

  if (data.insights && data.insights.length > 0) {
    lines.push('💡 INSIGHTS');
    data.insights.forEach((insight) => {
      lines.push(`  • ${insight.title}: ${insight.description}`);
    });
    lines.push('');
  }

  if (data.next_actions && data.next_actions.length > 0) {
    lines.push('🎯 PRÓXIMAS AÇÕES');
    data.next_actions.forEach((action) => {
      lines.push(`  [${action.priority.toUpperCase()}] ${action.action}`);
    });
  }

  return lines.join('\n');
}
