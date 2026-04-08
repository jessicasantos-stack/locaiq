"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { C } from "../constants/colors";
import { Card } from "../shared";
import { calcScores, calcSemantic } from "../utils/scoring";
import { callClaude } from "../utils/ai";

export default function WeeklyDigest({ client, onNavigate, t, allClients, onSelectClient }) {
  const [view, setView] = useState("priorities"); // "priorities" | "autopilot"
  const [aiResults, setAiResults] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [aiOpen, setAiOpen] = useState({});
  const aiTriggered = useRef({});

  // ── Evaluate all clients ──
  const evaluated = useMemo(() => {
    return (allClients || []).map(p => {
      const s = calcScores(p);
      const sm = calcSemantic(p);
      const lp = p.posts?.[0]?.date
        ? Math.floor((new Date() - new Date(p.posts[0].date)) / 86400000)
        : 999;
      const items = [];
      if ((p.reviews?.negativeUnanswered || 0) > 0)
        items.push({ level: "critical", text: `${p.reviews.negativeUnanswered} negative review(s) without response`, tab: "reviewintel", action: "Respond now" });
      if (!p.posts?.length)
        items.push({ level: "critical", text: "No post published yet", tab: "profilehub", action: "Create first post" });
      else if (lp > 30)
        items.push({ level: "high", text: `Last post ${lp} days ago`, tab: "profilehub", action: "Publish post" });
      if (s.overall < 40)
        items.push({ level: "critical", text: `Critical score: ${Math.round(s.overall)}/100`, tab: "overview", action: "View audit" });
      else if (s.overall < 60)
        items.push({ level: "medium", text: `Medium score: ${Math.round(s.overall)}/100`, tab: "overview", action: "Optimize" });
      if (!p.verified)
        items.push({ level: "high", text: "Profile not verified", tab: "profilehub", action: "Verify" });
      if (sm.score < 35)
        items.push({ level: "high", text: `AI Mode low (${sm.score}/100)`, tab: "semantic", action: "Fix ontology" });
      if ((p.photos?.total || 0) < 5)
        items.push({ level: "medium", text: `Only ${p.photos?.total || 0} photos`, tab: "profilehub", action: "Add photos" });
      if (lp > 14 && lp <= 30)
        items.push({ level: "medium", text: `Last post ${lp} days ago`, tab: "profilehub", action: "Publish post" });
      // 7.13 — Score drop notification
      try {
        const hist = JSON.parse(localStorage.getItem(`zenith_score_history_${p.id || "default"}`) || "[]");
        if (hist.length >= 2) {
          const prev = hist[hist.length - 2]?.score || 0;
          const curr = s.overall;
          const dropPct = prev > 0 ? Math.round(((prev - curr) / prev) * 100) : 0;
          if (dropPct >= 15) items.push({ level: "critical", text: `Score dropped ${dropPct}% (${prev}→${curr}) — Rescue recommended`, tab: "rescue", action: "Start Rescue" });
          else if (dropPct >= 10) items.push({ level: "high", text: `Score dropped ${dropPct}% since last snapshot`, tab: "overview", action: "Investigate" });
        }
      } catch {}
      const topLevel = items.find(i => i.level === "critical") ? "critical"
        : items.find(i => i.level === "high") ? "high"
        : items.length ? "medium" : "ok";
      return { p, s, sm, items, topLevel, lp };
    });
  }, [allClients]);

  const withIssues = useMemo(() =>
    evaluated
      .filter(e => e.topLevel !== "ok")
      .sort((a, b) => {
        const o = { critical: 0, high: 1, medium: 2 };
        return (o[a.topLevel] ?? 3) - (o[b.topLevel] ?? 3);
      }), [evaluated]);

  // ── Agency KPIs ──
  const avgScore = useMemo(() => {
    if (!evaluated.length) return 0;
    return Math.round(evaluated.reduce((s, e) => s + e.s.overall, 0) / evaluated.length);
  }, [evaluated]);
  const totalProfiles = evaluated.length;
  const critCount = withIssues.filter(e => e.topLevel === "critical").length;
  const highCount = withIssues.filter(e => e.topLevel === "high").length;
  const healthyCount = evaluated.filter(e => e.topLevel === "ok").length;

  // ── Today's Priorities — top 5 most urgent actions across ALL clients ──
  const todaysPriorities = useMemo(() => {
    const all = [];
    evaluated.forEach(e => {
      e.items.forEach(item => {
        all.push({ ...item, client: e.p, score: e.s.overall });
      });
    });
    const levelWeight = { critical: 0, high: 1, medium: 2 };
    return all
      .sort((a, b) => (levelWeight[a.level] ?? 3) - (levelWeight[b.level] ?? 3))
      .slice(0, 5);
  }, [evaluated]);

  const levelColor = { critical: C.red, high: C.orange, medium: C.yellow };
  const levelLabel = { critical: "Emergency", high: "High", medium: "Medium" };
  const levelDot = { critical: "🔴", high: "🟠", medium: "🟡" };

  // ── Auto AI analysis ──
  useEffect(() => {
    withIssues.forEach(e => {
      if (!aiTriggered.current[e.p.id]) {
        aiTriggered.current[e.p.id] = true;
        analyzeClient(e);
      }
    });
  }, [withIssues]);

  async function analyzeClient(e) {
    const id = e.p.id;
    setAiLoading(prev => ({ ...prev, [id]: true }));
    const prompt = `GBP Profile: ${e.p.name} (${e.p.category}, ${e.p.city}).
Issues detected: ${e.items.map(i => i.text).join('; ')}.
Reply in 3 short sections (max 2 lines each):
**Problem:** describe what's wrong
**Why it matters:** impact on local ranking or visibility
**Fix:** specific, concrete action to resolve now`;
    const result = await callClaude(prompt, 350);
    setAiResults(prev => ({ ...prev, [id]: result }));
    setAiLoading(prev => ({ ...prev, [id]: false }));
  }

  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const avgScoreColor = avgScore >= 70 ? C.green : avgScore >= 50 ? C.yellow : C.red;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26 }}>🧠</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.text }}>Brain</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>Your agency's command center — {today}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 0, background: C.bgCard, border: "1px solid " + C.border, borderRadius: 8, padding: 3 }}>
          {[["priorities", "⚡ Priorities"], ["autopilot", "◎ Autopilot"]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer",
              background: view === v ? C.blue : "transparent",
              color: view === v ? "#fff" : C.textMuted,
              fontSize: 12, fontWeight: 600, transition: "all 0.15s",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ══════ AUTOPILOT VIEW ══════ */}
      {view === "autopilot" && (
        <div>
          {/* Status Grid — all profiles at a glance */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>◎ All Profiles — Status Board</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {evaluated.map(e => {
                const scoreCol = e.s.overall >= 70 ? C.green : e.s.overall >= 50 ? C.yellow : C.red;
                const statusDot = e.topLevel === "ok" ? "🟢" : e.topLevel === "critical" ? "🔴" : e.topLevel === "high" ? "🟠" : "🟡";
                return (
                  <div key={e.p.id} onClick={() => { if (onSelectClient) onSelectClient(e.p); }}
                    style={{ background: C.bg, border: "1px solid " + scoreCol + "22", borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{e.p.name}</span>
                      <span style={{ fontSize: 11 }}>{statusDot}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 22, fontWeight: 900, color: scoreCol }}>{Math.round(e.s.overall)}</span>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: C.textMuted }}>{e.p.reviewsData?.total || 0} reviews</div>
                        <div style={{ fontSize: 10, color: C.textMuted }}>{e.lp === 999 ? "No posts" : e.lp + "d ago"}</div>
                      </div>
                    </div>
                    {e.items.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 10, color: levelColor[e.topLevel] || C.textMuted }}>
                        {e.items.length} issue{e.items.length !== 1 ? "s" : ""} · {e.items[0]?.text?.slice(0, 40)}...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Event Feed — chronological */}
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📡 Event Feed</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>Recent events across all profiles — newest first</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {(() => {
                const events = [];
                evaluated.forEach(e => {
                  e.items.forEach(item => {
                    events.push({ ...item, clientName: e.p.name, clientId: e.p.id, client: e.p, score: e.s.overall });
                  });
                  // Add positive events too
                  if (e.topLevel === "ok") events.push({ level: "ok", text: "All metrics healthy", clientName: e.p.name, clientId: e.p.id, client: e.p, score: e.s.overall, tab: "overview", action: "View" });
                  // Post activity
                  if (e.lp > 0 && e.lp <= 7) events.push({ level: "ok", text: `Published post ${e.lp} day(s) ago`, clientName: e.p.name, clientId: e.p.id, client: e.p, score: e.s.overall, tab: "profilehub", action: "View" });
                });
                // Sort by severity, then alphabetically
                const lo = { critical: 0, high: 1, medium: 2, ok: 3 };
                return events.sort((a, b) => (lo[a.level] ?? 3) - (lo[b.level] ?? 3)).slice(0, 20);
              })().map((evt, i) => {
                const col = levelColor[evt.level] || C.green;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid " + C.border + "22" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0, boxShadow: "0 0 4px " + col + "66" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12, color: C.text }}>{evt.text}</span>
                      <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 8 }}>— {evt.clientName}</span>
                    </div>
                    <button onClick={() => {
                      if (onSelectClient) onSelectClient(evt.client);
                      setTimeout(() => { if (onNavigate) onNavigate(evt.tab); }, 120);
                    }} style={{ background: col + "15", color: col, border: "1px solid " + col + "33", borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {evt.action || "Fix"} →
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ══════ PRIORITIES VIEW ══════ */}
      {view === "priorities" && (<>

      {/* ── Agency KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Avg Score", value: avgScore, color: avgScoreColor, suffix: "/100" },
          { label: "Profiles", value: totalProfiles, color: C.cyan, suffix: "" },
          { label: "Healthy", value: healthyCount, color: C.green, suffix: "" },
          { label: "Critical", value: critCount, color: C.red, suffix: "" },
          { label: "Needs Work", value: highCount, color: C.orange, suffix: "" },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}<span style={{ fontSize: 11, fontWeight: 400, color: C.textMuted }}>{kpi.suffix}</span></div>
            <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Today's Priorities ── */}
      {todaysPriorities.length > 0 && (
        <Card style={{ marginBottom: 20, border: `1px solid ${C.blue}33` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>Today's Priorities</span>
            <span style={{ fontSize: 11, color: C.textMuted, marginLeft: "auto" }}>{todaysPriorities.length} action{todaysPriorities.length !== 1 ? "s" : ""}</span>
          </div>
          {todaysPriorities.map((item, idx) => {
            const col = levelColor[item.level] || C.textMuted;
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: idx > 0 ? `1px solid ${C.border}22` : "none" }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: `${col}22`, color: col, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11, flexShrink: 0 }}>{idx + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{item.text}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{item.client.name} · {item.client.city}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: col, whiteSpace: "nowrap" }}>{levelLabel[item.level]}</span>
                <button
                  onClick={() => {
                    if (onSelectClient) onSelectClient(item.client);
                    setTimeout(() => { if (onNavigate) onNavigate(item.tab); }, 120);
                  }}
                  style={{ background: `${col}22`, color: col, border: `1px solid ${col}55`, borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  {item.action} →
                </button>
              </div>
            );
          })}
        </Card>
      )}

      {/* ── All Good State ── */}
      {withIssues.length === 0 && (
        <Card style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🟢</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.green, marginBottom: 6 }}>
            All {evaluated.length} profiles in great shape!
          </div>
          <div style={{ fontSize: 13, color: C.textMuted }}>No pending actions at the moment.</div>
        </Card>
      )}

      {/* ── Client cards with issues ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {withIssues.map(e => {
          const col = levelColor[e.topLevel];
          const aiText = aiResults[e.p.id];
          const isLoading = aiLoading[e.p.id];
          const score = Math.round(e.s.overall);
          const scoreCol = score >= 70 ? C.green : score >= 50 ? C.yellow : C.red;
          return (
            <Card key={e.p.id} style={{ border: `1px solid ${col}44`, padding: 0, overflow: "hidden" }}>
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: `${col}11`, borderBottom: `1px solid ${col}33` }}>
                <span style={{ fontSize: 18 }}>{levelDot[e.topLevel]}</span>
                <span style={{ fontWeight: 800, fontSize: 15, color: C.text, flex: 1 }}>{e.p.name}</span>
                <span style={{ fontSize: 11, color: C.textMuted, marginRight: 6 }}>{e.p.city}</span>
                <span style={{ background: `${scoreCol}22`, color: scoreCol, fontWeight: 900, fontSize: 13, padding: "3px 10px", borderRadius: 20 }}>
                  {score}
                </span>
              </div>

              {/* Issue rows */}
              <div style={{ padding: "4px 0" }}>
                {e.items.map((item, idx) => {
                  const ic = levelColor[item.level] || C.textMuted;
                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: idx < e.items.length - 1 ? `1px solid ${C.border}22` : "none" }}>
                      <div
                        onClick={() => {
                          if (onSelectClient) onSelectClient(e.p);
                          setTimeout(() => { if (onNavigate) onNavigate(item.tab); }, 120);
                        }}
                        style={{ width: 10, height: 10, borderRadius: "50%", background: ic, flexShrink: 0, cursor: "pointer", boxShadow: `0 0 6px ${ic}99` }}
                      />
                      <span style={{ fontSize: 13, color: C.textDim, flex: 1 }}>{item.text}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: ic, minWidth: 68, textAlign: "right" }}>
                        {levelLabel[item.level]}
                      </span>
                      <button
                        onClick={() => {
                          if (onSelectClient) onSelectClient(e.p);
                          setTimeout(() => { if (onNavigate) onNavigate(item.tab); }, 120);
                        }}
                        style={{ background: `${ic}22`, color: ic, border: `1px solid ${ic}55`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        {item.action} →
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* AI diagnosis */}
              <div style={{ padding: "6px 16px 10px", borderTop: `1px solid ${C.border}22` }}>
                {isLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.purple, fontSize: 12, padding: "4px 0" }}>
                    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                    <span>Generating AI diagnosis...</span>
                  </div>
                )}
                {aiText && !isLoading && (
                  <div>
                    <button
                      onClick={() => setAiOpen(prev => ({ ...prev, [e.p.id]: !prev[e.p.id] }))}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", padding: "4px 0", fontSize: 11, color: C.purple, fontWeight: 600 }}>
                      <span style={{ transition: "transform .2s", transform: aiOpen[e.p.id] ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" }}>▶</span>
                      🤖 AI DIAGNOSIS
                    </button>
                    {aiOpen[e.p.id] && (
                      <div style={{ background: `${C.purple}11`, border: `1px solid ${C.purple}33`, borderRadius: 10, padding: "12px 14px", marginTop: 6 }}>
                        <pre style={{ fontSize: 12, color: C.textDim, whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.7 }}>{aiText}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      </>)}
    </div>
  );
}
