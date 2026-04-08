"use client";
import { useState, useMemo } from "react";
import { C } from "../constants/colors";
import { Card, Badge, ScoreCircle } from "../shared";
import { calcScores, calcSemantic, calcSemanticAlignment } from "../utils/scoring";
import { analyzeCompliance } from "../analysis/ComplianceGuard";
import { analyzeReviewIntelligence } from "../analysis/ReviewIntelligence";

// ─── Seasonality Data by Niche ──────────────────────────────
const NICHE_SEASONALITY = {
  "Home Renovation Contractor": { peak: [3,4,5,6,7,8], slow: [11,0,1], peakLabel: "Spring/Summer", slowLabel: "Winter", prepMonths: [2,9] },
  "HVAC Contractor": { peak: [5,6,7,11,0,1], slow: [3,4,9,10], peakLabel: "Summer + Winter", slowLabel: "Spring/Fall", prepMonths: [4,10] },
  "Plumber": { peak: [0,1,11], slow: [6,7,8], peakLabel: "Winter (frozen pipes)", slowLabel: "Summer", prepMonths: [10,11] },
  "Dentist": { peak: [0,1,7,8], slow: [5,6,11], peakLabel: "New Year + Back-to-School", slowLabel: "Summer/Holiday", prepMonths: [0,7] },
  "Electrician": { peak: [5,6,7,11], slow: [1,2,3], peakLabel: "Summer + Holiday lighting", slowLabel: "Late Winter", prepMonths: [4,10] },
  "Landscaping Company": { peak: [3,4,5,6,7], slow: [11,0,1,2], peakLabel: "Spring/Summer", slowLabel: "Winter", prepMonths: [2,3] },
  "Car Detailing Service": { peak: [3,4,5,9,10], slow: [0,1,2], peakLabel: "Spring + Pre-Holiday", slowLabel: "Winter", prepMonths: [2,8] },
  "Family Law Attorney": { peak: [0,1,8,9], slow: [5,6,11], peakLabel: "Post-Holiday + Back-to-School", slowLabel: "Summer/Holiday", prepMonths: [0,7] },
  "IT Services & Computer Repair": { peak: [0,8,9], slow: [5,6,7], peakLabel: "New Year + Budget Cycle", slowLabel: "Summer", prepMonths: [0,8] },
  "Digital Marketing Agency": { peak: [0,1,9,10], slow: [6,7,11], peakLabel: "New Year + Q4 Prep", slowLabel: "Summer/December", prepMonths: [0,8] },
};

const DEFAULT_SEASONALITY = { peak: [3,4,5,9,10], slow: [0,1,7,11], peakLabel: "Spring + Fall", slowLabel: "Winter + Summer", prepMonths: [2,8] };

