/**
 * Types para Sistema de Relatórios Semanal/Mensal
 * GA4 + Local Falcon + GBP Insights
 */

// ============================================================================
// GA4 TYPES
// ============================================================================

export interface GA4Config {
  client_id: string;
  property_id: string;
  access_token: string;
  refresh_token: string;
  created_at: string;
  updated_at: string;
}

export interface GA4DailyMetrics {
  date: string;
  users: number;
  sessions: number;
  pageViews: number;
  engagedSessions: number;
  eventCount: number;
  events: GA4Event[];
}

export interface GA4Event {
  event_name: string;
  event_count: number;
  users: number;
  source?: string; // organic, direct, referral, paid, gbp
  medium?: string;
}

export interface GA4WeeklyReport {
  period_start: string;
  period_end: string;
  total_users: number;
  total_sessions: number;
  total_page_views: number;
  avg_session_duration: number;
  bounce_rate: number;
  conversion_rate: number;
  sources: GA4Source[];
  top_events: GA4Event[];
  daily_data: GA4DailyMetrics[];
}

export interface GA4Source {
  source: string; // 'google', 'direct', 'referral', etc
  users: number;
  sessions: number;
  conversion_count: number;
  events: Record<string, number>;
}

// ============================================================================
// LOCAL FALCON TYPES
// ============================================================================

export interface LocalFalconRanking {
  city: string;
  keyword: string;
  position: number;
  url?: string;
  tracked_date: string;
}

export interface LocalFalconHeatmap {
  city: string;
  avg_position: number;
  top_3_count: number; // # de keywords no top 3
  top_5_count: number;
  top_10_count: number;
  trend: 'up' | 'down' | 'stable';
  change_percentage: number;
}

export interface LocalFalconWeeklyData {
  period_start: string;
  period_end: string;
  total_keywords_tracked: number;
  top_3_positions: number;
  top_5_positions: number;
  top_10_positions: number;
  cities: LocalFalconHeatmap[];
  trending_up: LocalFalconRanking[];
  trending_down: LocalFalconRanking[];
}

// ============================================================================
// GBP INSIGHTS TYPES
// ============================================================================

export interface GBPWeeklyMetrics {
  profile_views: number;
  profile_views_change_percentage: number;
  discovery_searches: number; // busca discovery (não branded)
  discovery_searches_change_percentage: number;
  direction_requests: number; // pedidos de rota
  direction_requests_change_percentage: number;
  website_clicks: number;
  phone_calls: number;
  messages_received: number;
  new_reviews: number;
  average_rating: number;
  photo_views: number;
}

// ============================================================================
// WEEKLY REPORT MASTER TYPE
// ============================================================================

export interface WeeklyReportData {
  // Meta
  client_id: string;
  agency_id: string;
  period_start: string;
  period_end: string;
  generated_at: string;

  // GA4
  ga4_data: GA4WeeklyReport | null;

  // Local Falcon
  ranking_data: LocalFalconWeeklyData | null;

  // GBP
  gbp_data: GBPWeeklyMetrics | null;

  // Insights + Recommendations
  insights: WeeklyInsight[];
  next_actions: NextAction[];

  // Metadata
  data_quality: {
    ga4_available: boolean;
    ranking_available: boolean;
    gbp_available: boolean;
  };
}

export interface WeeklyInsight {
  type: 'positive' | 'concern' | 'opportunity';
  title: string;
  description: string;
  metric: string;
  value: string | number;
  impact: 'high' | 'medium' | 'low';
}

export interface NextAction {
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  estimated_impact: string;
}

// ============================================================================
// REPORT CONFIGURATION
// ============================================================================

export interface ReportConfiguration {
  client_id: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  hour: number; // 0-23
  timezone: string; // e.g., 'America/New_York'
  email_recipients: string[];
  include_sections: {
    ga4: boolean;
    ranking: boolean;
    gbp: boolean;
    insights: boolean;
  };
  created_at: string;
  updated_at: string;
}

// ============================================================================
// REPORT HISTORY
// ============================================================================

export interface ReportRecord {
  id: string;
  client_id: string;
  agency_id: string;
  period_start: string;
  period_end: string;
  data: WeeklyReportData;
  html_content: string;
  pdf_url?: string;
  email_sent_at?: string;
  email_recipients?: string[];
  created_at: string;
}

// ============================================================================
// AI INSIGHTS TYPE (Para Claude)
// ============================================================================

export interface InsightRequest {
  client_name: string;
  client_nicho: string;
  ga4_data: GA4WeeklyReport | null;
  ranking_data: LocalFalconWeeklyData | null;
  gbp_data: GBPWeeklyMetrics | null;
  previous_week_data?: WeeklyReportData;
  client_goals?: string;
}

export interface InsightResponse {
  insights: WeeklyInsight[];
  next_actions: NextAction[];
  summary: string;
}
