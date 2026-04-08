"use client";
import { useState, useMemo } from "react";
import { C } from "../constants/colors";
import { Card, Badge } from "../shared";
import { calcScores, calcSemantic, calcSemanticAlignment } from "../utils/scoring";
import { callClaude } from "../utils/ai";

// ─── 5 Diagnostic Causes ──────────────────────────────────────
const CAUSES = [
  {
    id: "proximity",
    title: "Proximity Filter",
    probability: "HIGH",
    icon: "◎",
    description: "New or strengthened competitor in the same area + category overtook the profile.",
    checks: [
      { q: "Did a new competitor appear in Maps top 3 for your main keyword?", weight: 3 },
      { q: "Is a competitor with the same primary category within 2km?", weight: 2 },
      { q: "Does the competitor have more reviews or a higher rating?", weight: 2 },
      { q: "Does the profile appear when searching the exact business name?", weight: -2, inverted: true },
    ],
  },
  {
    id: "velocity",
    title: "Review Velocity Died",
    probability: "HIGH",
    icon: "⭐",
    description: "Reviews stopped coming in. Google interprets this as business stagnation.",
    checks: [
      { q: "Last 20 reviews — are most older than 3 months?", weight: 3 },
      { q: "Fewer than 2 reviews in the last 30 days?", weight: 2 },
      { q: "Direct competitors are receiving more recent reviews?", weight: 2 },
      { q: "Was there a change in the process of asking customers for reviews?", weight: 1 },
    ],
  },
  {
    id: "penalty",
    title: "Silent Penalty",
    probability: "MEDIUM",
    icon: "⚠",
    description: "Google detected a violation: keyword in name, suspicious review, accepted auto edit.",
    checks: [
      { q: "Did Google make a 'suggested' edit to the profile that was automatically accepted?", weight: 3 },
      { q: "Was the primary category changed without your action?", weight: 3 },
      { q: "Does the business name contain marketing keywords (best, top, #1)?", weight: 2 },
      { q: "Did you receive a Google email about a guideline violation?", weight: 3 },
      { q: "Were reviews recently removed by Google?", weight: 2 },
    ],
  },
  {
    id: "algorithm",
    title: "Algorithm Update",
    probability: "MEDIUM",
    icon: "◆",
    description: "Google update (Vicinity, etc.) changed ranking weights. Affects multiple businesses.",
    checks: [
      { q: "Did other businesses in the same niche/city also drop?", weight: 3 },
      { q: "Did the drop coincide with an announced Google update?", weight: 2 },
      { q: "Did profiles with more local authority rise while yours dropped?", weight: 2 },
      { q: "Was the drop gradual (weeks) rather than sudden?", weight: 1 },
    ],
  },
  {
    id: "website",
    title: "Website / Schema Broke",
    probability: "MEDIUM-LOW",
    icon: "</>",
    description: "Slow website, Schema removed, robots.txt blocking crawlers.",
    checks: [
      { q: "Is the site's PageSpeed below 50 on mobile?", weight: 2 },
      { q: "Was Schema.org LocalBusiness removed or does it have an error?", weight: 3 },
      { q: "Is robots.txt blocking Googlebot?", weight: 3 },
      { q: "Did the site change domain, go through redesign, or recent migration?", weight: 2 },
      { q: "Did the SSL certificate expire or is the site showing a security warning?", weight: 2 },
    ],
  },
];

