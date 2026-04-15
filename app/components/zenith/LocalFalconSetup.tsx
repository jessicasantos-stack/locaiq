'use client';

import { useState } from 'react';

interface LocalFalconSetupProps {
  clientId: string;
  onSuccess?: () => void;
}

export default function LocalFalconSetup({
  clientId,
  onSuccess,
}: LocalFalconSetupProps) {
  const [gbpId, setGbpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    if (!gbpId.trim()) {
      setError('Google Business Profile ID é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/localfalcon/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          google_business_profile_id: gbpId,
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Falha ao salvar');
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h3 className="text-xl font-semibold text-green-700">
          Local Falcon Configurado!
        </h3>
        <p className="text-gray-600">
          Seus rankings serão rastreados a partir de agora.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        🗺️ Conectar Local Falcon
      </h2>

      <div className="space-y-4">
        <p className="text-gray-600">
          Rastreie seu ranqueamento por cidade e keywords.
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Google Business Profile ID
          </label>
          <input
            type="text"
            value={gbpId}
            onChange={(e) => setGbpId(e.target.value)}
            placeholder="Seu GBP ID aqui"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500">
            Encontre em: Google Business Profile → URL (após accounts/...)
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-blue-900">
            📍 Sem Local Falcon? Use apenas o Google Business Profile ID. Os
            dados serão rastreados automaticamente.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !gbpId.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar e Começar'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
