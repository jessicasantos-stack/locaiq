/**
 * Prompt Templates (Parametrizados)
 * 20 prompts pra análise de GBP, site, links, conteúdo
 * Auto-carregam dados do cliente
 */

interface ClientContext {
  name: string;
  industry: string;
  services: string[];
  cities: string[];
  competitors: string[]; // URLs do GBP dos concorrentes
}

// ============================================================================
// PARTE 1: GBP (Prompts 1-8)
// ============================================================================

export const GBP_PROMPTS = {
  // 1. Categorias
  categories: (context: ClientContext) => `
Você é um especialista em SEO Local. Analise as categorias do Google Business Profile.

CLIENTE: ${context.name}
INDÚSTRIA: ${context.industry}
SERVIÇOS: ${context.services.join(', ')}
CIDADES: ${context.cities.join(', ')}

TAREFA:
1. Identifique as categorias PRIMÁRIAS que ${context.name} deve ter
2. Sugira categorias SECUNDÁRIAS (máx 5) que aumentam visibilidade
3. Priorize por impacto no ranqueamento
4. Avise sobre RISCOS de suspensão (evitar category stuffing)

FORMATO DE RESPOSTA:
{
  "primary_category": "...",
  "secondary_categories": [
    { "category": "...", "impact": "alto/médio/baixo", "risk_level": "baixo/médio/alto" }
  ],
  "warnings": ["..."]
}
  `,

  // 2. Atributos
  attributes: (context: ClientContext) => `
Você é um especialista em otimização de Google Business Profile.

CLIENTE: ${context.name}
SERVIÇOS: ${context.services.join(', ')}

TAREFA:
Sugira atributos (badges) que ${context.name} deve adicionar. Exemplos:
- "Empresa Veterana" (se operando há +5 anos)
- "Orçamentos Gratuitos"
- "Oferece Agendamento Online"
- "Disponível 24h"
- "Aceita Cartão de Crédito"
- "Estacionamento Gratuito"

RESPONDA:
1. Top 5 atributos recomendados
2. Por que cada um importa
3. Impacto estimado no CTR

FORMATO:
{
  "recommended": [
    { "attribute": "...", "reason": "...", "ctr_impact": "alto/médio/baixo" }
  ]
}
  `,

  // 3. Avaliações (ritmo + keywords)
  reviews: (context: ClientContext) => `
Você é especialista em gestão de avaliações no Google.

CLIENTE: ${context.name}
INDÚSTRIA: ${context.industry}

TAREFA:
1. Defina META DE AVALIAÇÕES por mês (baseado na indústria)
2. Identifique palavras-chave que clientes deveriam mencionar
3. Sugira estratégia pra aumentar frequência

EXEMPLO:
- Meta: 8 reviews/mês (competitivo pra ${context.industry})
- Palavras-chave: "profissional", "rápido", "atencioso", "excelente"
- Estratégia: SMS pós-serviço + email automático

RESPONDA:
{
  "monthly_goal": X,
  "target_keywords": ["...", "..."],
  "strategy": "..."
}
  `,

  // 4. Posts (Calendário 8 semanas)
  posts: (context: ClientContext) => `
Você é especialista em conteúdo pra GBP.

CLIENTE: ${context.name}
SERVIÇOS: ${context.services.join(', ')}
CIDADES: ${context.cities.join(', ')}

TAREFA:
Crie calendário de 8 semanas de posts pro GBP:
- 2-3 posts por semana
- Misture: promoções, antes/depois, destaques de reviews, educativo, sazonal
- Inclua cidades específicas em cada post
- Mention palavras-chave naturalmente

FORMATO (exemplo):
Semana 1 / Seg:
- Tipo: "Antes/Depois"
- Tema: Trabalho concluído em [CIDADE]
- Título: "Transformação completa no [BAIRRO] - Veja o resultado!"
- CTA: "Solicite orçamento agora"

RESPONDA COM 8 SEMANAS COMPLETAS:
{
  "week_1": { "monday": {...}, "wednesday": {...}, "friday": {...} },
  ...
}
  `,

  // 5. Descrições de Serviços
  services: (context: ClientContext) => `
Você é especialista em descrições de serviços pro GBP.

CLIENTE: ${context.name}
SERVIÇOS: ${context.services.join(', ')}

TAREFA:
Para CADA serviço listado:
1. Escreva descrição de 40-60 palavras
2. Inclua palavras-chave naturalmente
3. Mencione 1-2 cidades
4. Destaque 1 benefício específico

EXEMPLO:
"Encanamento de Emergência no Tatuapé. Equipe disponível 24/7, chegamos em 15 min.
Especializados em vazamentos, entupimentos e manutenção. Garantia de 1 ano."

RESPONDA:
{
  "serviço_name": "descrição otimizada aqui..."
}
  `,

  // 6. Texto de Apresentação (3 variações)
  about: (context: ClientContext) => `
Você é especialista em textos de apresentação do GBP.

CLIENTE: ${context.name}
INDÚSTRIA: ${context.industry}
CIDADES: ${context.cities.join(', ')}

Escreva 3 variações de 750 caracteres cada:
1. Versão 1: Focada em PALAVRAS-CHAVE + SEO
2. Versão 2: Focada em CONFIANÇA + Credibilidade
3. Versão 3: Focada em AÇÃO + CTA

Cada deve incluir anos de experiência, cidades, e diferencial.

RESPONDA:
{
  "version_1_seo": "...",
  "version_2_trust": "...",
  "version_3_action": "..."
}
  `,

  // 7. Plano de Fotos (8 semanas)
  photos: (context: ClientContext) => `
Você é especialista em estratégia de fotos no GBP.

CLIENTE: ${context.name}
SERVIÇOS: ${context.services.join(', ')}

TAREFA:
Crie plano de 8 semanas pra publicar 4 fotos/semana:
- Semana 1: Equipe + fachada
- Semana 2: Projetos concluídos (antes/depois)
- Semana 3: Equipe em ação + clientes satisfeitos
- Semana 4: Equipamentos/Recursos
- E assim por diante...

Cada foto precisa:
- Nome customizado (com keywords + cidade)
- Geotag (localização)
- Descrição (alt text)

RESPONDA:
{
  "week_1": {
    "photo_1": { "type": "team", "filename": "equipe-zenith-tatuape.jpg", "geotag": "Tatuapé, SP", "alt": "..." }
  }
}
  `,

  // 8. Score GBP (Calculadora)
  score: (context: ClientContext) => `
Você é especialista em otimização de GBP.

Calcule um SCORE de 0-100 para ${context.name} baseado em:
- Categorias: 1 primária + 9 secundárias = 20 pontos
- Atributos: 5-8 atributos = 15 pontos
- Reviews: Meta de 8/mês vs realidade = 20 pontos
- Posts: 2-3 posts/semana = 15 pontos
- Fotos: 4+ fotos/semana = 15 pontos
- Descrição de Serviços: 100% completa = 10 pontos
- Texto de Apresentação: Otimizado = 5 pontos

RESPONDA:
{
  "total_score": X/100,
  "breakdown": { "categories": X, "attributes": X, ... },
  "priorities": ["...", "..."] // Top 3 ações imediatas
}
  `,
};

