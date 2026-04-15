'use client';

import { useState, useEffect } from 'react';
import { ReportConfiguration as ReportConfig } from '@/app/types/reports';

interface ReportConfigurationProps {
  clientId: string;
  onSuccess?: () => void;
}

const DAYS = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00`,
}));

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (EST/EDT)' },
  { value: 'America/Chicago', label: 'Central (CST/CDT)' },
  { value: 'America/Denver', label: 'Mountain (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PST/PDT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKST/AKDT)' },
  { value: 'America/Sao_Paulo', label: 'Brazil (BRT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
];

export default function ReportConfiguration({
  clientId,
  onSuccess,
}: ReportConfigurationProps) {
  const [config, setConfig] = useState<ReportConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    frequency: 'weekly' as const,
    day: 'friday',
    hour: 9,
    timezone: 'America/New_York',
    email_recipients: [] as string[],
    include_ga4: true,
    include_ranking: true,
    include_gbp: true,
    include_insights: true,
  });

  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    fetchConfig();
  }, [clientId]);

  async function fetchConfig() {
    try {
      const response = await fetch(
        `/api/reports/settings?client_id=${clientId}`
      );
      const json = await response.json();

      if (json.success && json.data) {
        const cfg = json.data;
        setFormData({
          frequency: cfg.frequency || 'weekly',
          day: cfg.day || 'friday',
          hour: cfg.hour_utc || 9,
          timezone: cfg.timezone || 'America/New_York',
          email_recipients: cfg.email_recipients || [],
          include_ga4: cfg.include_ga4 !== false,
          include_ranking: cfg.include_ranking !== false,
          include_gbp: cfg.include_gbp !== false,
          include_insights: cfg.include_insights !== false,
        });
        setConfig(cfg);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (formData.email_recipients.length === 0) {
      setError('Adicione pelo menos 1 email');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/reports/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Falha ao salvar');
      }

      setSuccess(true);
      onSuccess?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendNow() {
    try {
      const response = await fetch('/api/reports/generate-weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      });

      if (!response.ok) throw new Error('Falha ao gerar relatório');

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar');
    }
  }

  function addEmail() {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setError('Email inválido');
      return;
    }

    if (formData.email_recipients.includes(newEmail.toLowerCase())) {
      setError('Email já adicionado');
      return;
    }

    setFormData({
      ...formData,
      email_recipients: [
        ...formData.email_recipients,
        newEmail.toLowerCase(),
      ],
    });
    setNewEmail('');
    setError(null);
  }

  function removeEmail(email: string) {
    setFormData({
      ...formData,
      email_recipients: formData.email_recipients.filter((e) => e !== email),
    });
  }

  if (loading) {
    return <div className="p-6 text-center">Carregando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        ⚙️ Configuração de Relatórios
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Frequência */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frequência
          </label>
          <select
            value={formData.frequency}
            onChange={(e) =>
              setFormData({ ...formData, frequency: e.target.value as any })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="weekly">Semanal</option>
            <option value="biweekly">Quinzenal</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>

        {/* Dia da Semana */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dia da Semana
          </label>
          <select
            value={formData.day}
            onChange={(e) => setFormData({ ...formData, day: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Horário */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horário (UTC)
          </label>
          <select
            value={formData.hour}
            onChange={(e) =>
              setFormData({ ...formData, hour: parseInt(e.target.value) })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={formData.timezone}
            onChange={(e) =>
              setFormData({ ...formData, timezone: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Seções do Relatório */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Incluir no Relatório
        </h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.include_ga4}
              onChange={(e) =>
                setFormData({ ...formData, include_ga4: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="ml-3 text-gray-700">📊 Google Analytics</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.include_ranking}
              onChange={(e) =>
                setFormData({ ...formData, include_ranking: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="ml-3 text-gray-700">🗺️ Ranking por Cidade</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.include_gbp}
              onChange={(e) =>
                setFormData({ ...formData, include_gbp: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="ml-3 text-gray-700">📍 Google Business Profile</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.include_insights}
              onChange={(e) =>
                setFormData({ ...formData, include_insights: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="ml-3 text-gray-700">💡 Insights (IA)</span>
          </label>
        </div>
      </div>

      {/* Emails */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Destinatários do Email
        </h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="seu@email.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addEmail()}
            />
            <button
              onClick={addEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Adicionar
            </button>
          </div>

          <div className="space-y-2">
            {formData.email_recipients.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <span className="text-gray-700">{email}</span>
                <button
                  onClick={() => removeEmail(email)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Erros */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Sucesso */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
          ✅ Configuração salva com sucesso!
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 border-t pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </button>
        <button
          onClick={handleSendNow}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          📧 Enviar Agora (Teste)
        </button>
      </div>
    </div>
  );
}
