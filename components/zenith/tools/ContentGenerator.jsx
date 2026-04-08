"use client";
import { useState, useMemo } from "react";
import { C } from "../constants/colors";
import { Card, Badge, Btn } from "../shared";
import { callClaude } from "../utils/ai";

// ─── Content Types ──────────────────────────────────────────
const CONTENT_TYPES = [
  { id: "post", label: "Google Post", icon: "📢", desc: "GBP-optimized post with CTA" },
  { id: "description", label: "GBP Description", icon: "◎", desc: "Semantic description with 4 layers" },
  { id: "reviewtpl", label: "Review Responses", icon: "⭐", desc: "AI review response templates" },
  { id: "schema", label: "Schema.org", icon: "</>", desc: "Ready-made LocalBusiness JSON-LD" },
  { id: "calendar", label: "Calendar", icon: "◷", desc: "Weekly content suggestions" },
];

const NICHE_TEMPLATES = {
  "Home Renovation Contractor": { topics: ["before/after projects", "seasonal home maintenance tips", "customer transformation stories", "materials guide", "permit requirements"], cta: "Get a Free Estimate", seasonal: { spring: "Spring renovation season", summer: "Beat the heat with new siding", fall: "Winterize your home", winter: "Plan your spring remodel" } },
  "Dentist": { topics: ["oral health tips", "new technology/equipment", "patient success stories", "insurance/financing info", "seasonal checkup reminders"], cta: "Book Your Appointment", seasonal: { spring: "Spring cleaning for your smile", summer: "Back-to-school dental checkups", fall: "Halloween candy dental tips", winter: "New year, new smile goals" } },
  "HVAC Contractor": { topics: ["energy saving tips", "maintenance reminders", "system upgrade benefits", "indoor air quality", "emergency preparedness"], cta: "Schedule Service", seasonal: { spring: "AC tune-up before summer", summer: "Beat the heat — emergency AC repair", fall: "Furnace inspection season", winter: "Don't get left in the cold" } },
  "Plumber": { topics: ["DIY prevention tips", "water heater maintenance", "drain care guides", "emergency leak response", "water quality"], cta: "Call Now", seasonal: { spring: "Spring pipe inspection", summer: "Summer irrigation tips", fall: "Prevent frozen pipes", winter: "Emergency burst pipe service" } },
  "Electrician": { topics: ["electrical safety tips", "energy efficiency upgrades", "panel upgrade benefits", "smart home wiring", "storm preparation"], cta: "Get a Quote", seasonal: { spring: "Spring electrical inspection", summer: "Storm damage repair", fall: "Holiday lighting installation", winter: "Generator readiness check" } },
  default: { topics: ["industry tips", "behind the scenes", "customer success stories", "seasonal promotions", "community involvement"], cta: "Contact Us", seasonal: { spring: "Spring special", summer: "Summer promotion", fall: "Fall update", winter: "Holiday special" } },
};

function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

