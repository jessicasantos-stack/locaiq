"use client";
import { useMemo } from "react";
import { C } from "../constants/colors";
import { Card, Badge, ProgressBar, ScoreCircle, Rec } from "../shared";
import { AIAnalysisPanel } from "../ai";
import { analyzeCompliance } from "../analysis/ComplianceGuard";

export default function Overview({ client, onNavigate, t }) {
  const sc2 = client.scoresData || {};
  const sem = client.semanticData || {};
  const sa = client.semanticAlignmentData || {};
  const compliance = useMemo(() => analyzeCompliance(client), [client]);
  const reviewTotal = client.reviewsData?.total ?? 0;
  const reviewLast30 = client.reviewsData?.last30days ?? 0;
  const clientRating = client.rating ?? 0;

  // Dynamic leak attrs from real semantic score
  const leakAttrs = [
    { attr: "location_score", value: sem.geoTerms >= 3 ? "0.87" : sem.geoTerms >= 1 ? "0.61" : "0.24", status: sem.geoTerms >= 3 ? "Strong" : sem.geoTerms >= 1 ? "Medium" : "Weak" },
    { attr: "place_mention_score", value: reviewTotal >= 50 ? "0.78" : "0.44", status: reviewTotal >= 50 ? "Strong" : "Medium" },
    { attr: "NAP_consistency_score", value: client.website ? "0.82" : "0.51", status: client.website ? "Strong" : "Medium" },
    { attr: "entity_rating_score", value: clientRating >= 4.5 ? "0.91" : clientRating >= 4.0 ? "0.72" : "0.48", status: clientRating >= 4.5 ? "Strong" : clientRating >= 4.0 ? "Medium" : "Weak" },
    { attr: "navboost", value: reviewLast30 >= 5 ? "0.69" : "0.38", status: reviewLast30 >= 5 ? "Medium" : "Weak" },
    { attr: "has_store_visit_signal", value: reviewTotal >= 20 ? "true" : "false", status: reviewTotal >= 20 ? "Strong" : "Weak" },
    { attr: "business_category_match", value: (client.secondaryCategories?.length ?? 0) >= 2 ? "0.94" : "0.71", status: (client.secondaryCategories?.length ?? 0) >= 2 ? "Strong" : "Medium" },
  ];

  // Specific impact recommendations
  const recs = [];
  if (sc2.desc < 65) recs.push({ type: "error", text: t.descRec(sc2.desc), tab: "profilehub" });
  if (sc2.post < 55) recs.push({ type: "error", text: t.postRec(sc2.post), tab: "profilehub" });
  const negativeUnanswered = client.reviewsData?.negativeUnanswered ?? 0;
  if (negativeUnanswered > 0) recs.push({ type: "error", text: t.negReviewRec(negativeUnanswered), tab: "reviewintel" });
  if (sc2.photo < 65) recs.push({ type: "warn", text: t.photoRec(sc2.photo, Math.max(0, 20 - (client.photos?.total ?? 0))), tab: "profilehub" });
  if (sem.score < 60) recs.push({ type: "warn", text: t.aiModeRec(sem.score), tab: "semantic" });
  if (sa.score > 0 && sa.score < 50) recs.push({ type: "warn", text: t.semanticRec(sa.score, sa.gaps), tab: "semantic" });
  if (reviewTotal < 20) recs.push({ type: "warn", text: t.fewReviewsRec(reviewTotal), tab: "reviewintel" });
  if (sc2.basic >= 80 && sc2.review >= 70 && sc2.photo >= 70) recs.push({ type: "ok", text: t.profileWellStructured(client.score), tab: "semantic" });
  recs.push({ type: "tip", text: "Use the Optimize tab to generate a semantic description and posts with AI in seconds.", tab: "profilehub" });

  const pillars = [
    { label: "Description", v: sc2.desc || 0, tab: "profilehub" },
    { label: "Photos", v: sc2.photo || 0, tab: "profilehub" },
    { label: "Posts", v: sc2.post || 0, tab: "profilehub" },
    { label: "Reviews", v: sc2.review || 0, tab: "reviewintel" },
    { label: "Basic Info", v: sc2.basic || 0, tab: "profilehub" },
    { label: "AI Mode", v: sem.score || 0, tab: "semantic" },
    { label: "Semantic Alignment", v: sa.score || 0, tab: "semantic" },
    { label: "Compliance", v: compliance.score || 0, tab: "compliance" },
    { label: "Triangulation", v: Math.min(100, (sem.triTerms || 0) * 20), tab: "semantic" },
    { label: "Geo Signals", v: Math.min(100, (sem.geoTerms || 0) * 22), tab: "semantic" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Overview — {client.name}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onNavigate && onNavigate("impact")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.blue + "44", background: C.blue + "15", color: C.blue, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>⚡ Simulate Impact</button>
          <button onClick={() => onNavigate && onNavigate("profilehub")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.cyan + "44", background: C.cyan + "15", color: C.cyan, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✨ Optimize with AI</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Overall Profile Score</div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <ScoreCircle score={client.score} size={110} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: C.textDim, marginBottom: 5 }}>Category: <span style={{ color: C.text }}>{client.category}</span></div>
              <div style={{ fontSize: 13, color: C.textDim, marginBottom: 5 }}>City: <span style={{ color: C.text }}>{client.city}</span></div>
              <div style={{ fontSize: 13, color: C.textDim, marginBottom: 5 }}>Reviews: <span style={{ color: C.text }}>{client.reviewsData?.total || client.reviews || 0}</span> <span style={{ color: C.yellow }}>({client.rating} ★)</span></div>
              <div style={{ fontSize: 13, color: C.textDim, marginBottom: 5 }}>Photos: <span style={{ color: C.text }}>{client.photos?.total || 0}</span></div>
              <div style={{ fontSize: 13, color: C.textDim }}>Website: <span style={{ color: C.cyan, fontSize: 11 }}>{client.website || "Not filled in"}</span></div>
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(client.secondaryCategories || []).map(c => <Badge key={c} label={c} color={C.purple} />)}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Attributes — Google API Leak</div>
          {leakAttrs.map(a => (
            <div key={a.attr} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 11, color: C.textDim, fontFamily: "'JetBrains Mono', monospace" }}>{a.attr}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{a.value}</span>
                <Badge label={a.status} color={a.status === "Strong" ? C.green : a.status === "Medium" ? C.yellow : C.red} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 16 }}>{t.scoreBySectionClick}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 40px" }}>
          {pillars.map(p => {
            const col = p.v >= 80 ? C.green : p.v >= 50 ? C.yellow : C.red;
            return (
              <div key={p.label} onClick={() => onNavigate && onNavigate(p.tab)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: C.textDim }}>{p.label}</span>
                  <span style={{ color: col, fontWeight: 700 }}>{p.v}/100</span>
                </div>
                <ProgressBar value={p.v} color={col} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>{"⚡ " + t.recsWithImpact}</div>
        {recs.map((r, i) => <Rec key={i} type={r.type} text={r.text} />)}
      </Card>

      {client.scoresData && client.semanticData && (
        <AIAnalysisPanel data={client} scores={client.scoresData} semantic={client.semanticData} analysisType="overview" />
      )}
    </div>
  );
}

