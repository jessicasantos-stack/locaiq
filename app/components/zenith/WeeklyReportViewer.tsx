'use client';

import { useEffect, useState } from 'react';
import { WeeklyReportData } from '@/app/types/reports';
import { getTrendEmoji } from '@/app/utils/localfalcon';

interface WeeklyReportViewerProps {
  clientId: string;
  clientName: string;
}

export default function WeeklyReportViewer({
  clientId,
  clientName,
}: WeeklyReportViewerProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<WeeklyReportData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [clientId]);

  async function fetchReports() {
    try {
      const response = await fetch(
        `/api/reports/weekly?client_id=${clientId}&limit=12`
      );
      const json = await response.json();

      if (json.success) {
        setReports(json.data);
        if (json.data.length > 0) {
          setSelectedReport(json.data[0].data);
        }
      } else {
        setError(json.error || 'Failed to fetch reports');
      }
    } catch (err) {
      setError('Failed to fetch reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Carregando relatórios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Nenhum relatório disponível ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de Relatórios */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Últimos Relatórios</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.slice(0, 6).map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.data)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedReport?.period_start === report.period_start
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-semibold text-gray-900">
                {report.period_start}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                a {report.period_end}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {new Date(report.created_at).toLocaleDateString('pt-BR')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Relatório Detalhado */}
      {selectedReport && <ReportDetails data={selectedReport} />}
    </div>
  );
}

/**
 * Componente para mostrar detalhes do relatório
 */
function ReportDetails({ data }: { data: WeeklyReportData }) {
  const ga4 = data.ga4_data;
  const ranking = data.ranking_data;
  const gbp = data.gbp_data;

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          📊 Relatório Semanal
        </h2>
        <p className="text-gray-500 text-sm mt-2">
          {data.period_start} a {data.period_end}
        </p>
      </div>

      {/* Métricas Principais */}
      {ga4 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">🔍 Tráfego (GA4)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Visitantes"
              value={ga4.total_users.toLocaleString()}
            />
            <MetricCard
              label="Sessões"
              value={ga4.total_sessions.toLocaleString()}
            />
            <MetricCard
              label="Visualizações"
              value={ga4.total_page_views.toLocaleString()}
            />
            <MetricCard
              label="Taxa Rejeição"
              value={`${ga4.bounce_rate.toFixed(1)}%`}
            />
          </div>

          {/* Fontes */}
          {ga4.sources.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Origem do Tráfego
              </h4>
              <div className="space-y-2">
                {ga4.sources
                  .sort((a, b) => b.users - a.users)
                  .map((source) => (
                    <div
                      key={source.source}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <span className="font-medium text-gray-700">
                        {source.source.charAt(0).toUpperCase() +
                          source.source.slice(1)}
                      </span>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {source.users.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {source.sessions} sessões
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ranking */}
      {ranking && ranking.cities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">🗺️ Ranqueamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ranking.cities.map((city) => (
              <div key={city.city} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900">
                    {getTrendEmoji(city.trend)} {city.city}
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    #{city.avg_position.toFixed(1)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-green-100 text-green-800 p-2 rounded text-center">
                    <div className="font-bold">🥇</div>
                    <div>{city.top_3_count}</div>
                  </div>
                  <div className="bg-blue-100 text-blue-800 p-2 rounded text-center">
                    <div className="font-bold">🥈</div>
                    <div>{city.top_5_count}</div>
                  </div>
                  <div className="bg-yellow-100 text-yellow-800 p-2 rounded text-center">
                    <div className="font-bold">🥉</div>
                    <div>{city.top_10_count}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GBP */}
      {gbp && (
        <div>
          <h3 className="text-lg font-semibold mb-4">📍 Google Business Profile</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Visualizações"
              value={gbp.profile_views || 0}
            />
            <MetricCard label="Chamadas" value={gbp.phone_calls || 0} />
            <MetricCard label="Mensagens" value={gbp.messages_received || 0} />
            <MetricCard label="Novos Reviews" value={gbp.new_reviews || 0} />
          </div>
        </div>
      )}

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">💡 Insights</h3>
          <div className="space-y-3">
            {data.insights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'positive'
                    ? 'bg-green-50 border-l-green-500'
                    : insight.type === 'concern'
                    ? 'bg-yellow-50 border-l-yellow-500'
                    : 'bg-blue-50 border-l-blue-500'
                }`}
              >
                <div className="font-semibold text-gray-900">
                  {insight.title}
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  {insight.description}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {insight.metric}: {insight.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximas Ações */}
      {data.next_actions && data.next_actions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">🎯 Próximas Ações</h3>
          <div className="space-y-3">
            {data.next_actions.map((action, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold text-white ${
                      action.priority === 'high'
                        ? 'bg-red-500'
                        : action.priority === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-gray-500'
                    }`}
                  >
                    {action.priority.toUpperCase()}
                  </span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {action.action}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {action.reason}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Card de métrica
 */
function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="text-xs text-gray-500 uppercase font-semibold">
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900 mt-2">{value}</div>
    </div>
  );
}
