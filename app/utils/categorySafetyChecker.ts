/**
 * Category Safety Checker
 * Valida categorias contra diretrizes do Google
 * Previne suspensão de perfis
 */

interface CategoryValidation {
  category: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  recommendation: 'safe' | 'caution' | 'not_recommended' | 'forbidden';
  notes: string;
}

// ============================================================================
// MATRIZ DE RISCO POR INDÚSTRIA
// ============================================================================

const INDUSTRY_RISK_MATRIX: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
  // CRÍTICO - Alta regulação + spam histórico
  locksmith: 'critical',
  'garage door': 'critical',
  dentist: 'critical',
  lawyer: 'critical',
  'financial advisor': 'critical',
  plumber: 'high',
  'hvac technician': 'high',
  electrician: 'high',
  'home services': 'high',
  pest_control: 'medium',
  landscaping: 'medium',
  'real estate': 'medium',
  retail: 'low',
  restaurant: 'low',
  salon: 'low',
};

// ============================================================================
// CATEGORIAS QUE CAUSAM SUSPENSÃO (NÃO USAR)
// ============================================================================

const FORBIDDEN_COMBINATIONS: Record<string, string[]> = {
  plumber: ['locksmith', 'electrician', 'home general contractor'],
  locksmith: ['plumber', 'door repair', 'hardware store'],
  dentist: ['orthodontist', 'general practitioner', 'physician'],
};

// ============================================================================
// VALIDADOR PRINCIPAL
// ============================================================================

export class CategorySafetyChecker {
  /**
   * Valida UMA categoria
   */
  static validateCategory(
    category: string,
    industry: string,
    isSecondary: boolean = false
  ): CategoryValidation {
    const reasons: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let recommendation: 'safe' | 'caution' | 'not_recommended' | 'forbidden' =
      'safe';
    let notes = '';

    // 1. Verificar se categoria é genérica demais
    if (this.isGenericCategory(category)) {
      reasons.push('Categoria muito genérica (parece keyword stuffing)');
      riskLevel = 'high';
      recommendation = 'not_recommended';
    }

    // 2. Verificar indústria de alto risco
    const industryRisk = INDUSTRY_RISK_MATRIX[industry.toLowerCase()] || 'low';
    if (industryRisk === 'critical') {
      reasons.push(`Indústria "${industry}" recebe alto scrutíny do Google`);
      riskLevel = industryRisk;
      if (recommendation === 'safe') recommendation = 'caution';
    }

    // 3. Verificar combinações proibidas
    if (FORBIDDEN_COMBINATIONS[industry.toLowerCase()]?.includes(category.toLowerCase())) {
      reasons.push(
        `Categoria "${category}" se parece com negócio diferente (risco de confusão)`
      );
      riskLevel = 'critical';
      recommendation = 'forbidden';
      notes = 'Não adicione essa categoria - pode resultar em suspensão';
    }

    // 4. Verificar se é secundária (menos risco)
    if (isSecondary && recommendation === 'caution' && riskLevel !== 'critical') {
      recommendation = 'safe';
      notes =
        'Como categoria secundária, é relativamente segura. Não adicione mais.';
    }

    // 5. Verificar comprimento (keywords muito longas são suspeitas)
    if (category.length > 50) {
      reasons.push('Categoria muito longa (parece keyword)');
      if (riskLevel !== 'critical') riskLevel = 'medium';
    }

    return {
      category,
      riskLevel,
      reasons,
      recommendation,
      notes,
    };
  }

