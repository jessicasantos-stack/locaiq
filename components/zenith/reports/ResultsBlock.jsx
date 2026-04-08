"use client";
import { C } from "../constants/colors";
import { narrateInteractions, narrateGrowthJourney } from "./reportNarrative";

/**
 * Results Block — Profile interaction data
 * compact: big numbers for calls/routes/clicks (Story)
 * detailed: breakdown with deltas (Pro)
 * timeline: 6-month evolution chart (Growth)
 */
export default function ResultsBlock({ data, variant = "compact" }) {
  const { interactions, monthHistory } = data;
  const total = interactions.calls + interactions.routes + interactions.clicks;
  const prevTotal = interactions.prevCalls + interactions.prevRoutes + interactions.prevClicks;
  const totalDelta = total - prevTotal;

  if (variant === "compact") {
    return (
      <div style={{ background: `${C.cyan}10`, border: `1px solid ${C.cyan}33`, borderRadius: 12, padding: "20px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>People Who Found You on Google</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: C.cyan, marginBottom: 4 }}>{total}</div>
        <div style={{ fontSize: 13, color: totalDelta >= 0 ? C.green : C.red, fontWeight: 600 }}>
          {totalDelta >= 0 ? "+" : ""}{totalDelta} vs last month
        </div>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>Profile Interactions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Phone Calls", value: interactions.calls, prev: interactions.prevCalls, delta: interactions.callsDelta, color: C.cyan },
            { label: "Direction Requests", value: interactions.routes, prev: interactions.prevRoutes, delta: interactions.routesDelta, color: C.blue },
            { label: "Website Clicks", value: interactions.clicks, prev: interactions.prevClicks, delta: interactions.clicksDelta, color: C.purple },
          ].map(m => (
            <div key={m.label} style={{ background: C.bg, borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4, fontWeight: 600 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: m.delta >= 0 ? C.green : C.red, marginTop: 4, fontWeight: 600 }}>
                {m.delta >= 0 ? "+" : ""}{m.delta} vs last month
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.7 }}>{narrateInteractions(interactions)}</div>
      </div>
    );
  }

  // timeline — for Growth model
  if (variant === "timeline") {
    const maxCalls = Math.max(...monthHistory.map(m => m.calls), 1);
    return (
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Profile Activity — Last 6 Months</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>{narrateGrowthJourney(monthHistory)}</div>

        {/* Calls trend bar chart */}
        <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>Phone Calls per Month</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, marginBottom: 8 }}>
          {monthHistory.map((m, i) => {
            const h = Math.max(8, Math.round((m.calls / maxCalls) * 85));
            const isLast = i === monthHistory.length - 1;
            return (
              <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: isLast ? C.cyan : C.textMuted, fontWeight: 700 }}>{m.calls}</span>
                <div style={{ width: "100%", height: h, background: isLast ? `${C.cyan}55` : `${C.blue}33`, borderRadius: "4px 4px 0 0", border: isLast ? `2px solid ${C.cyan}` : "none" }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {monthHistory.map((m, i) => (
            <div key={m.month} style={{ flex: 1, textAlign: "center", fontSize: 10, color: i === monthHistory.length - 1 ? C.cyan : C.textMuted, fontWeight: i === monthHistory.length - 1 ? 700 : 400 }}>{m.month}</div>
          ))}
        </div>

        {/* Score + Reviews + Photos summary per month */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${monthHistory.length},1fr)`, gap: 6 }}>
          {monthHistory.map((m, i) => {
            const isLast = i === monthHistory.length - 1;
            const col = m.score >= 70 ? C.green : m.score >= 50 ? C.yellow : C.red;
            return (
              <div key={m.month + "-stats"} style={{ background: isLast ? `${C.cyan}08` : C.bg, borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: col }}>{m.score}</div>
                <div style={{ fontSize: 8, color: C.textMuted, marginBottom: 4 }}>score</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>{m.reviews}</div>
                <div style={{ fontSize: 8, color: C.textMuted, marginBottom: 4 }}>reviews</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.purple }}>{m.photos}</div>
                <div style={{ fontSize: 8, color: C.textMuted }}>photos</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
