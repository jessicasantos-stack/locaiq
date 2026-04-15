/**
 * Google Analytics 4 Utilities
 * Puxa dados de GA4 via Google Analytics Data API
 */

import { GA4WeeklyReport, GA4DailyMetrics, GA4Source } from '@/app/types/reports';

// ============================================================================
// GA4 API CLIENT
// ============================================================================

export class GA4Client {
  private propertyId: string;
  private accessToken: string;

  constructor(propertyId: string, accessToken: string) {
    this.propertyId = propertyId;
    this.accessToken = accessToken;
  }

  /**
   * Puxa dados de GA4 dos últimos 7 dias
   */
  async getWeeklyData(endDate?: string): Promise<GA4WeeklyReport | null> {
    try {
      const end = endDate ? new Date(endDate) : new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 7);

      const endStr = end.toISOString().split('T')[0];
      const startStr = start.toISOString().split('T')[0];

      // Busca métricas principais
      const metrics = await this.fetchMetrics(startStr, endStr);
      if (!metrics) return null;

      // Busca dados por fonte
      const sources = await this.fetchSources(startStr, endStr);

      // Busca eventos customizados
      const events = await this.fetchEvents(startStr, endStr);

      // Busca dados diários
      const dailyData = await this.fetchDailyData(startStr, endStr);

      return {
        period_start: startStr,
        period_end: endStr,
        total_users: metrics.users || 0,
        total_sessions: metrics.sessions || 0,
        total_page_views: metrics.pageViews || 0,
        avg_session_duration: metrics.avgSessionDuration || 0,
        bounce_rate: metrics.bounceRate || 0,
        conversion_rate: metrics.conversionRate || 0,
        sources: sources,
        top_events: events.slice(0, 10),
        daily_data: dailyData,
      };
    } catch (error) {
      console.error('[GA4] Error fetching weekly data:', error);
      return null;
    }
  }

  /**
   * Métricas principais
   */
  private async fetchMetrics(
    startDate: string,
    endDate: string
  ): Promise<Record<string, any> | null> {
    try {
      const response = await fetch(
        'https://analyticsdata.googleapis.com/v1beta/properties/' +
        this.propertyId +
        ':runReport',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateRanges: [{ startDate, endDate }],
            metrics: [
              { name: 'activeUsers' },
              { name: 'sessions' },
              { name: 'screenPageViews' },
              { name: 'averageSessionDuration' },
              { name: 'bounceRate' },
            ],
          }),
        }
      );

      if (!response.ok) {
        console.error('[GA4] Metrics fetch failed:', response.statusText);
        return null;
      }

      const data = await response.json();
      if (!data.rows || data.rows.length === 0) return null;

      const row = data.rows[0];
      return {
        users: parseInt(row.metricValues[0].value) || 0,
        sessions: parseInt(row.metricValues[1].value) || 0,
        pageViews: parseInt(row.metricValues[2].value) || 0,
        avgSessionDuration: parseFloat(row.metricValues[3].value) || 0,
        bounceRate: parseFloat(row.metricValues[4].value) || 0,
        conversionRate: 0, // Calculado depois se houver conversões
      };
    } catch (error) {
      console.error('[GA4] fetchMetrics error:', error);
      return null;
    }
  }

  /**
   * Dados por fonte (GBP, Organic, Direct, Paid)
   */
  private async fetchSources(
    startDate: string,
    endDate: string
  ): Promise<GA4Source[]> {
    try {
      const response = await fetch(
        'https://analyticsdata.googleapis.com/v1beta/properties/' +
        this.propertyId +
        ':runReport',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'sessionSource' }],
            metrics: [
              { name: 'activeUsers' },
              { name: 'sessions' },
              { name: 'conversions' },
            ],
          }),
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      if (!data.rows) return [];

      return data.rows.map((row: any) => {
        let source = row.dimensionValues[0].value.toLowerCase();
        // Mapear nomes customizados
        if (source.includes('google') || source === 'google') source = 'google';
        if (source === 'direct') source = 'direct';
        if (source === 'organic') source = 'organic';

        return {
          source,
          users: parseInt(row.metricValues[0].value) || 0,
          sessions: parseInt(row.metricValues[1].value) || 0,
          conversion_count: parseInt(row.metricValues[2].value) || 0,
          events: {},
        };
      });
    } catch (error) {
      console.error('[GA4] fetchSources error:', error);
      return [];
    }
  }

  /**
   * Eventos customizados (calls, messages, form submissions)
   */
  private async fetchEvents(
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    try {
      const response = await fetch(
        'https://analyticsdata.googleapis.com/v1beta/properties/' +
        this.propertyId +
        ':runReport',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'eventName' }],
            metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
            orderBys: [
              {
                metric: { metricName: 'eventCount' },
                desc: true,
              },
            ],
            limit: 20,
          }),
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      if (!data.rows) return [];

      return data.rows.map((row: any) => ({
        event_name: row.dimensionValues[0].value,
        event_count: parseInt(row.metricValues[0].value) || 0,
        users: parseInt(row.metricValues[1].value) || 0,
      }));
    } catch (error) {
      console.error('[GA4] fetchEvents error:', error);
      return [];
    }
  }

  /**
   * Dados diários (para gráfico)
   */
  private async fetchDailyData(
    startDate: string,
    endDate: string
  ): Promise<GA4DailyMetrics[]> {
    try {
      const response = await fetch(
        'https://analyticsdata.googleapis.com/v1beta/properties/' +
        this.propertyId +
        ':runReport',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'date' }],
            metrics: [
              { name: 'activeUsers' },
              { name: 'sessions' },
              { name: 'screenPageViews' },
              { name: 'engagedSessions' },
              { name: 'eventCount' },
            ],
          }),
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      if (!data.rows) return [];

      return data.rows.map((row: any) => ({
        date: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value) || 0,
        sessions: parseInt(row.metricValues[1].value) || 0,
        pageViews: parseInt(row.metricValues[2].value) || 0,
        engagedSessions: parseInt(row.metricValues[3].value) || 0,
        eventCount: parseInt(row.metricValues[4].value) || 0,
        events: [],
      }));
    } catch (error) {
      console.error('[GA4] fetchDailyData error:', error);
      return [];
    }
  }

  /**
   * Valida token (refresh se necessário)
   */
  async validateToken(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }).toString(),
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('[GA4] Token validation error:', error);
      return null;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formata número com 2 casas decimais
 */
export function formatNumber(num: number): string {
  return num.toFixed(2);
}

/**
 * Calcula % de mudança
 */
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Formata % de mudança
 */
export function formatChangePercentage(change: number): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}
