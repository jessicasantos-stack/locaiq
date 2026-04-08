"use client";
import { useState, useMemo } from "react";
import { C } from "../constants/colors";
import { Card, ScoreCircle } from "../shared";
import { calcScores, calcSemantic } from "../utils/scoring";
import DiagnosticWizard from "./DiagnosticWizard";
import ActionPlan30Days from "./ActionPlan30Days";
import RecoveryTracker from "./RecoveryTracker";

export default function RescueMode({ client, onNavigate, t }) {
  const [activeStep, setActiveStep] = useState("triage");
  const [diagnosis, setDiagnosis] = useState(null);

  const scores = useMemo(() => calcScores(client), [client]);
  const semantic = useMemo(() => calcSemantic(client), [client]);

  // Determine if client needs rescue
  const reviewTotal = client.reviewsData?.total || 0;
  const last30 = client.reviewsData?.last30days || 0;
  const negUnans = client.reviewsData?.negativeUnanswered || 0;
  const lp = client.posts?.[0]?.date ? Math.floor((new Date() - new Date(client.posts[0].date)) / 86400000) : 999;

  const urgencySignals = [];
  if (scores.overall < 40) urgencySignals.push({ text: "Critical score: " + scores.overall, level: "critical" });
  if (!client.verified) urgencySignals.push({ text: "Profile not verified", level: "critical" });
  if (negUnans > 0) urgencySignals.push({ text: negUnans + " unanswered negative reviews", level: "critical" });
  if (last30 === 0 && reviewTotal > 10) urgencySignals.push({ text: "Zero reviews this month", level: "high" });
  if (lp > 30) urgencySignals.push({ text: "No posts for " + (lp === 999 ? "never" : lp + " days"), level: "high" });
  if (semantic.score < 35) urgencySignals.push({ text: "AI Mode inaccessible: " + semantic.score, level: "high" });

  const needsRescue = urgencySignals.some(s => s.level === "critical") || urgencySignals.length >= 3;

  const steps = [
    { id: "triage", label: "Triage", icon: "!" },
    { id: "diagnostic", label: "Diagnosis", icon: "◎" },
    { id: "plan", label: "30-Day Plan", icon: "◷" },
    { id: "tracker", label: "Tracking", icon: "↗" },
  ];

  function handleDiagnosticComplete(results) {
    setDiagnosis(results);
    setActiveStep("plan");
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: needsRescue ? C.red : C.text }}>
            {needsRescue ? "⚠ " : ""}Rescue Mode — {client.name}
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            GBP profile rescue and recovery protocol
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onNavigate && onNavigate("compliance")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.orange + "44", background: C.orange + "15", color: C.orange, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>◈ Compliance</button>
          <button onClick={() => onNavigate && onNavigate("attention")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.blue + "44", background: C.blue + "15", color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>! Attention</button>
        </div>
      </div>

      {/* Step tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.bgCard, borderRadius: 10, padding: 4, border: "1px solid " + C.border }}>
        {steps.map((s, i) => {
          const isActive = activeStep === s.id;
          const isPast = steps.findIndex(st => st.id === activeStep) > i;
          return (
            <button key={s.id} onClick={() => setActiveStep(s.id)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 7, border: "none", background: isActive ? (needsRescue ? C.red : C.blue) + "22" : "transparent", color: isActive ? (needsRescue ? C.red : C.blue) : isPast ? C.green : C.textMuted, fontSize: 12, fontWeight: isActive ? 700 : 400, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <span style={{ fontSize: 11 }}>{isPast ? "✓" : s.icon}</span> {s.label}
            </button>
          );
        })}
      </div>

      {/* ═══ TRIAGE ═══ */}
      {activeStep === "triage" && (
        <>
          {/* Quick health snapshot */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
            <Card style={{ textAlign: "center", border: "1px solid " + (needsRescue ? C.red : C.green) + "44" }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Profile Status</div>
              <ScoreCircle score={scores.overall} size={100} />
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "inline-block", background: (needsRescue ? C.red : C.green) + "22", color: needsRescue ? C.red : C.green, borderRadius: 8, padding: "4px 14px", fontSize: 13, fontWeight: 700, border: "1px solid " + (needsRescue ? C.red : C.green) + "44" }}>
                  {needsRescue ? "NEEDS RESCUE" : "STABLE"}
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Urgency Signals</div>
              {urgencySignals.length === 0 ? (
                <div style={{ background: C.green + "10", border: "1px solid " + C.green + "33", borderRadius: 10, padding: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>Profile stable</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>No critical signals detected. Keep monitoring.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {urgencySignals.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: (s.level === "critical" ? C.red : "#ff8c00") + "08", border: "1px solid " + (s.level === "critical" ? C.red : "#ff8c00") + "22", borderRadius: 8 }}>
                      <span style={{ color: s.level === "critical" ? C.red : "#ff8c00", fontWeight: 700 }}>
                        {s.level === "critical" ? "🔴" : "🟠"}
                      </span>
                      <span style={{ fontSize: 12, color: C.text }}>{s.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Quick metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { l: "Score", v: scores.overall, c: scores.overall >= 60 ? C.green : scores.overall >= 40 ? C.yellow : C.red },
              { l: "AI Mode", v: semantic.score, c: semantic.score >= 50 ? C.green : semantic.score >= 30 ? C.yellow : C.red },
              { l: "Reviews", v: reviewTotal, c: reviewTotal >= 20 ? C.green : C.yellow },
              { l: "Velocity", v: last30 + "/mo", c: last30 >= 3 ? C.green : last30 >= 1 ? C.yellow : C.red },
              { l: "Neg/Unans", v: negUnans, c: negUnans === 0 ? C.green : C.red },
            ].map(m => (
              <Card key={m.l} style={{ textAlign: "center", padding: "12px 8px" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: m.c }}>{m.v}</div>
                <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>{m.l}</div>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <button onClick={() => setActiveStep("diagnostic")}
            style={{ width: "100%", padding: "16px 0", borderRadius: 10, border: "none", background: needsRescue ? C.red : C.blue, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {needsRescue ? "⚠ Start Emergency Diagnosis" : "Run Preventive Diagnosis"} →
          </button>
        </>
      )}

      {/* ═══ DIAGNOSTIC ═══ */}
      {activeStep === "diagnostic" && (
        <DiagnosticWizard client={client} onComplete={handleDiagnosticComplete} />
      )}

      {/* ═══ ACTION PLAN ═══ */}
      {activeStep === "plan" && (
        <ActionPlan30Days client={client} diagnosis={diagnosis} />
      )}

      {/* ═══ RECOVERY TRACKER ═══ */}
      {activeStep === "tracker" && (
        <RecoveryTracker client={client} />
      )}
    </div>
  );
}
