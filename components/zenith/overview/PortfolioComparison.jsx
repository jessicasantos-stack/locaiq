"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { Card, Badge, StatCard } from "../shared";
import { calcScores, calcSemantic } from "../utils/scoring";

export default function PortfolioComparison({ client, allClients, onSelectClient }) {
  const [sortBy, setSortBy] = useState("score");
  const [selected, setSelected] = useState([]);
  const [view, setView] = useState("grid"); // grid | table | radar

  const allScored = (allClients || []).map(p => {
    const s = calcScores(p);
    const sem = calcSemantic(p);
    const lp = p.posts?.[0]?.date ? Math.floor((new Date() - new Date(p.posts[0].date)) / 86400000) : 999;
    return { ...p, s, sem, lp, responseRate: Math.round(((p.reviews?.withResponse || 0) / Math.max(p.reviews?.total || 1, 1)) * 100) };
  });

  const sortFns = {
    score: (a, b) => b.s.overall - a.s.overall,
    reviews: (a, b) => (b.reviews?.total || 0) - (a.reviews?.total || 0),
    rating: (a, b) => (b.reviews?.average || 0) - (a.reviews?.average || 0),
    aimode: (a, b) => b.sem.score - a.sem.score,
    posts: (a, b) => a.lp - b.lp,
    response: (a, b) => b.responseRate - a.responseRate,
  };

  const sorted = [...allScored].sort(sortFns[sortBy] || sortFns.score);

  const maxScore = Math.max(...allScored.map(p => p.s.overall));
  const avgScore = Math.round(allScored.reduce((s, p) => s + p.s.overall, 0) / allScored.length);
  const criticalCount = allScored.filter(p => p.s.overall < 50).length;
  const excellentCount = allScored.filter(p => p.s.overall >= 80).length;

  const metrics = [
    { id: "score", label: "GBP Score" }, { id: "reviews", label: "Reviews" },
    { id: "rating", label: "Rating" }, { id: "aimode", label: "AI Mode" },
    { id: "posts", label: "Posts" }, { id: "response", label: "Response %" },
  ];

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev);

  const compareClients = selected.length >= 2 ? allScored.filter(p => selected.includes(p.id)) : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 4 }}>Portfolio View — {allClients?.length} Perfis</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>Select up to 4 profiles to compare side by side</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["grid", "table"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid " + (view === v ? C.blue : C.border), background: view === v ? C.blue + "22" : "transparent", color: view === v ? C.blue : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{v === "grid" ? "🃏 Cards" : "📋 Table"}</button>
          ))}
        </div>
      </div>

      {/* Portfolio KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Average Score" value={avgScore} color={avgScore >= 70 ? C.green : avgScore >= 50 ? C.yellow : C.red} delta={"portfolio"} up={avgScore >= 70} />
        <StatCard label="Best Score" value={maxScore} color={C.green} delta={sorted[0]?.businessName?.split(" ")[0]} up />
        <StatCard label="Critical (<50)" value={criticalCount} color={criticalCount > 0 ? C.red : C.green} delta={criticalCount > 0 ? "Urgent attention" : "None"} up={criticalCount === 0} />
        <StatCard label="Excellent (80+)" value={excellentCount} color={C.cyan} delta={excellentCount + "/" + allClients?.length + " profiles"} up />
      </div>

      {/* Sort bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, marginRight: 4 }}>Sort:</span>
        {metrics.map(m => (
          <button key={m.id} onClick={() => setSortBy(m.id)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid " + (sortBy === m.id ? C.cyan : C.border), background: sortBy === m.id ? C.cyan + "22" : "transparent", color: sortBy === m.id ? C.cyan : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{m.label}</button>
        ))}
        {selected.length > 0 && <span style={{ fontSize: 11, color: C.yellow, marginLeft: 8 }}>{selected.length} selected</span>}
        {selected.length >= 2 && <button onClick={() => setSelected([])} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: C.textMuted, fontSize: 10, cursor: "pointer" }}>Clear</button>}
      </div>

      {/* Comparison panel */}
      {compareClients && (
        <Card style={{ marginBottom: 16, border: "1px solid " + C.cyan + "33" }}>
          <div style={{ fontWeight: 700, color: C.cyan, marginBottom: 14 }}>Comparison — {compareClients.map(p => p.businessName?.split(" ")[0]).join(" vs ")}</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: "6px 10px", textAlign: "left", color: C.textMuted, fontWeight: 700 }}>Metric</th>
                  {compareClients.map(p => <th key={p.id} style={{ padding: "6px 10px", textAlign: "center", color: C.text, fontWeight: 700 }}>{p.businessName?.split(" ")[0]}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "GBP Score", vals: compareClients.map(p => p.s.overall), unit: "/100", higher: true },
                  { label: "AI Mode", vals: compareClients.map(p => p.sem.score), unit: "/100", higher: true },
                  { label: "Reviews", vals: compareClients.map(p => p.reviews?.total || 0), unit: "", higher: true },
                  { label: "Rating", vals: compareClients.map(p => p.reviews?.average || 0), unit: "★", higher: true },
                  { label: "Resp. %", vals: compareClients.map(p => p.responseRate), unit: "%", higher: true },
                  { label: "Photos", vals: compareClients.map(p => p.photos?.total || 0), unit: "", higher: true },
                  { label: "Last Post", vals: compareClients.map(p => p.lp === 999 ? "Never" : p.lp + "d"), unit: "", higher: false, raw: true },
                ].map(row => {
                  const numVals = row.raw ? null : row.vals;
                  const best = numVals ? (row.higher ? Math.max(...numVals) : Math.min(...numVals)) : null;
                  return (
                    <tr key={row.label} style={{ borderTop: "1px solid " + C.border }}>
                      <td style={{ padding: "8px 10px", color: C.textMuted, fontWeight: 600 }}>{row.label}</td>
                      {row.vals.map((v, i) => {
                        const isBest = numVals && v === best;
                        return <td key={i} style={{ padding: "8px 10px", textAlign: "center", fontWeight: isBest ? 900 : 400, color: isBest ? C.green : C.textDim }}>{v}{!row.raw ? row.unit : ""}{isBest ? " 🏆" : ""}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Grid view */}
      {view === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {sorted.map((p, idx) => {
            const isSelected = selected.includes(p.id);
            const scoreColor = p.s.overall >= 80 ? C.green : p.s.overall >= 50 ? C.yellow : C.red;
            return (
              <div key={p.id} style={{ background: C.bgCard, border: "1px solid " + (isSelected ? C.cyan + "88" : C.border), borderRadius: 12, padding: 16, cursor: "pointer", transition: "all 0.2s", position: "relative" }}
                onClick={() => toggleSelect(p.id)}>
                {isSelected && <div style={{ position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: "50%", background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 900 }}>✓</div>}
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
                    <svg width="52" height="52" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="26" cy="26" r="21" fill="none" stroke={C.border} strokeWidth="5" />
                      <circle cx="26" cy="26" r="21" fill="none" stroke={scoreColor} strokeWidth="5"
                        strokeDasharray={2 * Math.PI * 21} strokeDashoffset={2 * Math.PI * 21 * (1 - p.s.overall / 100)} strokeLinecap="round" />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: scoreColor }}>{p.s.overall}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 2 }}>#{idx + 1} {p.businessName}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>{p.category?.split(" ")[0]} · {p.city || p.address?.split(",")[0]}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Badge label={"AI " + p.sem.score} color={C.purple} />
                      <Badge label={(p.reviews?.total || 0) + " rev"} color={C.yellow} />
                      <Badge label={p.responseRate + "% resp"} color={p.responseRate >= 80 ? C.green : C.red} />
                      {p.lp > 14 && <Badge label={p.lp === 999 ? "No posts" : p.lp + "d no post"} color={C.orange} />}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: C.border, overflow: "hidden" }}>
                    <div style={{ width: p.s.desc + "%", height: "100%", background: C.blue }} />
                  </div>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: C.border, overflow: "hidden" }}>
                    <div style={{ width: p.s.review + "%", height: "100%", background: C.yellow }} />
                  </div>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: C.border, overflow: "hidden" }}>
                    <div style={{ width: p.s.photo + "%", height: "100%", background: C.green }} />
                  </div>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: C.border, overflow: "hidden" }}>
                    <div style={{ width: p.s.post + "%", height: "100%", background: C.purple }} />
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onSelectClient && onSelectClient(p); }} style={{ width: "100%", marginTop: 10, padding: "6px 0", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: C.cyan, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  Open Dashboard →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Table view */}
      {view === "table" && (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid " + C.border }}>
                  {["#", "Business", "Score", "AI", "Reviews", "Rating", "Photos", "Posts", "Resp%", ""].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "center", color: C.textMuted, fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => {
                  const sc = p.s.overall >= 80 ? C.green : p.s.overall >= 50 ? C.yellow : C.red;
                  return (
                    <tr key={p.id} style={{ borderTop: "1px solid " + C.border }}>
                      <td style={{ padding: "10px", textAlign: "center", color: C.textMuted, fontWeight: 700 }}>#{i + 1}</td>
                      <td style={{ padding: "10px", minWidth: 140 }}>
                        <div style={{ fontWeight: 700, color: C.text, fontSize: 12 }}>{p.businessName}</div>
                        <div style={{ fontSize: 10, color: C.textMuted }}>{p.city || p.address?.split(",")[0]}</div>
                      </td>
                      <td style={{ padding: "10px", textAlign: "center", fontWeight: 900, color: sc, fontSize: 16 }}>{p.s.overall}</td>
                      <td style={{ padding: "10px", textAlign: "center", color: C.purple, fontWeight: 700 }}>{p.sem.score}</td>
                      <td style={{ padding: "10px", textAlign: "center", color: C.text }}>{p.reviews?.total || 0}</td>
                      <td style={{ padding: "10px", textAlign: "center", color: C.yellow }}>{p.reviews?.average || 0}★</td>
                      <td style={{ padding: "10px", textAlign: "center", color: C.text }}>{p.photos?.total || 0}</td>
                      <td style={{ padding: "10px", textAlign: "center", color: p.lp > 14 ? C.orange : C.green }}>{p.lp === 999 ? "—" : p.lp + "d"}</td>
                      <td style={{ padding: "10px", textAlign: "center", color: p.responseRate >= 80 ? C.green : C.red }}>{p.responseRate}%</td>
                      <td style={{ padding: "10px" }}>
                        <button onClick={() => onSelectClient && onSelectClient(p)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid " + C.border, background: "transparent", color: C.cyan, fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Open →</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