  /**
   * Valida MÚLTIPLAS categorias (detecta category stuffing)
   */
  static validateCategorySet(
    categories: string[],
    industry: string,
    primaryCategory: string
  ): {
    valid: boolean;
    validations: CategoryValidation[];
    stuffing_detected: boolean;
    warning: string | null;
  } {
    // Limite máximo: 1 primária + 9 secundárias
    if (categories.length > 10) {
      return {
        valid: false,
        validations: [],
        stuffing_detected: true,
        warning: `⚠️ SUSPENSÃO IMINENTE: ${categories.length} categorias. Google permite máx 10 (1 primária + 9 secundárias)`,
      };
    }

    // Validar cada uma
    const validations = categories.map((cat, idx) =>
      this.validateCategory(cat, industry, idx > 0)
    );

    // Verificar se há muitas "caution" ou "high risk"
    const riskCount = validations.filter(
      (v) => v.riskLevel === 'high' || v.riskLevel === 'critical'
    ).length;

    if (riskCount >= 3) {
      return {
        valid: false,
        validations,
        stuffing_detected: true,
        warning: `⚠️ Risco de suspensão: ${riskCount} categorias de alto risco. Remova pelo menos 2.`,
      };
    }

    // Verificar duplicatas
    const unique = new Set(categories.map((c) => c.toLowerCase()));
    if (unique.size < categories.length) {
      return {
        valid: false,
        validations,
        stuffing_detected: true,
        warning: '❌ Categorias duplicadas encontradas. Remove duplicatas.',
      };
    }

    // Verificar se todas as categorias estão relacionadas ao negócio
    const unrelatd = validations.filter((v) => v.recommendation === 'forbidden');
    if (unrelatd.length > 0) {
      return {
        valid: false,
        validations,
        stuffing_detected: true,
        warning: `❌ ${unrelatd.length} categoria(s) proibida(s) encontrada(s).`,
      };
    }

    return {
      valid: true,
      validations,
      stuffing_detected: false,
      warning: null,
    };
  }

  /**
   * Detecta padrões de category stuffing
   */
  static detectStuffing(categories: string[]): {
    isStuffing: boolean;
    score: number; // 0-100
    indicators: string[];
  } {
    const indicators: string[] = [];
    let score = 0;

    // 1. Muitas categorias
    if (categories.length > 5) {
      indicators.push('Mais de 5 categorias');
      score += 25;
    }

    // 2. Categorias genéricas
    const genericCount = categories.filter((c) => this.isGenericCategory(c))
      .length;
    if (genericCount > 0) {
      indicators.push(`${genericCount} categoria(s) genérica(s)`);
      score += 20;
    }

    // 3. Categorias muito longas (parecem keywords)
    const longCount = categories.filter((c) => c.length > 40).length;
    if (longCount > 0) {
      indicators.push(`${longCount} categoria(s) muito longa(s)`);
      score += 15;
    }

    // 4. Muitos keywords em uma
    const keywordCount = categories.filter((c) => c.split(' ').length > 3)
      .length;
    if (keywordCount > 0) {
      indicators.push(`${keywordCount} categoria(s) com muitas palavras`);
      score += 15;
    }

    return {
      isStuffing: score > 50,
      score: Math.min(score, 100),
      indicators,
    };
  }

  /**
   * Checa se categoria é genérica demais
   */
  private static isGenericCategory(category: string): boolean {
    const generic = [
      'service',
      'services',
      'business',
      'company',
      'general',
      'shop',
      'store',
      'repair',
      'home services',
    ];
    return generic.includes(category.toLowerCase());
  }
}

// ============================================================================
// HELPER: Recomendação Segura
// ============================================================================

export function getSafeRecommendation(
  currentCategories: string[],
  suggestedCategory: string,
  industry: string
): {
  canAdd: boolean;
  reason: string;
  suggestedAlternative?: string;
} {
  // 1. Checar limite (máx 10)
  if (currentCategories.length >= 10) {
    return {
      canAdd: false,
      reason: 'Já tem 10 categorias (limite máximo). Remova uma antes de adicionar.',
    };
  }

  // 2. Validar a categoria sugerida
  const validation = CategorySafetyChecker.validateCategory(
    suggestedCategory,
    industry,
    true
  );

  if (validation.recommendation === 'forbidden') {
    return {
      canAdd: false,
      reason: `Essa categoria é muito arriscada: ${validation.reasons.join(', ')}`,
    };
  }

  if (validation.recommendation === 'not_recommended') {
    return {
      canAdd: false,
      reason: `Não recomendado: ${validation.reasons.join(', ')}`,
    };
  }

  // 3. Checar se não vai criar stuffing
  const testSet = [...currentCategories, suggestedCategory];
  const stuffingCheck = CategorySafetyChecker.detectStuffing(testSet);

  if (stuffingCheck.isStuffing && stuffingCheck.score > 70) {
    return {
      canAdd: false,
      reason: `Risco de suspensão (stuffing score: ${stuffingCheck.score}%). ${stuffingCheck.indicators.join(', ')}`,
    };
  }

  // OK pra adicionar
  return {
    canAdd: true,
    reason: validation.recommendation === 'caution'
      ? `✅ Seguro adicionar. Cuidado: monitore por 30 dias.`
      : `✅ Seguro adicionar.`,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export const categorySafety = CategorySafetyChecker;