// ─── Prediction Engine ──────────────────────────────────────
function generatePredictions(client, allClients) {
  const alerts = [];
  const now = new Date();
  const currentMonth = now.getMonth();

  const scores = calcScores(client);
  const semantic = calcSemantic(client);
  const sa = calcSemanticAlignment(client);
  const compliance = analyzeCompliance(client);
  const reviewIntel = analyzeReviewIntelligence(client);

  const reviewTotal = client.reviewsData?.total || 0;
  const last30 = client.reviewsData?.last30days || 0;
  const negUnans = client.reviewsData?.negativeUnanswered || 0;
  const lp = client.posts?.[0]?.date ? Math.floor((now - new Date(client.posts[0].date)) / 86400000) : 999;
  const photosAge = client.photos?.lastUpload ? Math.floor((now - new Date(client.photos.lastUpload)) / 86400000) : 999;
  const seasonality = NICHE_SEASONALITY[client.category] || DEFAULT_SEASONALITY;

  // ═══ 1. REVIEW VELOCITY PREDICTIONS ═══
  if (last30 <= 1 && reviewTotal > 15) {
    alerts.push({
      type: "warning",
      category: "velocity",
      icon: "⭐",
      title: "Review velocity em queda crítica",
      prediction: `Apenas ${last30} review nos últimos 30 dias. Se continuar assim, o perfil pode perder posições em 2-4 semanas.`,
      action: "Ativar processo de solicitar reviews: SMS/email pós-serviço. Meta: 5+ reviews/mês.",
      timeframe: "2-4 semanas",
      confidence: 85,
      impact: "alto",
    });
  } else if (last30 <= 2 && reviewTotal > 30) {
    alerts.push({
      type: "attention",
      category: "velocity",
      icon: "⭐",
      title: "Review velocity desacelerando",
      prediction: `${last30} reviews/mês com ${reviewTotal} total. Concorrentes ativos vão ultrapassar em 4-6 semanas.`,
      action: "Aumentar frequência de pedidos de reviews. Garantir timing de 1-3h pós-serviço.",
      timeframe: "4-6 semanas",
      confidence: 70,
      impact: "médio",
    });
  }

  // ═══ 2. COMPLIANCE RISK PREDICTIONS ═══
  if (compliance.score < 60) {
    alerts.push({
      type: "warning",
      category: "compliance",
      icon: "⚠",
      title: "Risco de suspensão detectado",
      prediction: `Compliance Score: ${compliance.score}/100. ${compliance.counts.critical} violação(ões) crítica(s). Google pode suspender o perfil a qualquer momento.`,
      action: "Corrigir violações críticas IMEDIATAMENTE. Ver tab Compliance Guard para detalhes.",
      timeframe: "Imediato",
      confidence: compliance.counts.critical > 0 ? 90 : 60,
      impact: "crítico",
    });
  } else if (compliance.score < 80) {
    alerts.push({
      type: "attention",
      category: "compliance",
      icon: "◈",
      title: "Compliance precisa de atenção",
      prediction: `Score: ${compliance.score}/100. ${compliance.counts.medium} ponto(s) médio(s) a corrigir para zona segura.`,
      action: "Resolver issues de compliance antes que acumulem e gerem penalidade.",
      timeframe: "1-2 semanas",
      confidence: 55,
      impact: "médio",
    });
  }

  // ═══ 3. SEASONALITY PREDICTIONS ═══
  if (seasonality.prepMonths.includes(currentMonth)) {
    const isPrePeak = seasonality.peak.includes((currentMonth + 1) % 12);
    if (isPrePeak) {
      alerts.push({
        type: "opportunity",
        category: "seasonality",
        icon: "◷",
        title: `Temporada forte chegando: ${seasonality.peakLabel}`,
        prediction: `Próximo mês é alta temporada para ${client.category}. Perfis otimizados agora capturam mais buscas.`,
        action: "Publicar posts sazonais, atualizar serviços de temporada, intensificar pedidos de reviews.",
        timeframe: "Próximas 2-4 semanas",
        confidence: 80,
        impact: "alto",
      });
    }
  }

  if (seasonality.slow.includes(currentMonth)) {
    alerts.push({
      type: "attention",
      category: "seasonality",
      icon: "◷",
      title: `Período lento: ${seasonality.slowLabel}`,
      prediction: `Mês de baixa demanda para ${client.category}. Volume de buscas naturalmente menor.`,
      action: "Focar em fortalecimento da entidade, Schema.org, citações. Preparar conteúdo para próxima peak season.",
      timeframe: "Este mês",
      confidence: 75,
      impact: "baixo",
    });
  }

  // ═══ 4. SENTIMENT TREND PREDICTIONS ═══
  if (reviewIntel.hasData && reviewIntel.trend === "declining") {
    alerts.push({
      type: "warning",
      category: "sentiment",
      icon: "↘",
      title: "Sentimento das reviews piorando",
      prediction: "Reviews recentes são mais negativas que as antigas. Se continuar, o rating vai cair e impactar ranking.",
      action: "Investigar problemas recorrentes em Review Intelligence. Resolver causa raiz operacional.",
      timeframe: "2-4 semanas",
      confidence: 75,
      impact: "alto",
    });
  }

  if (reviewIntel.hasData && reviewIntel.problems.length >= 2) {
    alerts.push({
      type: "attention",
      category: "sentiment",
      icon: "!",
      title: `${reviewIntel.problems.length} problemas recorrentes detectados`,
      prediction: `Clientes reclamam repetidamente de: ${reviewIntel.problems.slice(0, 3).map(p => p.theme).join(", ")}. Padrão vai gerar mais reviews negativas.`,
      action: "Resolver os problemas operacionais identificados. Ver tab Review Intelligence.",
      timeframe: "Contínuo",
      confidence: 70,
      impact: "médio",
    });
  }

  // ═══ 5. PROFILE STAGNATION PREDICTIONS ═══
  if (lp > 14 && lp < 999) {
    alerts.push({
      type: "attention",
      category: "activity",
      icon: "📢",
      title: "Perfil ficando inativo",
      prediction: `Sem posts há ${lp} dias. Google interpreta inatividade como negócio estagnado. Impacta ranking em 2-3 semanas.`,
      action: "Publicar 1 Google Post HOJE. Manter ritmo de 1-2 posts/semana.",
      timeframe: "1-2 semanas",
      confidence: 80,
      impact: "médio",
    });
  }

  if (photosAge > 60 && photosAge < 999) {
    alerts.push({
      type: "attention",
      category: "activity",
      icon: "◫",
      title: "Fotos desatualizadas",
      prediction: `Última foto há ${photosAge} dias. Perfis com fotos recentes têm 42% mais pedidos de rota (dados Google).`,
      action: "Upload de 3-5 fotos recentes: trabalho realizado, equipe, fachada atualizada.",
      timeframe: "Esta semana",
      confidence: 65,
      impact: "médio",
    });
  }

  // ═══ 6. OPPORTUNITY ALERTS ═══
  if (sa.gaps > 0 && sa.score < 60) {
    alerts.push({
      type: "opportunity",
      category: "semantic",
      icon: "◐",
      title: `${sa.gaps} gap(s) semântico(s) = oportunidade`,
      prediction: "Clientes mencionam serviços nas reviews que NÃO estão no perfil. Adicionar pode expandir visibilidade para novas buscas.",
      action: "Ver Semantic Gap Analyzer e adicionar serviços/keywords faltantes ao perfil.",
      timeframe: "Esta semana",
      confidence: 85,
      impact: "alto",
    });
  }

  if (negUnans > 0) {
    alerts.push({
      type: "warning",
      category: "reviews",
      icon: "🔴",
      title: `${negUnans} review(s) negativo(s) sem resposta`,
      prediction: "Cada review negativo sem resposta reduz conversão em ~22%. Google também usa taxa de resposta como sinal.",
      action: "Responder TODOS em até 24h com tom profissional. Ver Review Responder.",
      timeframe: "Imediato",
      confidence: 95,
      impact: "alto",
    });
  }

  if (scores.overall >= 75 && semantic.score >= 60 && last30 >= 3) {
    alerts.push({
      type: "opportunity",
      category: "growth",
      icon: "↗",
      title: "Perfil forte — momento de acelerar",
      prediction: "Score alto + velocity boa = momento ideal para expandir. Cada ação tem ROI amplificado quando a base está forte.",
      action: "Focar em: categorias secundárias, Content Generator para posts semanais, Schema.org no site.",
      timeframe: "Próximos 30 dias",
      confidence: 70,
      impact: "alto",
    });
  }

  // Sort: warnings first, then attention, then opportunities
  const typeOrder = { warning: 0, attention: 1, opportunity: 2 };
  alerts.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

  return alerts;
}