// ============================================================================
// PARTE 2: SITE (Prompts 9-13)
// ============================================================================

export const SITE_PROMPTS = {
  // 9. GAP de Keywords
  keywordGap: (context: ClientContext) => `
Você é especialista em SEO.

CLIENTE: ${context.name}
INDÚSTRIA: ${context.industry}
CIDADES: ${context.cities.join(', ')}

TAREFA:
Identifique o GAP de keywords. Quais buscas os CONCORRENTES ranqueiam mas ${context.name} NÃO?

Priorize por:
1. Volume de busca (100-2000/mês)
2. Dificuldade baixa (< 40)
3. Intenção de compra alta
4. Relevância local

RESPONDA:
{
  "gaps": [
    { "keyword": "...", "volume": X, "difficulty": X, "opportunity_score": X }
  ]
}
  `,

  // 10. Páginas Quase Rankeando
  almostRanking: (context: ClientContext) => `
Você é especialista em SEO técnico.

CLIENTE: ${context.name}

TAREFA:
Identifique páginas que estão PERTO de rankear (posições 4-15):
1. Quais são?
2. Que mudanças simples as colocam no top 3?
3. Tempo estimado pra resultado

Mudanças simples:
- Title tag otimizado
- H1 com keyword
- Primeiras 100 palavras com keyword
- Meta description clara

RESPONDA:
{
  "pages": [
    { "url": "...", "keyword": "...", "current_position": X, "simple_fix": "..." }
  ]
}
  `,

  // 11. Estrutura de Páginas por Cidade
  cityPages: (context: ClientContext) => `
Você é especialista em SEO local.

CLIENTE: ${context.name} (opera em ${context.cities.join(', ')})

TAREFA:
Crie estrutura de páginas por CIDADE:
- /serviços/[cidade]/[serviço]
- Cada página com:
  * Keyword: "serviço em cidade"
  * Localização específica (bairros)
  * Números locais (reviews, tempo de atendimento)
  * CTA local

RESPONDA:
{
  "structure": "/serviços/[cidade]/[serviço]",
  "example_pages": ["..."]
}
  `,

  // 12. GSC Deep Dive (Mina de Ouro)
  gscMine: (context: ClientContext) => `
Você é especialista em Search Console.

TAREFA:
Identifique "mina de ouro" no Google Search Console:
- Palavras que ranqueiam posição 11-20 com +100 impressões
- Páginas com alto volume mas baixo CTR

RESPONDA:
{
  "golden_keywords": [
    { "keyword": "...", "position": X, "impressions": X, "page": "..." }
  ],
  "quick_wins": ["..."]
}
  `,

  // 13. Conteúdo Faltando
  contentGaps: (context: ClientContext) => `
Você é especialista em conteúdo.

CLIENTE: ${context.name}

TAREFA:
Identifique 20 tópicos de CONTEÚDO que faltam:
- Perguntas que clientes fazem
- Problemas que resolvem
- Educativo + SEO

Categorize:
- Consciência do problema
- Comparação de soluções
- Conteúdo de serviço local

RESPONDA:
{
  "awareness": [
    { "topic": "...", "keyword": "...", "word_count": 500 }
  ],
  "consideration": [...],
  "decision": [...]
}
  `,
};

