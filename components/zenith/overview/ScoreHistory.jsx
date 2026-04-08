"use client";
import { useState, useEffect } from "react";
import { C } from "../constants/colors";
import { Card, SectionTitle, Badge, StatCard } from "../shared";

export default function ScoreHistory({ client }) {
  const sc2 = client.scoresData || {};
  const sem = client.semanticData || {};
  const current = sc2.overall || client.score || 0;
  const storageKey = `zenith_score_history_${client.id || "default"}`;

  // localStorage persistence — real snapshots accumulate over time
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    // First visit — seed with deterministic 6-month simulated history
    const today = new Date();
    const clientSeed = String(client.id || "1").split("").reduce((a,c) => a + c.charCodeAt(0), 0);
    const sv = (i, r) => ((clientSeed * (i + 1) * 17) % (r * 2 + 1)) - r;
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const isoDate = d.toISOString().split("T")[0];
      const base = Math.max(20, current - 20 + Math.round(i * (20 / 5)));
      const score = Math.min(100, Math.max(10, i === 0 ? current : base + sv(i, 3)));
      const desc = i === 0 ? sc2.desc : Math.min(100, Math.max(10, (sc2.desc || 0) - i * 4 + sv(i+10, 2)));
      const review = i === 0 ? sc2.review : Math.min(100, Math.max(10, (sc2.review || 0) - i * 3 + sv(i+20, 2)));
      const photo = i === 0 ? sc2.photo : Math.min(100, Math.max(10, (sc2.photo || 0) - i * 5 + sv(i+30, 3)));
      const post = i === 0 ? sc2.post : Math.min(100, Math.max(5, (sc2.post || 0) - i * 8 + sv(i+40, 5)));
      months.push({ label, date: isoDate, score, desc, review, photo, post, isSimulated: i !== 0, isReal: i === 0 });
    }
    // Save seed immediately
    try { localStorage.setItem(storageKey, JSON.stringify(months)); } catch (e) {}
    return months;
  });

  const [saveMsg, setSaveMsg] = useState("");

  // Save current snapshot — called manually or auto on mount if today not recorded
  const saveSnapshot = () => {
    const today = new Date();
    const label = today.toLocaleString("en-US", { month: "short", year: "2-digit" });
    const isoDate = today.toISOString().split("T")[0];
    const newSnap = {
      label, date: isoDate,
      score: current,
      desc: sc2.desc || 0,
      review: sc2.review || 0,
      photo: sc2.photo || 0,
      post: sc2.post || 0,
      isReal: true,
      isSimulated: false,
    };

    setHistory(prev => {
      // Replace if same month already exists, else append
      const exists = prev.findIndex(h => h.label === label);
      const next = exists >= 0
        ? prev.map((h, i) => i === exists ? newSnap : h)
        : [...prev.slice(-11), newSnap]; // keep max 12 months
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    setSaveMsg("✓ Snapshot saved — " + label);
    setTimeout(() => setSaveMsg(""), 3000);
  };

  // Auto-save on first visit this month
  useEffect(() => {
    const today = new Date();
    const thisMonth = today.toLocaleString("en-US", { month: "short", year: "2-digit" });
    const hasThisMonth = history.some(h => h.label === thisMonth && h.isReal);
    if (!hasThisMonth) saveSnapshot();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  const clearHistory = () => {
    try { localStorage.removeItem(storageKey); } catch (e) {}
    // Re-seed
    const today = new Date();
    const clientSeed = String(client.id || "1").split("").reduce((a,c) => a + c.charCodeAt(0), 0);
    const sv = (i, r) => ((clientSeed * (i + 1) * 17) % (r * 2 + 1)) - r;
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const base = Math.max(20, current - 20 + Math.round(i * (20 / 5)));
      const score = Math.min(100, Math.max(10, i === 0 ? current : base + sv(i, 3)));
      months.push({ label, date: d.toISOString().split("T")[0], score, desc: Math.max(10, (sc2.desc||0) - i*4 + sv(i+10,2)), review: Math.max(10,(sc2.review||0)-i*3+sv(i+20,2)), photo: Math.max(10,(sc2.photo||0)-i*5+sv(i+30,3)), post: Math.max(5,(sc2.post||0)-i*8+sv(i+40,5)), isSimulated: i !== 0, isReal: i === 0 });
    }
    try { localStorage.setItem(storageKey, JSON.stringify(months)); } catch (e) {}
    setHistory(months);
    setSaveMsg("✓ History reset");
    setTimeout(() => setSaveMsg(""), 2000);
  };

  const maxScore = Math.max(...history.map(h => h.score));
  const minScore = Math.min(...history.map(h => h.score));
  const firstScore = history[0]?.score || current;
  const totalGrowth = current - firstScore;
  const realSnapshots = history.filter(h => h.isReal).length;

  // 7.6 — Detect sharp score drops between consecutive snapshots
  const sharpDrops = [];
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1].score;
    const curr = history[i].score;
    if (prev > 0) {
      const dropPct = Math.round(((prev - curr) / prev) * 100);
      if (dropPct >= 10) sharpDrops.push({ from: history[i-1].label, to: history[i].label, prev, curr, dropPct });
    }
  }

  const [hovered, setHovered] = useState(null);
  const [metric, setMetric] = useState("score");

  const metricColors = { score: C.blue, desc: C.cyan, review: C.yellow, photo: C.green, post: C.purple };
  const metricLabels = { score: "Overall", desc: "Description", review: "Reviews", photo: "Photos", post: "Posts" };

  // SVG chart
  const W = 560, H = 180, PAD = { t: 20, r: 20, b: 30, l: 40 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const vals = history.map(h => h[metric] || 0);
  const minV = Math.max(0, Math.min(...vals) - 10);
  const maxV = Math.min(100, Math.max(...vals) + 10);
  const xStep = history.length > 1 ? chartW / (history.length - 1) : chartW;
  const yScale = v => chartH - ((v - minV) / (maxV - minV || 1)) * chartH;
  const pts = history.map((h, i) => ({ x: PAD.l + i * xStep, y: PAD.t + yScale(h[metric] || 0), v: h[metric] || 0, label: h.label, isReal: h.isReal }));
  const pathD = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const areaD = pts.length > 1 ? `${pathD} L${pts[pts.length-1].x},${PAD.t + chartH} L${pts[0].x},${PAD.t + chartH} Z` : "";

  return (
    <div>
      <SectionTitle>Score History — {client.name}</SectionTitle>

      {saveMsg && (
        <div style={{ padding: "8px 14px", background: C.green + "15", border: "1px solid " + C.green + "33", borderRadius: 7, marginBottom: 14, fontSize: 12, color: C.green }}>{saveMsg}</div>
      )}

      {/* 7.6 — Sharp drop alert */}
      {sharpDrops.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {sharpDrops.map((drop, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.red + "10", border: "1px solid " + C.red + "33", borderRadius: 8, marginBottom: i < sharpDrops.length - 1 ? 6 : 0 }}>
              <span style={{ fontSize: 16 }}>📉</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>Sharp drop detected: −{drop.dropPct}%</span>
                <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 8 }}>{drop.from} ({drop.prev}) → {drop.to} ({drop.curr})</span>
              </div>
              {drop.dropPct >= 15 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: C.red, background: C.red + "22", padding: "3px 8px", borderRadius: 5 }}>RESCUE RECOMMENDED</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* localStorage badge */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, padding: "8px 14px", background: C.bgCard, border: "1px solid " + C.border, borderRadius: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: C.textDim }}>
          <strong style={{ color: C.green }}>Saved in browser</strong> — {realSnapshots} real snapshot(s) · {history.length - realSnapshots} simulated
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button onClick={saveSnapshot} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: C.blue, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>💾 Save Now</button>
          <button onClick={clearHistory} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: C.textMuted, fontSize: 11, cursor: "pointer" }}>Reset</button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Current Score" value={current} color={current >= 80 ? C.green : current >= 50 ? C.yellow : C.red} />
        <StatCard label="Growth" value={(totalGrowth > 0 ? "+" : "") + totalGrowth} color={totalGrowth > 0 ? C.green : C.red} delta={history[0]?.label + " → today"} up={totalGrowth > 0} />
        <StatCard label="Peak Score" value={maxScore} color={C.cyan} />
        <StatCard label="AI Mode" value={sem.score || 0} color={(sem.score || 0) >= 70 ? C.green : C.yellow} />
      </div>

      {/* Chart */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 600 }}>Score Evolution — {history.length} months</div>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.entries(metricLabels).map(([k, l]) => (
              <button key={k} onClick={() => setMetric(k)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid " + (metric === k ? metricColors[k] : C.border), background: metric === k ? metricColors[k] + "22" : "transparent", color: metric === k ? metricColors[k] : C.textMuted, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", overflowX: "auto" }}>
          <svg width={W} height={H} style={{ display: "block" }}>
            {[25, 50, 75, 100].map(v => {
              const y = PAD.t + yScale(v);
              if (y < PAD.t || y > PAD.t + chartH) return null;
              return (
                <g key={v}>
                  <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke={C.border} strokeDasharray="3,3" />
                  <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize="9" fill={C.textMuted}>{v}</text>
                </g>
              );
            })}
            {areaD && <path d={areaD} fill={metricColors[metric]} opacity="0.08" />}
            {pts.length > 1 && <path d={pathD} fill="none" stroke={metricColors[metric]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
            {pts.map((p, i) => (
              <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
                <circle cx={p.x} cy={p.y} r={hovered === i ? 7 : p.isReal ? 6 : 4}
                  fill={p.isReal ? metricColors[metric] : metricColors[metric] + "66"}
                  stroke={p.isReal ? C.bgCard : "none"} strokeWidth="2" />
                <text x={p.x} y={H - 6} textAnchor="middle" fontSize="9" fill={C.textMuted}>{p.label}</text>
                {hovered === i && (
                  <g>
                    <rect x={p.x - 24} y={p.y - 34} width={48} height={26} rx="4" fill={C.bgCard} stroke={metricColors[metric]} strokeWidth="1" />
                    <text x={p.x} y={p.y - 20} textAnchor="middle" fontSize="12" fontWeight="bold" fill={metricColors[metric]}>{p.v}</text>
                    <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="8" fill={p.isReal ? C.green : C.textMuted}>{p.isReal ? "real" : "sim"}</text>
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: metricColors[metric], border: "2px solid " + C.bgCard }} />
            <span style={{ color: C.textMuted }}>Real snapshot</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: metricColors[metric] + "66" }} />
            <span style={{ color: C.textMuted }}>Simulated data</span>
          </div>
        </div>
      </Card>

      {/* Section breakdown */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>Breakdown by Section</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ padding: "6px 8px", textAlign: "left", color: C.textMuted, fontWeight: 700, width: 70 }}>Section</th>
                {history.map(h => (
                  <th key={h.label} style={{ padding: "6px 8px", textAlign: "center", color: h.isReal ? C.text : C.textMuted, fontWeight: h.isReal ? 700 : 400 }}>
                    {h.label}{h.isReal ? " ●" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { key: "score", label: "Overall", color: C.blue },
                { key: "desc", label: "Desc.", color: C.cyan },
                { key: "review", label: "Reviews", color: C.yellow },
                { key: "photo", label: "Photos", color: C.green },
                { key: "post", label: "Posts", color: C.purple },
              ].map(row => (
                <tr key={row.key} style={{ borderTop: "1px solid " + C.border }}>
                  <td style={{ padding: "7px 8px", color: row.color, fontWeight: 700 }}>{row.label}</td>
                  {history.map(h => {
                    const v = h[row.key] || 0;
                    const col = v >= 80 ? C.green : v >= 50 ? C.yellow : C.red;
                    return (
                      <td key={h.label} style={{ padding: "7px 8px", textAlign: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: h.isReal ? 700 : 400, color: h.isReal ? col : col + "88" }}>{v}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Snapshot log */}
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>📌 Snapshot Log</div>
        {history.slice().reverse().map((snap, i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: "10px 0", borderBottom: i < history.length - 1 ? "1px solid " + C.border : "none", alignItems: "center" }}>
            <div style={{ width: 44, flexShrink: 0, fontSize: 11, color: snap.isReal ? C.cyan : C.textMuted, fontWeight: snap.isReal ? 700 : 400 }}>{snap.label}</div>
            <div style={{ flex: 1, fontSize: 12, color: snap.isReal ? C.textDim : C.textMuted }}>
              {snap.isReal ? "📸 Real snapshot recorded" : "〜 Simulated data (seed)"}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: snap.score >= 80 ? C.green : snap.score >= 50 ? C.yellow : C.red }}>{snap.score}</span>
              {snap.isReal && <Badge label="Real" color={C.green} />}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 12, fontSize: 11, color: C.textMuted, padding: "8px 12px", background: C.bg, borderRadius: 7 }}>
          💾 Data saved in browser localStorage. Every time you open this tab, a real snapshot is recorded automatically. With GBP API (P3.4), history will come from real Google data.
        </div>
      </Card>
    </div>
  );
}