// ─── Component ─────────────────────────────────────────────
export default function PredictiveAlerts({ client, onNavigate, t, allClients }) {
  const [filter, setFilter] = useState("all");
  const alerts = useMemo(() => generatePredictions(client, allClients), [client, allClients]);

  const typeConfig = {
    warning: { color: C.red, label: "Alerta", icon: "🔴", bgColor: C.red },
    attention: { color: "#ff8c00", label: "Atenção", icon: "🟠", bgColor: "#ff8c00" },
    opportunity: { color: C.green, label: "Oportunidade", icon: "🟢", bgColor: C.green },
  };

  const impactConfig = {
    "crítico": C.red,
    "alto": "#ff8c00",
    "médio": C.yellow,
    "baixo": C.textMuted,
  };

  const warningCount = alerts.filter(a => a.type === "warning").length;
  const attentionCount = alerts.filter(a => a.type === "attention").length;
  const opportunityCount = alerts.filter(a => a.type === "opportunity").length;

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.type === filter);

  // Overall risk level
  const riskLevel = warningCount >= 2 ? "high" : warningCount >= 1 ? "medium" : attentionCount >= 3 ? "medium" : "low";
  const riskConfig = {
    high: { color: C.red, label: "Risco Alto", desc: "Múltiplos alertas críticos. Ação imediata necessária." },
    medium: { color: C.yellow, label: "Atenção", desc: "Alguns pontos precisam de correção para evitar problemas." },
    low: { color: C.green, label: "Saudável", desc: "Perfil em boa trajetória. Foque nas oportunidades." },
  };
  const risk = riskConfig[riskLevel];

  const categoryLabels = {
    velocity: "Review Velocity",
    compliance: "Compliance",
    seasonality: "Sazonalidade",
    sentiment: "Sentimento",
    activity: "Atividade",
    semantic: "Semântica",
    reviews: "Reviews",
    growth: "Crescimento",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Predictive Alerts — {client.name}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>IA preditiva: alertas ANTES do problema acontecer</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onNavigate && onNavigate("rescue")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.red + "44", background: C.red + "15", color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>⚠ Rescue Mode</button>
          <button onClick={() => onNavigate && onNavigate("compliance")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.orange + "44", background: C.orange + "15", color: C.orange, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>◈ Compliance</button>
        </div>
      </div>

      {/* Risk status bar */}
      <Card style={{ marginBottom: 16, border: "1px solid " + risk.color + "44", padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: risk.color }} />
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: risk.color }}>{risk.label}</span>
              <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 8 }}>{risk.desc}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>🔴 {warningCount}</span>
            <span style={{ fontSize: 11, color: "#ff8c00", fontWeight: 600 }}>🟠 {attentionCount}</span>
            <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>🟢 {opportunityCount}</span>
          </div>
        </div>
      </Card>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.bgCard, borderRadius: 10, padding: 4, border: "1px solid " + C.border }}>
        {[
          { id: "all", label: `Todos (${alerts.length})` },
          { id: "warning", label: `Alertas (${warningCount})` },
          { id: "attention", label: `Atenção (${attentionCount})` },
          { id: "opportunity", label: `Oportunidades (${opportunityCount})` },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ flex: 1, padding: "8px 10px", borderRadius: 7, border: "none", background: filter === f.id ? (f.id === "all" ? C.blue : (typeConfig[f.id]?.color || C.blue)) + "22" : "transparent", color: filter === f.id ? (f.id === "all" ? C.blue : (typeConfig[f.id]?.color || C.blue)) : C.textMuted, fontSize: 11, fontWeight: filter === f.id ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.green }}>Nenhum alerta nesta categoria</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>Perfil em boa situação. Continue monitorando.</div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((alert, i) => {
            const tc = typeConfig[alert.type];
            return (
              <Card key={i} style={{ border: "1px solid " + tc.bgColor + "22", padding: "16px 18px" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{alert.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{alert.title}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                        <Badge label={tc.label} color={tc.color} />
                        <Badge label={categoryLabels[alert.category] || alert.category} color={C.cyan} />
                        <Badge label={"Impacto " + alert.impact} color={impactConfig[alert.impact] || C.textMuted} />
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: tc.color }}>{alert.confidence}%</div>
                    <div style={{ fontSize: 9, color: C.textMuted }}>confiança</div>
                  </div>
                </div>

                {/* Prediction */}
                <div style={{ background: C.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 10, borderLeft: "3px solid " + tc.bgColor + "66" }}>
                  <div style={{ fontSize: 10, color: tc.color, fontWeight: 600, marginBottom: 3, textTransform: "uppercase" }}>Previsão</div>
                  <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6 }}>{alert.prediction}</div>
                </div>

                {/* Action + Timeframe */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: C.cyan, fontWeight: 600, marginBottom: 2 }}>AÇÃO RECOMENDADA</div>
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{alert.action}</div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: C.textMuted }}>Prazo</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: tc.color }}>{alert.timeframe}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
