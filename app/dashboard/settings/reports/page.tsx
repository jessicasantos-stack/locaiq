'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/zenith/contexts/UserContext';
import ReportConfiguration from '@/components/zenith/ReportConfiguration';
import GA4Setup from '@/components/zenith/GA4Setup';
import LocalFalconSetup from '@/components/zenith/LocalFalconSetup';

export default function ReportSettingsPage() {
  const router = useRouter();
  const { user, selectedClient, loading } = useUser();
  const [activeTab, setActiveTab] = useState<'reports' | 'ga4' | 'localfalcon'>(
    'reports'
  );
  const [ga4Connected, setGA4Connected] = useState(false);
  const [lfConnected, setLFConnected] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user || !selectedClient) {
    return <div className="p-6 text-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            ⚙️ Configurações de Relatórios
          </h1>
          <p className="text-gray-600 mt-2">
            {selectedClient.name} — Configure seu sistema de relatórios semanal
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            className={`p-4 rounded-lg border-2 ${
              ga4Connected
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  📊 Google Analytics 4
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {ga4Connected ? 'Conectado' : 'Não conectado'}
                </p>
              </div>
              {ga4Connected && <span className="text-2xl">✅</span>}
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border-2 ${
              lfConnected
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  🗺️ Local Falcon
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {lfConnected ? 'Configurado' : 'Não configurado'}
                </p>
              </div>
              {lfConnected && <span className="text-2xl">✅</span>}
            </div>
          </div>

          <div className="p-4 rounded-lg border-2 bg-gray-50 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  📧 Relatório Semanal
                </p>
                <p className="text-xs text-gray-500 mt-1">Configure aqui</p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'reports'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📧 Relatórios
            </button>
            <button
              onClick={() => setActiveTab('ga4')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'ga4'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Google Analytics 4
            </button>
            <button
              onClick={() => setActiveTab('localfalcon')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'localfalcon'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🗺️ Local Falcon
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'reports' && (
            <ReportConfiguration
              clientId={selectedClient.id}
              onSuccess={() => console.log('Relatório configurado')}
            />
          )}

          {activeTab === 'ga4' && (
            <GA4Setup
              clientId={selectedClient.id}
              onSuccess={() => {
                setGA4Connected(true);
                setActiveTab('reports');
              }}
            />
          )}

          {activeTab === 'localfalcon' && (
            <LocalFalconSetup
              clientId={selectedClient.id}
              onSuccess={() => {
                setLFConnected(true);
                setActiveTab('reports');
              }}
            />
          )}
        </div>

        {/* Help Section */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            💡 Como Funciona
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-800">
            <div>
              <p className="font-semibold mb-2">1️⃣ Conectar GA4</p>
              <p>
                Autorize acesso ao Google Analytics 4 pra rastrear visitantes e
                comportamento.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">2️⃣ Configurar Local Falcon</p>
              <p>
                Adicione seu Google Business Profile ID pra rastrear rankings
                por cidade.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">3️⃣ Definir Relatório</p>
              <p>
                Escolha dia, hora e emails. Receba relatório automático toda
                semana.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
