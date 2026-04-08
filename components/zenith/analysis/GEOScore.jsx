"use client";
import { useMemo } from "react";
import { C } from "../constants/colors";
import { Card, Badge, ScoreCircle } from "../shared";

/**
 * GEO Score — Generative Engine Optimization
 * Measures how likely a GBP profile is to be cited by AI systems
 * (Google AI Overviews, ChatGPT, Gemini, Perplexity, etc.)
 */

function calcGEOScore(client, semantic, sa) {
  const desc = (client.description || "").toLowerCase();
  const descLen = client.descriptionLength || desc.length || 0;
  const services = client.services || [];
  const reviews = client.reviewsData?.samples || [];
  const reviewTotal = client.reviewsData?.total || 0;
  const rating = client.rating || 0;
  const city = (client.city || "").toLowerCase();
  const category = (client.category || "").toLowerCase();

  const factors = [];

  // 1. Ontology completeness (4 layers)
  const layers = semantic?.layers || 0;
  const ontologyScore = layers === 4 ? 25 : layers >= 3 ? 18 : layers >= 2 ? 10 : 3;
  factors.push({ id: "ontology", label: "Ontology Completeness", score: ontologyScore, max: 25, detail: `${layers}/4 layers present`, tip: layers < 4 ? "Add missing layers: Entity, Action, Problem, Scenario" : "All 4 layers present — AI-ready", status: layers === 4 ? "pass" : layers >= 2 ? "warn" : "fail" });

  // 2. Standalone citeable chunks
  const chunks = semantic?.chunks || 0;
  const chunkScore = chunks >= 3 ? 20 : chunks >= 1 ? 12 : 2;
  factors.push({ id: "chunks", label: "Citeable Chunks", score: chunkScore, max: 20, detail: `${chunks} standalone sentence(s) with service + location`, tip: chunks < 3 ? "Create sentences like: 'We specialize in [service] for [location] homeowners.'" : "Strong citeable content for AI extraction", status: chunks >= 3 ? "pass" : chunks >= 1 ? "warn" : "fail" });

  // 3. Entity authority (reviews + rating)
  const authScore = (rating >= 4.5 && reviewTotal >= 50) ? 15 : (rating >= 4.0 && reviewTotal >= 20) ? 10 : (reviewTotal >= 10) ? 6 : 2;
  factors.push({ id: "authority", label: "Entity Authority", score: authScore, max: 15, detail: `${reviewTotal} reviews at ${rating}★`, tip: authScore < 15 ? `Target: 50+ reviews at 4.5+★ for strong entity authority` : "Strong authority signal", status: authScore >= 12 ? "pass" : authScore >= 6 ? "warn" : "fail" });

  // 4. Triangulation (reviews confirm services)
  const triTerms = semantic?.triTerms || 0;
  const triScore = triTerms >= 5 ? 15 : triTerms >= 3 ? 10 : triTerms >= 1 ? 5 : 1;
  factors.push({ id: "triangulation", label: "Review-Service Triangulation", score: triScore, max: 15, detail: `${triTerms} service terms confirmed in reviews`, tip: triTerms < 5 ? "Encourage customers to mention specific services in reviews" : "Strong triangulation — AI will trust this entity", status: triTerms >= 5 ? "pass" : triTerms >= 2 ? "warn" : "fail" });

  // 5. Geographic specificity
  const geoTerms = semantic?.geoTerms || 0;
  const geoScore = geoTerms >= 3 ? 10 : geoTerms >= 1 ? 6 : 1;
  factors.push({ id: "geo", label: "Geographic Specificity", score: geoScore, max: 10, detail: `${geoTerms} location terms in description`, tip: geoTerms < 3 ? `Add city names, neighborhoods, counties served (e.g., "${client.city}, surrounding areas")` : "Strong geographic signals", status: geoTerms >= 3 ? "pass" : geoTerms >= 1 ? "warn" : "fail" });

  // 6. Semantic alignment (profile matches reviews)
  const alignScore = (sa?.score || 0) >= 60 ? 10 : (sa?.score || 0) >= 35 ? 6 : 2;
  factors.push({ id: "alignment", label: "Semantic Alignment", score: alignScore, max: 10, detail: `Score: ${sa?.score || 0}/100 — ${sa?.gaps || 0} gap(s)`, tip: alignScore < 10 ? "Close gaps between what customers say and what profile shows" : "Profile aligned with customer language", status: alignScore >= 8 ? "pass" : alignScore >= 5 ? "warn" : "fail" });

  // 7. Structured data readiness
  const hasWebsite = !!client.website;
  const hasAttrs = (client.attributes || 0) >= 8;
  const hasSecCats = (client.secondaryCategories || []).length > 0;
  const structuredBits = [hasWebsite, hasAttrs, hasSecCats].filter(Boolean).length;
  const structScore = structuredBits === 3 ? 5 : structuredBits >= 2 ? 3 : 1;
  factors.push({ id: "structured", label: "Structured Data", score: structScore, max: 5, detail: `${structuredBits}/3: website${hasWebsite ? "✓" : "✗"}, attrs${hasAttrs ? "✓" : "✗"}, sec. cats${hasSecCats ? "✓" : "✗"}`, tip: "Complete all structured fields — AI systems prefer structured sources", status: structuredBits === 3 ? "pass" : structuredBits >= 2 ? "warn" : "fail" });

  const total = factors.reduce((s, f) => s + f.score, 0);
  const maxTotal = factors.reduce((s, f) => s + f.max, 0);
  const overall = Math.round((total / maxTotal) * 100);

  // Citability verdict
  let verdict, verdictColor, verdictIcon;
  if (overall >= 75) { verdict = "Highly Citable"; verdictColor = C.green; verdictIcon = "🟢"; }
  else if (overall >= 50) { verdict = "Moderately Citable"; verdictColor = C.yellow; verdictIcon = "🟡"; }
  else if (overall >= 30) { verdict = "Low Citability"; verdictColor = C.orange; verdictIcon = "🟠"; }
  else { verdict = "Not Citable"; verdictColor = C.red; verdictIcon = "🔴"; }

  return { overall, factors, verdict, verdictColor, verdictIcon };
}

