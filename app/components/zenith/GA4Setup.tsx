'use client';

import { useState } from 'react';
import { useUser } from '@/components/zenith/contexts/UserContext';

interface GA4SetupProps {
  clientId: string;
  onSuccess?: () => void;
}

export default function GA4Setup({ clientId, onSuccess }: GA4SetupProps) {
  const { user } = useUser();
  const [step, setStep] = useState<'connect' | 'property' | 'success'>('connect');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState('');

  async function handleConnect() {
    setLoading(true);
    setError(null);

    try {
      // Redirecionar pra Google OAuth
      const redirectUri = `${window.location.origin}/api/ga4/callback`;
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const scopes = [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/analytics',
      ].join(' ');

      const params = new URLSearchParams({
        client_id: clientId || '',
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes,
        access_type: 'offline',
        prompt: 'consent',
      });

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } catch (err) {
      setError('Falha ao conectar com Google');
      setLoading(false);
    }
  }

  async function handlePropertyId() {
    if (!propertyId.trim()) {
      setError('Google Analytics property ID é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ga4/property-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          property_id: propertyId,
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Falha ao salvar property ID');
      }

      setStep('success');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        📊 Conectar Google Analytics 4
      </h2>

      {step === 'connect' && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Conecte sua conta Google para ativar dados de visitantes e comportamento do site.
          </p>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-900">
              ℹ️ Você será redirecionado para Google. Autorize acesso ao Google Analytics.
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Conectando...' : 'Conectar com Google'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}
        </div>
      )}

      {step === 'property' && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Qual é seu Google Analytics 4 Property ID?
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Property ID (Formato: 123456789)
            </label>
            <input
              type="text"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="123456789"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              Encontre em: Google Analytics → Admin → Property → Property ID
            </p>
          </div>

          <button
            onClick={handlePropertyId}
            disabled={loading || !propertyId.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Confirmar Property ID'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}
        </div>
      )}

      {step === 'success' && (
        <div className="text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h3 className="text-xl font-semibold text-green-700">
            Google Analytics Conectado!
          </h3>
          <p className="text-gray-600">
            Seus dados de GA4 serão inclusos no próximo relatório semanal.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
}