export default function DiagnosticWizard({ client, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const scores = useMemo(() => calcScores(client), [client]);
  const semantic = useMemo(() => calcSemantic(client), [client]);
  const sa = useMemo(() => calcSemanticAlignment(client), [client]);

  // Auto-detect some signals from data
  const autoSignals = useMemo(() => {
    const signals = [];
    const reviewTotal = client.reviewsData?.total || 0;
    const last30 = client.reviewsData?.last30days || 0;
    const negUnans = client.reviewsData?.negativeUnanswered || 0;
    const lp = client.posts?.[0]?.date ? Math.floor((new Date() - new Date(client.posts[0].date)) / 86400000) : 999;

    if (last30 === 0 && reviewTotal > 10) signals.push({ cause: "velocity", text: "Zero reviews in the last 30 days", severity: "critical" });
    if (last30 <= 1 && reviewTotal > 20) signals.push({ cause: "velocity", text: `Only ${last30} review(s) in the last 30 days (${reviewTotal} total)`, severity: "high" });
    if (negUnans > 0) signals.push({ cause: "penalty", text: `${negUnans} unanswered negative review(s)`, severity: "high" });
    if (scores.overall < 40) signals.push({ cause: "penalty", text: `Critical score: ${scores.overall}/100`, severity: "critical" });
    if (!client.verified) signals.push({ cause: "penalty", text: "Profile NOT verified", severity: "critical" });
    if (lp > 30) signals.push({ cause: "velocity", text: `No posts for ${lp === 999 ? "never posted" : lp + " days"}`, severity: "high" });
    if ((client.photos?.total || 0) < 5) signals.push({ cause: "website", text: "Only " + (client.photos?.total || 0) + " photos", severity: "medium" });
    if (sa.gaps > 3) signals.push({ cause: "velocity", text: `${sa.gaps} semantic gaps — profile misaligned with reviews`, severity: "medium" });

    return signals;
  }, [client, scores, sa]);

  function toggleAnswer(causeId, checkIdx) {
    const key = `${causeId}_${checkIdx}`;
    setAnswers(prev => ({ ...prev, [key]: prev[key] === "yes" ? "no" : prev[key] === "no" ? undefined : "yes" }));
  }

  // Calculate diagnosis
  const diagnosis = useMemo(() => {
    const results = CAUSES.map(cause => {
      let score = 0;
      let maxScore = 0;
      let answered = 0;
      cause.checks.forEach((check, i) => {
        const key = `${cause.id}_${i}`;
        const w = Math.abs(check.weight);
        maxScore += w;
        if (answers[key] === "yes") {
          score += check.inverted ? 0 : w;
          answered++;
        } else if (answers[key] === "no") {
          score += check.inverted ? w : 0;
          answered++;
        }
      });

      // Add auto-signal weight
      const autoWeight = autoSignals.filter(s => s.cause === cause.id).length * 1.5;
      score += autoWeight;
      maxScore += autoSignals.filter(s => s.cause === cause.id).length * 1.5;

      const confidence = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      return { ...cause, score, maxScore, confidence, answered };
    });

    return results.sort((a, b) => b.confidence - a.confidence);
  }, [answers, autoSignals]);

  const topCause = diagnosis[0];
  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = CAUSES.reduce((sum, c) => sum + c.checks.length, 0);

  return (
    <div>
      {/* Auto-detected signals */}
      {autoSignals.length > 0 && (
        <Card style={{ marginBottom: 16, border: "1px solid " + C.yellow + "33" }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Automatically Detected Signals</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {autoSignals.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: (s.severity === "critical" ? C.red : s.severity === "high" ? "#ff8c00" : C.yellow) + "12", border: "1px solid " + (s.severity === "critical" ? C.red : s.severity === "high" ? "#ff8c00" : C.yellow) + "33", borderRadius: 8 }}>
                <span style={{ fontSize: 10, color: s.severity === "critical" ? C.red : s.severity === "high" ? "#ff8c00" : C.yellow, fontWeight: 700 }}>
                  {s.severity === "critical" ? "🔴" : s.severity === "high" ? "🟠" : "🟡"}
                </span>
                <span style={{ fontSize: 11, color: C.text }}>{s.text}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Diagnostic questions */}
      {!showResults && (
        <>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>
            Answer the questions below to identify the most likely cause. Click to toggle: <span style={{ color: C.green }}>YES</span> / <span style={{ color: C.red }}>NO</span> / <span style={{ color: C.textMuted }}>don't know</span>
          </div>

          {CAUSES.map(cause => (
            <Card key={cause.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>{cause.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{cause.title}</span>
                  <span style={{ fontSize: 10, color: C.yellow, marginLeft: 8 }}>Probability: {cause.probability}</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>{cause.description}</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {cause.checks.map((check, i) => {
                  const key = `${cause.id}_${i}`;
                  const val = answers[key];
                  return (
                    <div key={i} onClick={() => toggleAnswer(cause.id, i)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: val === "yes" ? C.green + "10" : val === "no" ? C.red + "08" : C.bg, border: "1px solid " + (val === "yes" ? C.green + "33" : val === "no" ? C.red + "22" : C.border), borderRadius: 8, cursor: "pointer", transition: "all 0.15s" }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: "2px solid " + (val === "yes" ? C.green : val === "no" ? C.red : C.border), background: val === "yes" ? C.green + "22" : val === "no" ? C.red + "11" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: val === "yes" ? C.green : val === "no" ? C.red : C.textMuted, flexShrink: 0 }}>
                        {val === "yes" ? "✓" : val === "no" ? "✕" : ""}
                      </div>
                      <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{check.q}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}

          <button onClick={() => setShowResults(true)}
            style={{ width: "100%", padding: "14px 0", borderRadius: 10, border: "none", background: totalAnswered > 0 ? C.blue : C.border, color: totalAnswered > 0 ? "#fff" : C.textMuted, fontSize: 14, fontWeight: 700, cursor: totalAnswered > 0 ? "pointer" : "default", marginTop: 8 }}>
            View Diagnosis ({totalAnswered}/{totalQuestions} answered)
          </button>
        </>
      )}

      {/* Results */}
      {showResults && (
        <>
          <Card style={{ marginBottom: 16, border: "1px solid " + (topCause.confidence >= 60 ? C.red : C.yellow) + "44", textAlign: "center", padding: "24px 20px" }}>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>MOST LIKELY CAUSE</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 4 }}>{topCause.icon} {topCause.title}</div>
            <div style={{ fontSize: 14, color: topCause.confidence >= 60 ? C.red : C.yellow, fontWeight: 700, marginBottom: 8 }}>{topCause.confidence}% confidence</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{topCause.description}</div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Cause Ranking</div>
            {diagnosis.map((d, i) => {
              const barColor = d.confidence >= 60 ? C.red : d.confidence >= 30 ? C.yellow : C.textMuted;
              return (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < diagnosis.length - 1 ? "1px solid " + C.border : "none" }}>
                  <span style={{ fontSize: 14, width: 24, textAlign: "center" }}>{d.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{d.title}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{d.confidence}%</span>
                    </div>
                    <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: d.confidence + "%", height: "100%", background: barColor, transition: "width 0.3s" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* 7.11 — AI Diagnosis */}
          <Card style={{ marginBottom: 16, border: "1px solid " + C.purple + "33" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 600, color: C.purple }}>🤖 AI-Powered Diagnosis</div>
              <button onClick={async () => {
                setAiLoading(true);
                const signalsSummary = autoSignals.map(s => s.text).join("; ");
                const causesSummary = diagnosis.slice(0, 3).map(d => `${d.title} (${d.confidence}%)`).join(", ");
                const prompt = `You are a Local SEO expert diagnosing a GBP profile drop.

Profile: "${client.name}" (${client.category}, ${client.city})
Score: ${scores.overall}/100 | AI Mode: ${semantic.score}/100 | Reviews: ${client.reviewsData?.total || 0} (${client.reviewsData?.last30days || 0}/mo)
Auto-detected signals: ${signalsSummary || "None"}
Top suspected causes: ${causesSummary}

Provide a diagnosis in 4 sections (2-3 sentences each):
1. **Root Cause** — What's most likely happening and why
2. **Impact** — How this affects ranking, visibility, and leads
3. **Immediate Action** — What to do in the next 48 hours
4. **30-Day Recovery** — Strategy overview for full recovery

Be specific to this business type and location. No generic advice.`;
                const result = await callClaude(prompt, 500);
                setAiDiagnosis(result);
                setAiLoading(false);
              }} disabled={aiLoading}
                style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.purple + "44", background: C.purple + "15", color: C.purple, fontSize: 11, fontWeight: 700, cursor: aiLoading ? "wait" : "pointer", opacity: aiLoading ? 0.6 : 1 }}>
                {aiLoading ? "Analyzing..." : aiDiagnosis ? "Regenerate" : "Run AI Diagnosis"}
              </button>
            </div>

            {!aiDiagnosis && !aiLoading && (
              <div style={{ textAlign: "center", padding: "16px 0", color: C.textMuted, fontSize: 12 }}>
                Click "Run AI Diagnosis" for a personalized analysis using Claude
              </div>
            )}
            {aiLoading && (
              <div style={{ textAlign: "center", padding: "16px 0", color: C.purple, fontSize: 12 }}>
                ⏳ Analyzing profile data and suspected causes...
              </div>
            )}
            {aiDiagnosis && !aiLoading && (
              <div style={{ background: C.purple + "08", border: "1px solid " + C.purple + "22", borderRadius: 8, padding: "14px 16px", fontSize: 12, color: C.textDim, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {typeof aiDiagnosis === "string" ? aiDiagnosis : aiDiagnosis?.content || aiDiagnosis?.text || ""}
              </div>
            )}
          </Card>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowResults(false)}
              style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid " + C.border, background: "transparent", color: C.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Redo Diagnosis
            </button>
            <button onClick={() => onComplete && onComplete(diagnosis)}
              style={{ flex: 2, padding: "12px 0", borderRadius: 10, border: "none", background: C.blue, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Generate Action Plan →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