// ============================================================================
// PARTE 3: LINKS + ENTIDADE (Prompts 14-16)
// ============================================================================

export const LINK_PROMPTS = {
  // 14. Estratégia de Links
  linkStrategy: (context: ClientContext) => `
Você é especialista em construção de links.

CLIENTE: ${context.name}

TAREFA:
Estratégia de links para 90 dias:
- Mês 1: Links fáceis (diretórios, citações)
- Mês 2: Links médios (imprensa local, guest posts)
- Mês 3: Links de autoridade

RESPONDA:
{
  "month_1": ["tipo1", "tipo2", ...],
  "month_2": [...],
  "month_3": [...]
}
  `,

  // 15. Inconsistências NAP
  nap: (context: ClientContext) => `
Você é especialista em consistência de dados.

TAREFA:
Identifique inconsistências de NAP (Name, Address, Phone):
- Google Business Profile
- Site
- Diretórios
- Social Media

Priorize por impacto em ranking local.

RESPONDA:
{
  "inconsistencies": [
    { "platform": "...", "field": "...", "current": "...", "should_be": "..." }
  ]
}
  `,

  // 16. Jornada do Comprador
  buyerJourney: (context: ClientContext) => `
Você é especialista em intenção de busca.

TAREFA:
Mapeie keywords na jornada do comprador:
- Estágio 1: Problema inconsciente
- Estágio 2: Problema consciente
- Estágio 3: Solução consciente
- Estágio 4: Pronto para contratar

Identifique keywords em cada estágio e conteúdo pra cada.

RESPONDA:
{
  "stage_1": { "keywords": [...], "content": "..." },
  "stage_2": {...},
  "stage_3": {...},
  "stage_4": {...}
}
  `,
};

// ============================================================================
// HELPER: Combina todos os prompts
// ============================================================================

export function getAllPrompts() {
  return {
    ...GBP_PROMPTS,
    ...SITE_PROMPTS,
    ...LINK_PROMPTS,
  };
}

/**
 * Gera prompt customizado pra um cliente
 */
export function generatePromptForClient(
  promptKey: string,
  context: ClientContext
): string {
  const allPrompts = getAllPrompts();
  const promptTemplate = (allPrompts as any)[promptKey];

  if (!promptTemplate) {
    throw new Error(`Prompt não encontrado: ${promptKey}`);
  }

  if (typeof promptTemplate === 'function') {
    return promptTemplate(context);
  }

  return promptTemplate;
}
