"use client";
import { useMemo } from "react";
import { C } from "../constants/colors";
import { Card, Badge, ScoreCircle } from "../shared";
import { calcScores, calcSemantic, calcSemanticAlignment } from "../utils/scoring";

// ─── Recovery Timeline ──────────────────────────────────────
const TIMELINE = [
  { week: "Days 1-7", label: "Week 1", expect: "Critical fixes applied, activity signals sent", milestone: "Emergency resolved" },
  { week: "Days 7-14", label: "Week 2", expect: "Review velocity starts rising, first recovery signals", milestone: "Reviews flowing" },
  { week: "Days 14-21", label: "Week 3", expect: "Entity strengthened, corrected citations propagating", milestone: "Entity reinforced" },
  { week: "Days 21-30", label: "Week 4", expect: "Visible ranking recovery, behavioral metrics rising", milestone: "Ranking recovering" },
  { week: "Days 30-60", label: "Month 2", expect: "Stabilization in new position, review momentum established", milestone: "Stabilization" },
];

const METRICS = [
  { id: "score", label: "GBP Score", icon: "◎", target: "80+", unit: "/100" },
  { id: "semantic", label: "AI Mode", icon: "◆", target: "70+", unit: "/100" },
  { id: "alignment", label: "Semantic Alignment", icon: "◐", target: "60+", unit: "/100" },
  { id: "reviews", label: "Reviews Total", icon: "⭐", target: "50+", unit: "" },
  { id: "velocity", label: "Reviews/Month", icon: "↗", target: "5+", unit: "/mo" },
  { id: "photos", label: "Photos", icon: "◫", target: "20+", unit: "" },
  { id: "posts", label: "Último Post", icon: "📢", target: "<7 dias", unit: "" },
  { id: "response", label: "Response Rate", icon: "◈", target: "95%+", unit: "" },
];