// ─── Component ─────────────────────────────────────────────
export default function ContentGenerator({ client, onNavigate, t }) {
  const [activeType, setActiveType] = useState("post");
  const [generated, setGenerated] = useState({});
  const [loading, setLoading] = useState({});

  const niche = NICHE_TEMPLATES[client.category] || NICHE_TEMPLATES.default;
  const season = getCurrentSeason();
  const seasonTip = niche.seasonal[season];

  const reviewKeywords = useMemo(() => {
    const reviews = client.reviewsData?.samples || [];
    const text = reviews.map(r => r.text || "").join(" ").toLowerCase();
    const stop = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","is","was","were","are","been","be","have","has","had","do","does","did","will","would","shall","should","may","might","must","can","could","i","we","you","he","she","it","they","me","him","her","us","them","my","your","his","its","our","their","this","that","these","those","not","very","just","also","so","like","really","got","get","much","many","well","even","still"]);
    const words = text.replace(/[^a-z\s]/g, " ").split(/\s+/).filter(w => w.length > 3 && !stop.has(w));
    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([w]) => w);
  }, [client]);

  async function generate(type) {
    setLoading(prev => ({ ...prev, [type]: true }));

    const baseContext = `Negócio: ${client.name}
Categoria: ${client.category}
Cidade: ${client.city}
Serviços: ${(client.services || []).join(", ")}
Keywords das reviews: ${reviewKeywords.join(", ")}
Website: ${client.website || "N/A"}
Telefone: ${client.phone || "N/A"}`;

    const prompts = {
      post: `${baseContext}

Gere 3 Google Posts otimizados para GBP. Cada post deve:
- Ter 150-300 palavras
- Incluir keywords naturais do nicho e das reviews
- Ter um CTA claro ("${niche.cta}")
- Ser relevante para a estação atual (${seasonTip})
- Tom profissional mas acessível

Formato para cada post:
**Post [número] — [tema]**
[texto do post]
**CTA:** [call to action]

Escreva em inglês (mercado USA).`,

      description: `${baseContext}

Gere uma descrição GBP otimizada (750 caracteres máximo) seguindo a metodologia de 4 camadas semânticas:
1. ENTIDADE — quem é o negócio (nome legal, licenças, certificações)
2. AÇÃO — o que faz (serviços específicos com keywords naturais)
3. PROBLEMA — que dores resolve (situações reais dos clientes)
4. CENÁRIO — onde atua (cidades, regiões, tipos de cliente)

Inclua termos de credibilidade (licensed, insured, bonded, guaranteed).
Inclua termos geográficos (${client.city}, condado, regiões vizinhas).
Use as keywords que os clientes já usam nas reviews: ${reviewKeywords.slice(0, 8).join(", ")}.
NÃO inclua URLs ou telefones.
Escreva em inglês (mercado USA).`,

      reviewtpl: `${baseContext}

Gere templates de resposta para reviews do Google Business Profile.
Crie 3 categorias:

**RESPOSTAS PARA REVIEWS 5 ESTRELAS** (3 templates)
- Agradeça pelo nome, mencione o serviço realizado, reforce a expertise, convide a voltar
- Inclua keywords naturais do serviço (SEO nas respostas)

**RESPOSTAS PARA REVIEWS 3-4 ESTRELAS** (3 templates)
- Agradeça, reconheça o feedback, mostre compromisso com melhoria, ofereça contato direto

**RESPOSTAS PARA REVIEWS 1-2 ESTRELAS** (3 templates)
- Tom empático e profissional, NÃO defensivo
- Reconheça a experiência, ofereça resolver offline, forneça contato direto
- NUNCA admita culpa legal, apenas demonstre empatia

Cada template deve ter [NOME] como placeholder para o nome do reviewer.
Escreva em inglês (mercado USA).`,

      schema: `${baseContext}
Endereço: ${client.address || "N/A"}
Rating: ${client.rating || "N/A"}
Reviews: ${client.reviewsData?.total || 0}

Gere um Schema.org JSON-LD completo para LocalBusiness. Inclua:
- @type específico para ${client.category} (use o tipo mais específico possível)
- name, address (PostalAddress), telephone, url
- openingHoursSpecification (formato padrão)
- aggregateRating (ratingValue, reviewCount)
- areaServed
- priceRange
- sameAs (placeholders para redes sociais)
- hasOfferCatalog com os serviços listados

Retorne APENAS o JSON-LD válido dentro de <script type="application/ld+json">.`,

      calendar: `${baseContext}
Estação atual: ${season} (${seasonTip})

Crie um calendário de conteúdo para as próximas 4 semanas. Para cada semana:
- 2 Google Posts (tema + resumo de 1 linha)
- 1 Foto sugerida (o que fotografar)
- 1 Q&A para adicionar

Use dados do Semantic Gap Analyzer: keywords que clientes mencionam mas NÃO estão no perfil devem ser priorizadas.
Keywords prioritárias: ${reviewKeywords.slice(0, 10).join(", ")}
Serviços que precisam de reforço: ${(client.services || []).slice(0, 5).join(", ")}

Formato:
**Semana [número] — [tema principal]**
📢 Post 1: [tema] — [resumo]
📢 Post 2: [tema] — [resumo]
📸 Foto: [o que fotografar]
❓ Q&A: [pergunta sugerida]

Escreva em inglês (mercado USA).`,
    };

    const result = await callClaude(prompts[type], type === "schema" ? 1000 : 1200);
    setGenerated(prev => ({ ...prev, [type]: result }));
    setLoading(prev => ({ ...prev, [type]: false }));
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Content Generator — {client.name}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>AI-optimized content based on real profile data</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onNavigate && onNavigate("semantic")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.blue + "44", background: C.blue + "15", color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>◐ Semantic Gap</button>
          <button onClick={() => onNavigate && onNavigate("reviewintel")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.purple + "44", background: C.purple + "15", color: C.purple, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>⭐ Review Intel</button>
        </div>
      </div>

      {/* Context bar */}
      <Card style={{ marginBottom: 16, padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge label={client.category} color={C.cyan} />
            <Badge label={client.city} color={C.blue} />
            <Badge label={seasonTip} color={C.yellow} />
          </div>
          <div style={{ fontSize: 11, color: C.textMuted }}>
            {reviewKeywords.length} keywords extracted • {(client.services || []).length} services
          </div>
        </div>
      </Card>

      {/* Content type selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>
        {CONTENT_TYPES.map(ct => (
          <button key={ct.id} onClick={() => setActiveType(ct.id)}
            style={{
              padding: "14px 10px", borderRadius: 10,
              border: "1px solid " + (activeType === ct.id ? C.blue + "66" : C.border),
              background: activeType === ct.id ? C.blue + "15" : C.bgCard,
              cursor: "pointer", transition: "all 0.15s", textAlign: "center",
            }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{ct.icon}</div>
            <div style={{ fontSize: 12, fontWeight: activeType === ct.id ? 700 : 400, color: activeType === ct.id ? C.blue : C.text }}>{ct.label}</div>
            <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>{ct.desc}</div>
          </button>
        ))}
      </div>

      {/* Generate button + output */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {CONTENT_TYPES.find(ct => ct.id === activeType)?.icon} {CONTENT_TYPES.find(ct => ct.id === activeType)?.label}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
              {CONTENT_TYPES.find(ct => ct.id === activeType)?.desc}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {generated[activeType] && (
              <button onClick={() => copyToClipboard(generated[activeType])}
                style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid " + C.green + "44", background: C.green + "15", color: C.green, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                Copy
              </button>
            )}
            <button onClick={() => generate(activeType)} disabled={loading[activeType]}
              style={{
                padding: "8px 18px", borderRadius: 8,
                border: "1px solid " + C.purple + "44",
                background: loading[activeType] ? C.purple + "08" : C.purple + "15",
                color: C.purple, fontSize: 12, fontWeight: 700,
                cursor: loading[activeType] ? "wait" : "pointer",
                opacity: loading[activeType] ? 0.6 : 1,
              }}>
              {loading[activeType] ? "Generating..." : generated[activeType] ? "Regenerate" : "◆ Generate with AI"}
            </button>
          </div>
        </div>

        {/* Not generated yet */}
        {!generated[activeType] && !loading[activeType] && (
          <div style={{ background: C.bg, borderRadius: 10, padding: 40, textAlign: "center", border: "1px dashed " + C.border }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{CONTENT_TYPES.find(ct => ct.id === activeType)?.icon}</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>
              Click "Generate with AI" to create optimized {CONTENT_TYPES.find(ct => ct.id === activeType)?.label.toLowerCase()}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
              Uses Claude API + profile data + review keywords + semantic gaps
            </div>
          </div>
        )}

        {/* Loading */}
        {loading[activeType] && (
          <div style={{ background: C.bg, borderRadius: 10, padding: 40, textAlign: "center", border: "1px solid " + C.purple + "33" }}>
            <div style={{ fontSize: 14, color: C.purple, fontWeight: 600 }}>Generating content with AI...</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
              Analyzing profile, reviews, and semantic gaps to create optimized content
            </div>
          </div>
        )}

        {/* Generated content */}
        {generated[activeType] && !loading[activeType] && (
          <div style={{
            background: C.bg, borderRadius: 10, padding: "20px 24px",
            border: "1px solid " + C.purple + "33",
            fontSize: 13, color: C.textDim, lineHeight: 1.8, whiteSpace: "pre-wrap",
            maxHeight: 600, overflowY: "auto",
          }}>
            {generated[activeType]}
          </div>
        )}
      </Card>

      {/* Tips based on content type */}
      <div style={{ marginTop: 16 }}>
        {activeType === "post" && (
          <Card style={{ padding: "12px 16px", border: "1px solid " + C.cyan + "22" }}>
            <div style={{ fontSize: 11, color: C.cyan, fontWeight: 600, marginBottom: 4 }}>Tips for Google Posts:</div>
            <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
              • Post 1-2x per week to keep the profile active • Include real work photos • Use CTA "Call Now" or "Learn More" • Posts expire after 6 months — keep the flow consistent
            </div>
          </Card>
        )}
        {activeType === "description" && (
          <Card style={{ padding: "12px 16px", border: "1px solid " + C.cyan + "22" }}>
            <div style={{ fontSize: 11, color: C.cyan, fontWeight: 600, marginBottom: 4 }}>GBP Description Rules:</div>
            <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
              • Maximum 750 characters • No URLs, phone numbers, or promotions • Focus on: who they are, what they do, where they serve, why trust them • Natural keywords, never forced
            </div>
          </Card>
        )}
        {activeType === "schema" && (
          <Card style={{ padding: "12px 16px", border: "1px solid " + C.cyan + "22" }}>
            <div style={{ fontSize: 11, color: C.cyan, fontWeight: 600, marginBottom: 4 }}>How to use Schema.org:</div>
            <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
              • Paste in the {"<head>"} of the client's website • Validate at schema.org/validator • Schema strengthens citability in AI Overviews and increases GEO Score
            </div>
          </Card>
        )}
        {activeType === "reviewtpl" && (
          <Card style={{ padding: "12px 16px", border: "1px solid " + C.cyan + "22" }}>
            <div style={{ fontSize: 11, color: C.cyan, fontWeight: 600, marginBottom: 4 }}>Tips for review responses:</div>
            <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
              • Respond within 24h — response speed impacts ranking • Include service keywords naturally in the response (SEO) • Never copy/paste the same response — Google detects it • Negative reviews: empathetic, handle offline, no legal liability admissions
            </div>
          </Card>
        )}
        {activeType === "calendar" && (
          <Card style={{ padding: "12px 16px", border: "1px solid " + C.cyan + "22" }}>
            <div style={{ fontSize: 11, color: C.cyan, fontWeight: 600, marginBottom: 4 }}>About the content calendar:</div>
            <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
              • Prioritizes Semantic Gap keywords (what customers say but isn't in the profile) • Adapted to the current season • Each week combines posts + photos + Q&A for maximum impact
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