export default function GEOScore({ client, onNavigate }) {
  const sem = client.semanticData || {};
  const sa = client.semanticAlignmentData || {};
  const geo = useMemo(() => calcGEOScore(client, sem, sa), [client, sem, sa]);

  const statusColor = { pass: C.green, warn: C.yellow, fail: C.red };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>GEO Score — {client.name}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Generative Engine Optimization — AI citability assessment</div>
        </div>
        <button onClick={() => onNavigate && onNavigate("semantic")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.blue + "44", background: C.blue + "15", color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>◆ Semantic Engine →</button>
      </div>

      {/* Hero score */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, marginBottom: 20 }}>
        <Card style={{ textAlign: "center", border: "1px solid " + geo.verdictColor + "44", padding: "24px 32px" }}>
          <ScoreCircle score={geo.overall} size={110} />
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>{geo.verdictIcon}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: geo.verdictColor }}>{geo.verdict}</span>
          </div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>GEO Score</div>
        </Card>

        <Card>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>What AI Systems Look For</div>
          <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.7, marginBottom: 12 }}>
            AI Overviews, ChatGPT, Gemini, and Perplexity cite businesses that have: clear entity definition (ontology), confirmed authority (reviews), geographic specificity, and standalone sentences they can extract as citations.
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "AI Overviews", icon: "G", color: "#4285F4" },
              { label: "ChatGPT", icon: "◆", color: "#10a37f" },
              { label: "Gemini", icon: "✦", color: "#886cf5" },
              { label: "Perplexity", icon: "P", color: "#1fb8cd" },
            ].map(ai => (
              <div key={ai.label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: ai.color + "15", border: "1px solid " + ai.color + "33", borderRadius: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: ai.color }}>{ai.icon}</span>
                <span style={{ fontSize: 10, color: ai.color, fontWeight: 600 }}>{ai.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Factor breakdown */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>Citability Factors</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {geo.factors.map(f => {
            const pct = Math.round((f.score / f.max) * 100);
            const col = statusColor[f.status];
            return (
              <div key={f.id} style={{ background: C.bg, border: "1px solid " + col + "22", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{f.label}</span>
                    <Badge label={f.status === "pass" ? "✓ Pass" : f.status === "warn" ? "⚠ Needs Work" : "✗ Fail"} color={col} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 900, color: col }}>{f.score}/{f.max}</span>
                </div>
                <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ width: pct + "%", height: "100%", background: col, transition: "width 0.3s" }} />
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>{f.detail}</div>
                <div style={{ fontSize: 11, color: C.cyan, fontWeight: 600 }}>→ {f.tip}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick actions */}
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>⚡ Quick Actions to Improve GEO Score</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {geo.factors.filter(f => f.status !== "pass").slice(0, 4).map(f => (
            <div key={f.id} style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 11, color: C.cyan }}>{f.tip}</div>
            </div>
          ))}
          {geo.factors.filter(f => f.status !== "pass").length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 20, color: C.green, fontSize: 13, fontWeight: 700 }}>
              ✓ All factors passing — profile is AI-ready!
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