export default function RecoveryTracker({ client }) {
  const scores = useMemo(() => calcScores(client), [client]);
  const semantic = useMemo(() => calcSemantic(client), [client]);
  const sa = useMemo(() => calcSemanticAlignment(client), [client]);

  const reviewTotal = client.reviewsData?.total || 0;
  const last30 = client.reviewsData?.last30days || 0;
  const withResponse = client.reviewsData?.withResponse || 0;
  const responseRate = reviewTotal > 0 ? Math.round((withResponse / reviewTotal) * 100) : 0;
  const photosTotal = client.photos?.total || 0;
  const lastPostDays = client.posts?.[0]?.date ? Math.floor((new Date() - new Date(client.posts[0].date)) / 86400000) : 999;

  const metricValues = {
    score: { value: scores.overall, target: 80, color: scores.overall >= 80 ? C.green : scores.overall >= 50 ? C.yellow : C.red },
    semantic: { value: semantic.score, target: 70, color: semantic.score >= 70 ? C.green : semantic.score >= 40 ? C.yellow : C.red },
    alignment: { value: sa.score, target: 60, color: sa.score >= 60 ? C.green : sa.score >= 35 ? C.yellow : C.red },
    reviews: { value: reviewTotal, target: 50, color: reviewTotal >= 50 ? C.green : reviewTotal >= 20 ? C.yellow : C.red },
    velocity: { value: last30, target: 5, color: last30 >= 5 ? C.green : last30 >= 2 ? C.yellow : C.red },
    photos: { value: photosTotal, target: 20, color: photosTotal >= 20 ? C.green : photosTotal >= 10 ? C.yellow : C.red },
    posts: { value: lastPostDays === 999 ? "Never" : lastPostDays + "d", target: 7, color: lastPostDays <= 7 ? C.green : lastPostDays <= 14 ? C.yellow : C.red, raw: lastPostDays },
    response: { value: responseRate, target: 95, color: responseRate >= 95 ? C.green : responseRate >= 70 ? C.yellow : C.red },
  };

  // Health assessment
  const healthyMetrics = Object.values(metricValues).filter(m => m.color === C.green).length;
  const warningMetrics = Object.values(metricValues).filter(m => m.color === C.yellow).length;
  const criticalMetrics = Object.values(metricValues).filter(m => m.color === C.red).length;
  const healthScore = Math.round((healthyMetrics / METRICS.length) * 100);

  const healthStatus = healthScore >= 75 ? "recovering" : healthScore >= 40 ? "in_progress" : "critical";
  const statusConfig = {
    recovering: { color: C.green, label: "Recovering", icon: "↗", desc: "Metrics trending positive. Stick to the plan." },
    in_progress: { color: C.yellow, label: "In Progress", icon: "→", desc: "Some metrics still need attention." },
    critical: { color: C.red, label: "Critical", icon: "↘", desc: "Multiple metrics below target. Intensify actions." },
  };
  const st = statusConfig[healthStatus];

  return (
    <div>
      {/* Status header */}
      <Card style={{ marginBottom: 16, border: "1px solid " + st.color + "44" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <ScoreCircle score={healthScore} size={90} />
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>Recovery Health</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20, color: st.color }}>{st.icon}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: st.color }}>{st.label}</span>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>{st.desc}</div>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 11, color: C.green }}>✓ {healthyMetrics} no target</span>
              <span style={{ fontSize: 11, color: C.yellow }}>! {warningMetrics} attention</span>
              <span style={{ fontSize: 11, color: C.red }}>✕ {criticalMetrics} critical</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {METRICS.map(m => {
          const mv = metricValues[m.id];
          const atTarget = mv.color === C.green;
          return (
            <Card key={m.id} style={{ padding: "14px 12px", textAlign: "center", border: "1px solid " + mv.color + "33" }}>
              <div style={{ fontSize: 12, marginBottom: 6 }}>{m.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: mv.color }}>
                {typeof mv.value === "number" ? mv.value : mv.value}
              </div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{m.label}</div>
              <div style={{ marginTop: 6, fontSize: 9, color: atTarget ? C.green : C.textMuted, fontWeight: 600 }}>
                {atTarget ? "✓ Target" : "Target: " + m.target}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recovery timeline */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>Expected Recovery Timeline</div>
        {TIMELINE.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < TIMELINE.length - 1 ? "1px solid " + C.border : "none" }}>
            <div style={{ width: 80, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>{t.label}</div>
              <div style={{ fontSize: 9, color: C.textMuted }}>{t.week}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: C.text, marginBottom: 3 }}>{t.expect}</div>
              <Badge label={t.milestone} color={C.cyan} />
            </div>
          </div>
        ))}
      </Card>

      {/* 7.14 — Velocity Monitor */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>📈 Velocity Monitor</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>
          Tracking review and content velocity — the two strongest signals for recovery
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Review velocity */}
          <div style={{ background: C.bg, borderRadius: 10, padding: "16px 14px", border: "1px solid " + (last30 >= 5 ? C.green : last30 >= 2 ? C.yellow : C.red) + "33" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>REVIEW VELOCITY</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: last30 >= 5 ? C.green : last30 >= 2 ? C.yellow : C.red }}>{last30}</span>
              <span style={{ fontSize: 12, color: C.textMuted }}>/month</span>
            </div>
            <div style={{ marginTop: 8, height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: Math.min(100, (last30 / 5) * 100) + "%", height: "100%", background: last30 >= 5 ? C.green : last30 >= 2 ? C.yellow : C.red, transition: "width 0.3s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: C.textMuted }}>
              <span>0</span><span style={{ color: C.green }}>Target: 5+</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>
              {last30 >= 5 ? "✓ Healthy velocity — maintain this rate" : last30 >= 2 ? "⚠ Below target — activate review request process" : "🚨 Critical — zero momentum. Send SMS/email to last 10 customers now."}
            </div>
          </div>
          {/* Post velocity */}
          <div style={{ background: C.bg, borderRadius: 10, padding: "16px 14px", border: "1px solid " + (lastPostDays <= 7 ? C.green : lastPostDays <= 14 ? C.yellow : C.red) + "33" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>POST FREQUENCY</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: lastPostDays <= 7 ? C.green : lastPostDays <= 14 ? C.yellow : C.red }}>{lastPostDays === 999 ? "∞" : lastPostDays}</span>
              <span style={{ fontSize: 12, color: C.textMuted }}>days since last</span>
            </div>
            <div style={{ marginTop: 8, height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: Math.min(100, lastPostDays <= 7 ? 100 : lastPostDays <= 14 ? 60 : lastPostDays <= 30 ? 30 : 5) + "%", height: "100%", background: lastPostDays <= 7 ? C.green : lastPostDays <= 14 ? C.yellow : C.red, transition: "width 0.3s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: C.textMuted }}>
              <span style={{ color: C.green }}>Target: ≤7 days</span><span>30+</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>
              {lastPostDays <= 7 ? "✓ Active — keep posting weekly" : lastPostDays <= 14 ? "⚠ Publish today — posts expire visibility after 7 days" : "🚨 Profile appears inactive. Publish immediately with seasonal content."}
            </div>
          </div>
        </div>
      </Card>

      {/* 7.15 — Events Timeline */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>📅 Events Timeline</div>
        <div style={{ position: "relative", paddingLeft: 24 }}>
          <div style={{ position: "absolute", left: 7, top: 0, bottom: 0, width: 2, background: C.border }} />
          {[
            { time: "Today", text: "Rescue Mode activated — diagnostic started", color: C.blue, icon: "🚨" },
            ...(last30 === 0 ? [{ time: "Last 30d", text: "Zero new reviews received", color: C.red, icon: "⭐" }] : [{ time: "Last 30d", text: `${last30} review(s) received`, color: last30 >= 3 ? C.green : C.yellow, icon: "⭐" }]),
            ...(lastPostDays > 14 ? [{ time: lastPostDays + "d ago", text: "Last GBP post published", color: C.orange, icon: "📢" }] : []),
            ...((client.reviewsData?.negativeUnanswered || 0) > 0 ? [{ time: "Pending", text: `${client.reviewsData.negativeUnanswered} negative review(s) awaiting response`, color: C.red, icon: "💬" }] : []),
            ...(scores.overall < 50 ? [{ time: "Current", text: `Score at ${scores.overall}/100 — below healthy threshold`, color: C.red, icon: "📊" }] : []),
            ...(semantic.score < 40 ? [{ time: "Current", text: `AI Mode at ${semantic.score}/100 — not eligible for AI Overviews`, color: C.orange, icon: "🧠" }] : []),
            { time: "Next", text: "Complete diagnostic → generate 30-day action plan", color: C.cyan, icon: "→" },
          ].map((evt, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14, position: "relative" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: evt.color + "22", border: "2px solid " + evt.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, flexShrink: 0, position: "absolute", left: -24 + 7 - 8, top: 2 }} />
              <div style={{ flex: 1, paddingLeft: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12 }}>{evt.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: evt.color }}>{evt.time}</span>
                </div>
                <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{evt.text}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Critical alert if no recovery after 30 days */}
      <Card style={{ padding: "14px 16px", border: "1px solid " + C.yellow + "33" }}>
        <div style={{ fontSize: 11, color: C.yellow, fontWeight: 600, marginBottom: 4 }}>If there is no improvement after 30 days:</div>
        <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
          The problem is likely structural (undetected suspension, insurmountable proximity filter, or permanently increased competition). Pivot to: long-tail keywords + secondary categories where the competitor does not compete.
        </div>
      </Card>
    </div>
  );
}
