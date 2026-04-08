"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { Badge, StatCard } from "../shared";
import { calcScores, calcSemantic } from "../utils/scoring";

export default function AttentionRequired({ client, allClients, onSelectClient, onNavigate, t }) {
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("clients"); // "clients" | "tasks"

  // Evaluate all clients for attention items
  const evaluated = (allClients || []).map(p => {
    const scores = calcScores(p);
    const sem = calcSemantic(p);
    const lp = p.posts?.[0]?.date ? Math.floor((new Date() - new Date(p.posts[0].date)) / 86400000) : 999;
    const negUnans = p.reviews?.negativeUnanswered || 0;
    const photosOld = p.photos?.lastUpload ? Math.floor((new Date() - new Date(p.photos.lastUpload)) / 86400000) : 999;

    const items = [];
    if (negUnans > 0) items.push({ level: "critical", text: t.attNegReviews(negUnans), tab: "reviews", icon: "🚨", fix: "Respond now" });
    if (lp === 999) items.push({ level: "critical", text: t.attNoPost, tab: "posts", icon: "📢", fix: "Create 1st post" });
    if (lp > 30 && lp < 999) items.push({ level: "high", text: t.attOldPost(lp), tab: "posts", icon: "📢", fix: "Publish post" });
    if (scores.overall < 40) items.push({ level: "critical", text: t.attScoreCritical(scores.overall), tab: "overview", icon: "📊", fix: "View Overview" });
    if (!p.verified) items.push({ level: "critical", text: "Profile not verified by Google", tab: "info", icon: "⚠", fix: "Verify GBP" });
    if (sem.score < 35) items.push({ level: "high", text: "AI Mode inaccessible: " + sem.score + "/100", tab: "aimode", icon: "🧠", fix: "Optimize" });
    if ((p.photos?.total || 0) < 5) items.push({ level: "high", text: t.attFewPhotos(p.photos?.total || 0), tab: "photos", icon: "📸", fix: "Add photos" });
    if (photosOld > 180) items.push({ level: "medium", text: t.attOldPhoto(photosOld), tab: "photos", icon: "📸", fix: "Upload foto" });
    // 7.5 — Trigger Rescue when score drops >15% from stored history
    const storageKey = `zenith_score_history_${p.id || "default"}`;
    let scoreDrop = 0;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const hist = JSON.parse(saved);
        if (Array.isArray(hist) && hist.length >= 2) {
          const prev = hist[hist.length - 2]?.score || 0;
          const curr = scores.overall;
          if (prev > 0) scoreDrop = Math.round(((prev - curr) / prev) * 100);
        }
      }
    } catch {}
    if (scoreDrop >= 15) items.push({ level: "critical", text: `Score dropped ${scoreDrop}% — Rescue Mode recommended`, tab: "rescue", icon: "🚨", fix: "Start Rescue" });

    if (scores.overall >= 40 && sem.score >= 35 && lp <= 30 && negUnans === 0 && scoreDrop < 15) items.push({ level: "ok", text: t.attGoodProfile(scores.overall), tab: "brain", icon: "✅", fix: null });

    const topLevel = items.find(i => i.level === "critical") ? "critical"
      : items.find(i => i.level === "high") ? "high"
      : items.find(i => i.level === "medium") ? "medium" : "ok";

    return { ...p, scores, sem, items, topLevel, criticalCount: items.filter(i => i.level === "critical").length };
  });

  // Sort: critical first, then by score
  const sorted = [...evaluated].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, ok: 3 };
    if (order[a.topLevel] !== order[b.topLevel]) return order[a.topLevel] - order[b.topLevel];
    return a.scores.overall - b.scores.overall;
  });

  const filtered = sorted.filter(p =>
    filter === "all" ? true :
    filter === "critical" ? p.topLevel === "critical" :
    filter === "attention" ? (p.topLevel === "high" || p.topLevel === "medium") :
    p.topLevel === "ok"
  );

  const statusColor = { critical: C.red, high: C.orange, medium: C.yellow, ok: C.green };
  const statusLabel = { critical: t.critical, high: t.high, medium: t.medium, ok: t.ok };

  const criticalTotal = evaluated.filter(p => p.topLevel === "critical").length;
  const highTotal = evaluated.filter(p => p.topLevel === "high").length;
  const okTotal = evaluated.filter(p => p.topLevel === "ok").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 4 }}>⚠ Attention Required</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>All {evaluated.length} profiles — sorted by urgency</div>
        </div>
        {/* View toggle */}
        <div style={{ display: "flex", gap: 0, background: C.bgCard, border: "1px solid " + C.border, borderRadius: 8, padding: 3 }}>
          {[["clients", "By Client"], ["tasks", "Task Queue"]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              background: view === v ? C.blue : "transparent",
              color: view === v ? "#fff" : C.textMuted,
              fontSize: 12, fontWeight: 600, transition: "all 0.15s",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Critical" value={criticalTotal} color={criticalTotal > 0 ? C.red : C.green} delta={criticalTotal > 0 ? t.immediateAction : t.none} up={criticalTotal === 0} />
        <StatCard label="High Priority" value={highTotal} color={highTotal > 0 ? C.orange : C.green} />
        <StatCard label="In Order" value={okTotal} color={C.green} delta={okTotal + "/" + evaluated.length + " profiles"} up />
        <StatCard label="Monitored Profiles" value={evaluated.length} color={C.blue} />
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["all", "All"], ["critical", "🚨 Critical"], ["attention", "⚠ Attention"], ["ok", "✓ OK"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid " + (filter === v ? C.blue : C.border), background: filter === v ? C.blue + "22" : "transparent", color: filter === v ? C.blue : C.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {/* ── TASK QUEUE VIEW ── */}
      {view === "tasks" ? (() => {
        const levelColor2 = { critical: C.red, high: C.orange, medium: C.yellow };
        const taskGroups = [
          {
            id: "reviews", icon: "!", label: t.attNegLabel, level: "critical",
            clients: evaluated.filter(p => (p.reviews?.negativeUnanswered || 0) > 0)
              .map(p => ({ ...p, detail: p.reviews.negativeUnanswered + " open negative(s)", tab: "reviews", fix: "Respond" }))
          },
          {
            id: "posts-none", icon: ">", label: t.attNoPostLabel, level: "critical",
            clients: evaluated.filter(p => !(p.posts?.[0]?.date))
              .map(p => ({ ...p, detail: "Never published", tab: "posts", fix: "Create post" }))
          },
          {
            id: "posts-old", icon: ">", label: "Outdated post (30d+)", level: "high",
            clients: evaluated.filter(p => {
              const lp = p.posts?.[0]?.date ? Math.floor((new Date() - new Date(p.posts[0].date)) / 86400000) : 999;
              return lp > 30 && lp < 999;
            }).map(p => {
              const lp = Math.floor((new Date() - new Date(p.posts[0].date)) / 86400000);
              return { ...p, detail: t.attOldPostLabel(lp), tab: "posts", fix: "Publish" };
            })
          },
          {
            id: "score", icon: "~", label: t.attScoreLabel, level: "critical",
            clients: evaluated.filter(p => p.scores.overall < 40)
              .map(p => ({ ...p, detail: "Score: " + p.scores.overall + "/100", tab: "overview", fix: "View analysis" }))
          },
          {
            id: "photos", icon: "[]", label: "Insufficient or outdated photos", level: "high",
            clients: evaluated.filter(p => {
              const old2 = p.photos?.lastUpload ? Math.floor((new Date() - new Date(p.photos.lastUpload)) / 86400000) : 999;
              return (p.photos?.total || 0) < 5 || old2 > 180;
            }).map(p => {
              const old2 = p.photos?.lastUpload ? Math.floor((new Date() - new Date(p.photos.lastUpload)) / 86400000) : 999;
              const detail = (p.photos?.total || 0) < 5 ? t.attFewPhotosLabel(p.photos?.total || 0) : t.attOldPhotoLabel(old2);
              return { ...p, detail, tab: "photos", fix: "Upload photos" };
            })
          },
          {
            id: "aimode", icon: "#", label: t.attAILow, level: "high",
            clients: evaluated.filter(p => p.sem.score < 35)
              .map(p => ({ ...p, detail: "AI Mode: " + p.sem.score + "/100", tab: "aimode", fix: "Optimize" }))
          },
        ].filter(g => g.clients.length > 0);

        const totalTasks = taskGroups.reduce((a, g) => a + g.clients.length, 0);

        return (
          <div>
            <div style={{ marginBottom: 16, padding: "10px 14px", background: C.blue + "10", border: "1px solid " + C.blue + "33", borderRadius: 8, fontSize: 13, color: C.textDim }}>
              {totalTasks} pending actions in {taskGroups.length} {taskGroups.length === 1 ? "category" : "categories"} — click to go directly to the profile
            </div>
            {taskGroups.map(group => (
              <div key={group.id} style={{ marginBottom: 14, background: C.bgCard, border: "1px solid " + (levelColor2[group.level] || C.border) + "33", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "11px 16px", borderBottom: "1px solid " + C.border, display: "flex", alignItems: "center", gap: 10, background: (levelColor2[group.level] || C.border) + "0a" }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: levelColor2[group.level] || C.textMuted }}>{group.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text, flex: 1 }}>{group.label}</span>
                  <span style={{ background: (levelColor2[group.level] || C.border) + "22", color: levelColor2[group.level] || C.textMuted, fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 10 }}>{group.clients.length} {group.clients.length === 1 ? "profile" : "profiles"}</span>
                </div>
                {group.clients.map((p, i) => (
                  <div key={p.id} style={{ padding: "10px 16px", borderBottom: i < group.clients.length - 1 ? "1px solid " + C.border + "55" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: (p.scores.overall >= 60 ? C.green : p.scores.overall >= 40 ? C.yellow : C.red) + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: p.scores.overall >= 60 ? C.green : p.scores.overall >= 40 ? C.yellow : C.red }}>{p.scores.overall}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.businessName || p.name}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{p.detail}</div>
                    </div>
                    <button
                      onClick={() => { if (onSelectClient) onSelectClient(p); if (onNavigate) setTimeout(() => onNavigate(p.tab), 120); }}
                      style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid " + (levelColor2[group.level] || C.border) + "55", background: (levelColor2[group.level] || C.border) + "10", color: levelColor2[group.level] || C.cyan, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {p.fix} →
                    </button>
                  </div>
                ))}
              </div>
            ))}
            {taskGroups.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: C.green, fontSize: 15, fontWeight: 700 }}>All profiles are in good shape!</div>
            )}
          </div>
        );
      })() : (
      <div>
      {/* Client cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((p, idx) => (
          <div key={p.id} style={{ background: C.bgCard, border: "1px solid " + (p.topLevel === "critical" ? C.red + "44" : p.topLevel === "high" ? C.orange + "33" : C.border), borderRadius: 14, overflow: "hidden" }}>
            {/* Header bar */}
            <div style={{ height: 3, background: "linear-gradient(90deg," + statusColor[p.topLevel] + "," + statusColor[p.topLevel] + "88)" }} />
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                {/* Score donut */}
                <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                  <svg width="48" height="48" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="24" cy="24" r="19" fill="none" stroke={C.border} strokeWidth="5" />
                    <circle cx="24" cy="24" r="19" fill="none" stroke={p.scores.overall >= 80 ? C.green : p.scores.overall >= 50 ? C.yellow : C.red} strokeWidth="5"
                      strokeDasharray={2 * Math.PI * 19}
                      strokeDashoffset={2 * Math.PI * 19 * (1 - p.scores.overall / 100)}
                      strokeLinecap="round" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: p.scores.overall >= 80 ? C.green : p.scores.overall >= 50 ? C.yellow : C.red }}>
                    {p.scores.overall}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{p.businessName}</span>
                    {p.verified && <span style={{ color: C.blue, fontSize: 12 }}>✔</span>}
                    <Badge label={statusLabel[p.topLevel]} color={statusColor[p.topLevel]} />
                    {p.criticalCount > 0 && <Badge label={p.criticalCount + " critical"} color={C.red} />}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>{p.category} · {p.city || p.address?.split(",")[0]}</div>

                  {/* Action items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {p.items.filter(i => i.level !== "ok").slice(0, 3).map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, flexShrink: 0 }}>{item.icon}</span>
                        <span style={{ fontSize: 12, color: statusColor[item.level], flex: 1 }}>{item.text}</span>
                        <button
                          onClick={() => { if (onSelectClient) onSelectClient(p); if (onNavigate) setTimeout(() => onNavigate(item.tab), 100); }}
                          style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid " + statusColor[item.level] + "44", background: statusColor[item.level] + "15", color: statusColor[item.level], fontSize: 10, fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
                          {item.fix} →
                        </button>
                      </div>
                    ))}
                    {p.topLevel === "ok" && (
                      <div style={{ fontSize: 12, color: C.green }}>✓ {p.items.find(i => i.level === "ok")?.text}</div>
                    )}
                  </div>
                </div>

                {/* Go to profile */}
                <button onClick={() => onSelectClient && onSelectClient(p)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid " + C.border, background: "transparent", color: C.cyan, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                  Open →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontWeight: 700, color: C.green, marginBottom: 4 }}>{t.noItems}</div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}

