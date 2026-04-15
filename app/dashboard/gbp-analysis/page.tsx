'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/zenith/contexts/UserContext';
import GBPAnalysisModule from '@/components/zenith/GBPAnalysisModule';

export default function GBPAnalysisPage() {
  const router = useRouter();
  const { user, selectedClient, loading } = useUser();

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
            📊 Análise de GBP
          </h1>
          <p className="text-gray-600 mt-2">
            {selectedClient.name} — {selectedClient.industry || 'Serviço local'}
          </p>
        </div>

        {/* Main Analysis */}
        <GBPAnalysisModule
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          clientIndustry={selectedClient.industry || 'unknown'}
          clientServices={selectedClient.services || []}
          clientCities={selectedClient.cities || []}
          clientCompetitors={selectedClient.competitors || []}
        />

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sobre */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ℹ️ Como Funciona
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                ✅ Selecione um tipo de análise (Categorias, Atributos, etc)
              </p>
              <p>✅ Clique em "Analisar" para gerar recomendações com IA</p>
              <p>✅ Receba análise customizada para seu negócio</p>
              <p>✅ Implemente as recomendações no seu GBP</p>
              <p>✅ Veja resultados no próximo relatório semanal</p>
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">
              🔐 Segurança Garantida
            </h3>
            <div className="space-y-3 text-sm text-green-800">
              <p>
                ✅ Todas as recomendações seguem diretrizes oficiais do Google
              </p>
              <p>
                ✅ Sistema detecta risco de suspensão automaticamente
              </p>
              <p>
                ✅ Category Stuffing previne categoria excessiva
              </p>
              <p>
                ✅ Auditoria completa de todas as mudanças
              </p>
              <p>✅ Log de compliance para controle total</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🔗 Ações Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/dashboard/settings/reports"
              className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-blue-600"
            >
              <p className="font-semibold text-gray-900">⚙️ Configurar Relatórios</p>
              <p className="text-sm text-gray-600 mt-1">
                Defina dia, hora e emails
              </p>
            </a>

            <a
              href="/dashboard/reports"
              className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-green-600"
            >
              <p className="font-semibold text-gray-900">📊 Ver Relatórios</p>
              <p className="text-sm text-gray-600 mt-1">
                Histórico de semanas anteriores
              </p>
            </a>

            <a
              href="/dashboard"
              className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-purple-600"
            >
              <p className="font-semibold text-gray-900">📈 Score do Perfil</p>
              <p className="text-sm text-gray-600 mt-1">
                Veja sua pontuação total
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
