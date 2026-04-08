"use client";
import { useState, useMemo } from "react";
import { C, sc, tagColors } from "../constants/colors";
import { calcScores, calcSemantic, daysSince } from "../utils/scoring";
import ScoreDonut from "../shared/ScoreDonut";
import MiniBar from "../shared/MiniBar";

export default function AgencyDashboard({ profiles, onSelectProfile, isConnected = true, isLoading = false, onConnectGoogle, error }) {
  const allScores = useMemo(() => profiles.map(p => ({ ...p, scores: calcScores(p), semantic: calcSemantic(p) })), [profiles]);
  const avgScore = Math.round(allScores.reduce((s, p) => s + p.scores.overall, 0) / allScores.length);
  const topPerformers = allScores.filter(p => p.scores.overall >= 70).length;
  const needsWork = allScores.filter(p => p.scores.overall < 50).length;
  const urgentTasks = profiles.reduce((s, p) => s + (p.pendingTasks || 0), 0);
  const [sortBy, setSortBy] = useState("score");
  const [filterTag, setFilterTag] = useState("all");
  const [search, setSearch] = useState("");

  const sorted = [...allScores].sort((a, b) => {
    if (sortBy === "score") return b.scores.overall - a.scores.overall;
    if (sortBy === "reviews") return b.reviews.total - a.reviews.total;
    if (sortBy === "tasks") return (b.pendingTasks||0) - (a.pendingTasks||0);
    if (sortBy === "aimode") return b.semantic.score - a.semantic.score;
    return 0;
  }).filter(p => filterTag === "all" || (p.tags || []).includes(filterTag))
    .filter(p => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (p.businessName || "").toLowerCase().includes(q) ||
             (p.category || "").toLowerCase().includes(q) ||
             (p.city || p.address || "").toLowerCase().includes(q);
    });
  const allTags = [...new Set(profiles.flatMap(p => p.tags || []))];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Space Grotesk', system-ui", padding: "28px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, background: `linear-gradient(135deg,${C.blue},${C.cyan})`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📍</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 22, color: C.text }}><span style={{ fontFamily: "var(--font-zenith), 'Orbitron', sans-serif", letterSpacing: 4 }}>ZENITH</span> <span style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>Agency Edition</span></div>
            <div style={{ fontSize: 13, color: C.muted }}>Multi-client panel · {profiles.length} active profiles</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted, fontSize: 14 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients, city, category..."
              style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, outline: "none", width: 240 }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14 }}>✕</button>}
          </div>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 16px", fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }}/><span>All Systems Active</span>
          </div>
          <button onClick={() => onSelectProfile(profiles[0])} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${C.blue},${C.cyan})`, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>Enter Dashboard →</button>
        </div>
      </div>

      {/* Google Connection Banner */}
      {!isConnected && (
        <div style={{ background: `linear-gradient(135deg, ${C.blue}15, ${C.cyan}15)`, border: `1px solid ${C.blue}33`, borderRadius: 14, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>Conecte sua conta Google Business Profile</div>
            <div style={{ fontSize: 12, color: C.muted }}>Para carregar seus clientes reais, conecte sua conta Google com acesso ao GBP.</div>
          </div>
          <button onClick={onConnectGoogle} disabled={isLoading}
            style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${C.blue},${C.cyan})`, color: "#fff", fontWeight: 700, fontSize: 13, cursor: isLoading ? "wait" : "pointer", whiteSpace: "nowrap", opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? "Connecting..." : "Connect Google"}
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: `${C.red}10`, border: `1px solid ${C.red}33`, borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: C.red, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {isLoading && (
        <div style={{ textAlign: "center", padding: "40px 0", marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: C.muted, fontWeight: 600 }}>Carregando clientes do Google Business Profile...</div>
        </div>
      )}

      <div className="grid-cols-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Clients", value: profiles.length, color: C.blue },
          { label: "Average GBP Score", value: `${avgScore}/100`, color: sc(avgScore) },
          { label: "Top Performers", value: topPerformers, color: C.green },
          { label: "Needs Attention", value: needsWork, color: needsWork > 0 ? C.red : C.green },
          { label: "Pending Tasks", value: urgentTasks, color: urgentTasks > 10 ? C.red : C.yellow },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6, fontWeight: 600 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Portfolio Score Distribution</div>
        <div style={{ display: "flex", gap: 0, height: 40, borderRadius: 10, overflow: "hidden" }}>
          {[
            { label: "Excellent (80+)", count: allScores.filter(p => p.scores.overall >= 80).length, color: C.green },
            { label: "Good (65-79)", count: allScores.filter(p => p.scores.overall >= 65 && p.scores.overall < 80).length, color: C.cyan },
            { label: "Fair (45-64)", count: allScores.filter(p => p.scores.overall >= 45 && p.scores.overall < 65).length, color: C.yellow },
            { label: "Weak (<45)", count: allScores.filter(p => p.scores.overall < 45).length, color: C.red },
          ].map(seg => seg.count > 0 && (
            <div key={seg.label} style={{ flex: seg.count, background: seg.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }} title={`${seg.label}: ${seg.count} profiles`}>{seg.count}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
          {[{l:"Excellent (80+)",c:C.green},{l:"Good (65-79)",c:C.cyan},{l:"Fair (45-64)",c:C.yellow},{l:"Weak (<45)",c:C.red}].map(l => (
            <div key={l.l} style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: l.c }}/><span style={{ fontSize: 10, color: C.muted }}>{l.l}</span></div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Sort:</span>
        {[{id:"score",label:"By Score"},{id:"reviews",label:"By Reviews"},{id:"tasks",label:"By Tasks"},{id:"aimode",label:"By AI Mode"}].map(s => (
          <button key={s.id} onClick={() => setSortBy(s.id)} style={{ background: sortBy === s.id ? `${C.blue}22` : C.bgCard, border: `1px solid ${sortBy === s.id ? C.blue : C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: sortBy === s.id ? C.blue : C.muted, cursor: "pointer" }}>{s.label}</button>
        ))}
        <div style={{ width: 1, height: 20, background: C.border }}/>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Filter:</span>
        {["all", ...allTags].map(tag => (
          <button key={tag} onClick={() => setFilterTag(tag)} style={{ background: filterTag === tag ? `${(tagColors[tag]||C.blue)}22` : C.bgCard, border: `1px solid ${filterTag === tag ? (tagColors[tag]||C.blue) : C.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600, color: filterTag === tag ? (tagColors[tag]||C.blue) : C.muted, cursor: "pointer" }}>{tag === "all" ? "All" : tag}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
        {sorted.map(profile => {
          const s = profile.scores;
          const sem = profile.semantic;
          const lp = profile.posts[0]?.date ? daysSince(profile.posts[0].date) : 999;
          const urgentIssues = [];
          if (profile.reviews.negativeUnanswered > 0) urgentIssues.push("Unanswered reviews");
          if (lp > 30) urgentIssues.push("No posts in 30+ days");
          if (profile.photos.total < 10) urgentIssues.push("Few photos");
          const borderDefault = urgentIssues.length > 0 ? C.red + "33" : C.border;
          return (
            <div key={profile.id} style={{ background: C.bgCard, border: "1px solid " + borderDefault, borderRadius: 14, padding: 18, cursor: "pointer", transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s", position: "relative", overflow: "hidden" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue + "88"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(59,130,246,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = borderDefault; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, " + sc(s.overall) + ", " + sc(sem.score) + ")" }}/>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                <ScoreDonut score={s.overall} size={54}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.businessName}</span>
                    {profile.verified && <span style={{ color: C.blue, fontSize: 13, flexShrink: 0 }}>✔</span>}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.category} · {profile.address}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {(profile.tags || []).map(tag => (
                      <span key={tag} style={{ background: (tagColors[tag]||C.blue)+"22", color: tagColors[tag]||C.blue, borderRadius: 5, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[{label:"Reviews",value:s.review},{label:"AI Mode",value:sem.score},{label:"Posts",value:s.post}].map(m => (
                  <div key={m.label} style={{ background: C.bg, borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: C.muted }}>{m.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: sc(m.value) }}>{m.value}</span>
                    </div>
                    <MiniBar value={m.value}/>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 12, color: C.text }}><span style={{ color: C.yellow }}>⭐</span> {profile.reviews.average} ({profile.reviews.total})</span>
                  <span style={{ fontSize: 12, color: C.text }}><span style={{ color: C.blue }}>📸</span> {profile.photos.total}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {urgentIssues.length > 0 && <span style={{ background: C.red+"22", color: C.red, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>⚠ {urgentIssues.length} alerts</span>}
                  <button onClick={() => onSelectProfile(profile)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "linear-gradient(135deg," + C.blue + "," + C.cyan + ")", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Open →</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {allScores.some(p => p.reviews.negativeUnanswered > 0 || (p.posts[0]?.date ? daysSince(p.posts[0].date) : 999) > 60) && (
        <div style={{ background: C.bgCard, border: `1px solid ${C.red}22`, borderRadius: 14, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.red, marginBottom: 12 }}>🚨 Agency Alerts</div>
          {allScores.filter(p => p.reviews.negativeUnanswered > 0).map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.text }}><strong>{p.businessName}</strong>: {p.reviews.negativeUnanswered} unanswered negative review(s)</span>
              <button onClick={() => onSelectProfile(p)} style={{ background: C.red, color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Fix →</button>
            </div>
          ))}
          {allScores.filter(p => (p.posts[0]?.date ? daysSince(p.posts[0].date) : 999) > 60).map(p => (
            <div key={p.id + "-post"} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.text }}><strong>{p.businessName}</strong>: No posts in {p.posts[0]?.date ? daysSince(p.posts[0].date) : "90"}+ days</span>
              <button onClick={() => onSelectProfile(p)} style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Fix →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
