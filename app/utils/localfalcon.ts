/**
 * Local Falcon API Utilities
 * Rastreia rankings de keywords por cidade
 * API Key: 4360a78a104ad6632172e5a3c04b2461
 */

import {
  LocalFalconRanking,
  LocalFalconHeatmap,
  LocalFalconWeeklyData,
} from '@/app/types/reports';

const LOCAL_FALCON_API_KEY = process.env.LOCAL_FALCON_API_KEY || '4360a78a104ad6632172e5a3c04b2461';
const LOCAL_FALCON_BASE_URL = 'https://api.localfalcon.com/v1';

// ============================================================================
// LOCAL FALCON CLIENT
// ============================================================================

export class LocalFalconClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || LOCAL_FALCON_API_KEY;
  }

  /**
   * Puxa dados de rankings da última semana
   */
  async getWeeklyData(
    googleBusinessProfileId: string
  ): Promise<LocalFalconWeeklyData | null> {
    try {
      // Busca histórico da última semana
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      // Puxa rankings por cidade
      const rankings = await this.getRankingsByCity(googleBusinessProfileId);
      if (!rankings) return null;

      // Gera heatmap
      const heatmaps = this.generateHeatmaps(rankings);

      // Identifica trending
      const trendingUp = this.getTrendingUp(rankings);
      const trendingDown = this.getTrendingDown(rankings);

      return {
        period_start: startStr,
        period_end: endStr,
        total_keywords_tracked: rankings.length,
        top_3_positions: rankings.filter((r) => r.position <= 3).length,
        top_5_positions: rankings.filter((r) => r.position <= 5).length,
        top_10_positions: rankings.filter((r) => r.position <= 10).length,
        cities: heatmaps,
        trending_up: trendingUp,
        trending_down: trendingDown,
      };
    } catch (error) {
      console.error('[LocalFalcon] Error fetching weekly data:', error);
      return null;
    }
  }

  /**
   * Puxa rankings por cidade
   */
  private async getRankingsByCity(
    googleBusinessProfileId: string
  ): Promise<LocalFalconRanking[]> {
    try {
      const response = await fetch(
        `${LOCAL_FALCON_BASE_URL}/rankings/${googleBusinessProfileId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('[LocalFalcon] Rankings fetch failed:', response.statusText);
        return [];
      }

      const data = await response.json();
      if (!data.rankings) return [];

      return data.rankings.map((ranking: any) => ({
        city: ranking.city,
        keyword: ranking.keyword,
        position: ranking.position,
        url: ranking.url,
        tracked_date: ranking.date,
      }));
    } catch (error) {
      console.error('[LocalFalcon] getRankingsByCity error:', error);
      return [];
    }
  }

  /**
   * Gera heatmap por cidade
   */
  private generateHeatmaps(rankings: LocalFalconRanking[]): LocalFalconHeatmap[] {
    const cityMap = new Map<string, LocalFalconRanking[]>();

    // Agrupa por cidade
    rankings.forEach((ranking) => {
      if (!cityMap.has(ranking.city)) {
        cityMap.set(ranking.city, []);
      }
      cityMap.get(ranking.city)!.push(ranking);
    });

    // Gera heatmap por cidade
    return Array.from(cityMap.entries()).map(([city, cityRankings]) => {
      const top3 = cityRankings.filter((r) => r.position <= 3).length;
      const top5 = cityRankings.filter((r) => r.position <= 5).length;
      const top10 = cityRankings.filter((r) => r.position <= 10).length;

      // Calcula posição média
      const avgPosition =
        cityRankings.reduce((sum, r) => sum + r.position, 0) / cityRankings.length;

      // Determina trend (simplificado - com dados históricos seria mais preciso)
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (top3 > 5) trend = 'up'; // Se muitos keywords em top 3
      if (avgPosition > 15) trend = 'down'; // Se posição média é alta (ruim)

      return {
        city,
        avg_position: Math.round(avgPosition * 100) / 100,
        top_3_count: top3,
        top_5_count: top5,
        top_10_count: top10,
        trend,
        change_percentage: 0, // Requer comparação com período anterior
      };
    });
  }

  /**
   * Keywords tendendo para cima
   */
  private getTrendingUp(rankings: LocalFalconRanking[]): LocalFalconRanking[] {
    // Simplificado: retorna keywords em top 3
    // Com dados históricos, calcularia mudança de posição
    return rankings
      .filter((r) => r.position <= 3)
      .sort((a, b) => a.position - b.position)
      .slice(0, 5);
  }

  /**
   * Keywords tendendo para baixo
   */
  private getTrendingDown(rankings: LocalFalconRanking[]): LocalFalconRanking[] {
    // Simplificado: retorna keywords fora top 10
    // Com dados históricos, calcularia queda de posição
    return rankings
      .filter((r) => r.position > 10)
      .sort((a, b) => b.position - a.position)
      .slice(0, 5);
  }

  /**
   * Puxa histórico de rankings (para calcular trends)
   */
  async getRankingHistory(
    googleBusinessProfileId: string,
    days: number = 30
  ): Promise<LocalFalconRanking[][]> {
    try {
      const response = await fetch(
        `${LOCAL_FALCON_BASE_URL}/rankings/${googleBusinessProfileId}/history`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ days }),
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      if (!data.history) return [];

      return data.history.map((day: any) =>
        day.rankings.map((ranking: any) => ({
          city: ranking.city,
          keyword: ranking.keyword,
          position: ranking.position,
          url: ranking.url,
          tracked_date: day.date,
        }))
      );
    } catch (error) {
      console.error('[LocalFalcon] getRankingHistory error:', error);
      return [];
    }
  }

  /**
   * Calcula mudança de posição (semana anterior vs atual)
   */
  calculatePositionChange(
    currentRankings: LocalFalconRanking[],
    previousRankings: LocalFalconRanking[]
  ): Map<string, number> {
    const changes = new Map<string, number>();

    currentRankings.forEach((current) => {
      const key = `${current.city}|${current.keyword}`;
      const previous = previousRankings.find(
        (r) => r.city === current.city && r.keyword === current.keyword
      );

      if (previous) {
        // Posição anterior - posição atual
        // Negativo = subiu, Positivo = caiu
        changes.set(key, previous.position - current.position);
      }
    });

    return changes;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Mapeia posição para cor de heatmap
 */
export function getPositionColor(position: number): string {
  if (position <= 3) return '#10b981'; // verde (top 3)
  if (position <= 5) return '#06b6d4'; // azul (top 5)
  if (position <= 10) return '#f59e0b'; // amarelo (top 10)
  return '#ef4444'; // vermelho (fora top 10)
}

/**
 * Formata posição com qualificador
 */
export function formatPosition(position: number): string {
  if (position <= 3) return `🥇 #${position}`;
  if (position <= 5) return `🥈 #${position}`;
  if (position <= 10) return `🥉 #${position}`;
  return `#${position}`;
}

/**
 * Determina trend emoji
 */
export function getTrendEmoji(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return '📈';
    case 'down':
      return '📉';
    default:
      return '➡️';
  }
}
