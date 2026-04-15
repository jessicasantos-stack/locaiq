'use client';

import { useState } from 'react';
import { generatePromptForClient } from '@/app/utils/promptTemplates';
import { categorySafety, getSafeRecommendation } from '@/app/utils/categorySafetyChecker';

interface GBPAnalysisModuleProps {
  clientId: string;
  clientName: string;
  clientIndustry: string;
  clientServices: string[];
  clientCities: string[];
  clientCompetitors: string[];
}

const ANALYSIS_TYPES = [
  { id: 'categories', name: '📂 Categorias', description: 'Audit de categorias' },
  { id: 'attributes', name: '🏷️ Atributos', description: 'Badges recomendados' },
  { id: 'reviews', name: '⭐ Avaliações', description: 'Estratégia de reviews' },
  { id: 'posts', name: '📝 Posts', description: 'Calendário de 8 semanas' },
  { id: 'services', name: '🛠️ Serviços', description: 'Descrições otimizadas' },
  { id: 'about', name: '📋 Apresentação', description: '3 variações de texto' },
  { id: 'photos', name: '📸 Fotos', description: 'Plano de 8 semanas' },
  { id: 'score', name: '💯 Score GBP', description: 'Pontuação total' },
];

export default function GBPAnalysisModule({
  clientId,
  clientName,
  clientIndustry,
  clientServices,
  clientCities,
  clientCompetitors,
}: GBPAnalysisModuleProps) {
  const [selectedType, setSelectedType] = useState<string>('categories');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Gerar prompt customizado
      const context = {
        name: clientName,
        industry: clientIndustry,
        services: clientServices,
        cities: clientCities,
        competitors: clientCompetitors,
      };

      const prompt = generatePromptForClient(selectedType, context);

      // Chamar Claude API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          analysis_type: selectedType,
          prompt,
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Falha na análise');
      }

      const json = await response.json();
      setResult(json.result);
    } catch (err: any) {
      setError(err.message || 'Erro ao analisar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Seleção de Análise */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📊 Análise GBP
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {ANALYSIS_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id);
                setResult(null);
              }}
              className={`p-3 rounded-lg text-left transition-all ${
                selectedType === type.id
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-sm">{type.name}</div>
              <div className="text-xs text-gray-600 mt-1">
                {type.description}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Analisando...' : '▶️ Analisar'}
        </button>
      </div>

      {/* Resultado */}
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resultado
          </h3>

          {typeof result === 'string' ? (
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {result}
            </div>
          ) : (
            <div className="space-y-4">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>

              {/* Botões de Ação */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Copy to clipboard
                    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                    alert('Copiado para clipboard!');
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  📋 Copiar
                </button>

                <button
                  onClick={() => {
                    // Download como JSON
                    const element = document.createElement('a');
                    element.setAttribute(
                      'href',
                      'data:text/plain;charset=utf-8,' +
                        encodeURIComponent(JSON.stringify(result, null, 2))
                    );
                    element.setAttribute('download', `${selectedType}-${clientName}.json`);
                    element.style.display = 'none';
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  💾 Download
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Info */}
      {!result && !error && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-900">
          💡 Selecione um tipo de análise e clique em "Analisar" para obter
          recomendações personalizadas.
        </div>
      )}
    </div>
  );
}
