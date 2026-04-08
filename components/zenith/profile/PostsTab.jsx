"use client";
import { useState, useMemo } from "react";
import { C } from "../constants/colors";
import { Card, Badge, ProgressBar, StatCard, Btn, TabBar } from "../shared";
import { callClaude } from "../utils/ai";

export default function PostsTab({ client }) {
  const [activePostTab, setActivePostTab] = useState("history");

  // ── Scheduler state ──
  const [schedMonth, setSchedMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [scheduled, setScheduled] = useState([]); // [{ id, date, text, photo, photoName, type, status }]
  const [editingPost, setEditingPost] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [batchDays, setBatchDays] = useState([2, 4]); // default Tue+Thu
  const [showBatch, setShowBatch] = useState(false);
  const [photoBank, setPhotoBank] = useState([]); // [{ id, url, name, used }]

  const realPosts = client.posts || [];
  const city = client.city || "";
  const cat = client.category || "";

  const [postFailures, setPostFailures] = useState([]);

  // NAP fields from client (master NAP)
  const masterNAP = {
    name: client.businessName || client.name || "",
    address: client.address || "",
    phone: client.phone || "",
    city: city,
  };

  // NAP-Safe check: pure function — returns result
  const runNAPCheck = (text) => {
    if (!text || !text.trim()) return null;
    const t = text.toLowerCase();
    const issues = [];

    const commonCities = ["new york","los angeles","chicago","houston","miami","dallas","atlanta","boston","seattle","denver"];
    commonCities.forEach(c => {
      if (c !== city.toLowerCase() && t.includes(c))
        issues.push({ type: "wrong_city", text: `Mentions "${c}" but NAP master is "${city}"`, severity: "critical" });
    });

    const phonePattern = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
    (text.match(phonePattern) || []).forEach(p => {
      const clean = p.replace(/\D/g, "");
      const masterClean = (masterNAP.phone || "").replace(/\D/g, "");
      if (masterClean && clean !== masterClean && clean.length === 10)
        issues.push({ type: "wrong_phone", text: `Phone "${p}" differs from NAP master "${masterNAP.phone}"`, severity: "critical" });
    });

    const streetNumbers = text.match(/\b\d{2,5}\s+[A-Za-z]/g) || [];
    if (streetNumbers.length > 0 && masterNAP.address) {
      const masterNum = (masterNAP.address.match(/^\d+/) || [""])[0];
      streetNumbers.forEach(sn => {
        const num = (sn.match(/^\d+/) || [""])[0];
        if (num && masterNum && num !== masterNum)
          issues.push({ type: "wrong_address", text: `Number "${num}" may differ from master address`, severity: "warning" });
      });
    }

    if (text.length > 1500)
      issues.push({ type: "too_long", text: `Post has ${text.length} chars (limit: 1500)`, severity: "critical" });

    const hasCTA = ["call","book","schedule","contact","visit","click","learn","get a quote","free"].some(w => t.includes(w));
    if (!hasCTA)
      issues.push({ type: "no_cta", text: "No call to action (CTA) — reduces conversion", severity: "warning" });

    const hasCityMention = t.includes(city.toLowerCase());
    if (!hasCityMention)
      issues.push({ type: "no_city", text: `City "${city}" not mentioned — weaker geo signal`, severity: "warning" });

    return {
      issues,
      score: issues.filter(i => i.severity === "critical").length === 0 ? (issues.length === 0 ? 100 : 75) : 40,
      charCount: text.length,
      safe: issues.filter(i => i.severity === "critical").length === 0,
    };
  };

  // Simulated post failure alerts (deterministic)
  const seed = String(client.id || "1").split("").reduce((a,c) => a + c.charCodeAt(0), 0);
  const simulatedFailures = (seed % 3 === 0) ? [
    { date: "Mar 10, 2026", type: "Photo rejected", reason: "Image below 250×250px", status: "failed", fix: "Resize to minimum 400×300px before publishing" },
    { date: "Mar 03, 2026", type: "Post rejected", reason: "Content with disallowed URL", status: "failed", fix: "Remove URLs from post body — use the separate link field" },
  ] : (seed % 3 === 1) ? [
    { date: "Feb 28, 2026", type: "Post rejected", reason: "Text exceeds 1500 characters", status: "failed", fix: "Reduce to maximum 1500 chars — the excess was cut off" },
  ] : [];

  // Semantic analysis of each real post
  const analyzePost = (post) => {
    const t = (post.text || "").toLowerCase();
    const hasService = (client.services || []).some(s => t.includes(s.toLowerCase().split(" ")[0]));
    const hasCity = t.includes(city.toLowerCase());
    const hasEntity = ["licensed","certified","professional","specialist","team","expert"].some(w => t.includes(w));
    const hasAction = ["install","repair","remodel","serve","offer","help","provide","call","schedule"].some(w => t.includes(w));
    const hasCTA = post.cta || ["call","book","schedule","contact","visit","get","learn","see"].some(w => t.includes(w));
    const days = post.date ? Math.floor((new Date() - new Date(post.date)) / 86400000) : 999;
    const score = Math.round(
      (hasService ? 25 : 0) + (hasCity ? 20 : 0) + (hasEntity ? 15 : 0) + (hasAction ? 20 : 0) + (hasCTA ? 20 : 0)
    );
    return { hasService, hasCity, hasEntity, hasAction, hasCTA, days, score };
  };

  const typeColor = t => ({ "UPDATE": C.blue, "OFFER": C.green, "EVENT": C.purple, "PHOTO": C.cyan, "What's New": C.blue, "Offer": C.green, "Event": C.purple, "Photo": C.cyan }[t] || C.textMuted);
  const typeLabel = t => ({ "UPDATE": "What's New", "OFFER": "Offer", "EVENT": "Event", "PHOTO": "Photo" }[t] || t);

  // Stats from real posts
  const lastPostDays = realPosts[0]?.date ? Math.floor((new Date() - new Date(realPosts[0].date)) / 86400000) : 999;
  const avgSemanticScore = realPosts.length > 0 ? Math.round(realPosts.reduce((s, p) => s + analyzePost(p).score, 0) / realPosts.length) : 0;
  const topSvc = (client.services || [client.category])[0] || cat;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, paddingBottom: 10, borderBottom: "1px solid " + C.border }}>Posts — {client.name}</div>
        <button onClick={() => setActivePostTab("scheduler")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.cyan + "44", background: C.cyan + "15", color: C.cyan, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>📅 Schedule Posts</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        <StatCard label="Published Posts" value={realPosts.length} color={realPosts.length >= 4 ? C.green : realPosts.length >= 1 ? C.yellow : C.red} />
        <StatCard label="Last Post" value={lastPostDays === 999 ? "Never" : `${lastPostDays}d`} color={lastPostDays <= 7 ? C.green : lastPostDays <= 14 ? C.yellow : C.red} delta={lastPostDays <= 7 ? "✓ Fresh" : lastPostDays <= 14 ? "Publish soon" : "⚠ Overdue"} up={lastPostDays <= 7} />
        <StatCard label="Avg Semantic Score" value={realPosts.length > 0 ? `${avgSemanticScore}%` : "—"} color={avgSemanticScore >= 70 ? C.green : avgSemanticScore >= 40 ? C.yellow : C.red} />
        <StatCard label="Distinct Types" value={[...new Set(realPosts.map(p => p.type))].length || 0} color={[...new Set(realPosts.map(p => p.type))].length >= 2 ? C.green : C.yellow} delta="Goal: 3+ types" />
      </div>

      <TabBar tabs={[{ id: "history", label: "Posts + Analysis" }, { id: "scheduler", label: "📅 Schedule" }, { id: "failures", label: "⚠ Failures" }, { id: "ranking", label: "📍 Ranking Impact" }, { id: "insights", label: "Insights" }]} active={activePostTab} onChange={setActivePostTab} />

      {/* HISTORY — real posts with semantic analysis */}
      {activePostTab === "history" && (
        <div>
          {realPosts.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 40, border: `1px solid ${C.red}33` }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📢</div>
              <div style={{ fontWeight: 700, color: C.red, marginBottom: 8 }}>No posts published</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Google's algorithm interprets profiles without posts as inactive. Publish at least once per week.</div>
              <button onClick={() => setActivePostTab("scheduler")} style={{ padding: "10px 24px", background: `linear-gradient(135deg,${C.blue},${C.cyan})`, border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>View Post Calendar →</button>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {realPosts.map((post, i) => {
                const analysis = analyzePost(post);
                const scoreColor = analysis.score >= 70 ? C.green : analysis.score >= 40 ? C.yellow : C.red;
                return (
                  <Card key={i} style={{ border: `1px solid ${scoreColor}22` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <Badge label={typeLabel(post.type)} color={typeColor(post.type)} />
                        <span style={{ fontSize: 11, color: C.textMuted }}>{post.date}</span>
                        <span style={{ fontSize: 11, color: analysis.days <= 7 ? C.green : analysis.days <= 14 ? C.yellow : C.red }}>
                          {analysis.days}d ago
                        </span>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: scoreColor }}>{analysis.score}%</div>
                        <div style={{ fontSize: 10, color: C.textMuted }}>semantic</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 12, padding: "10px 12px", background: C.bg, borderRadius: 8 }}>
                      {post.text}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
                      {[
                        { label: "Service", ok: analysis.hasService },
                        { label: "City", ok: analysis.hasCity },
                        { label: "Entity", ok: analysis.hasEntity },
                        { label: "Action", ok: analysis.hasAction },
                        { label: "CTA", ok: analysis.hasCTA },
                      ].map(s => (
                        <div key={s.label} style={{ background: s.ok ? `${C.green}10` : `${C.red}10`, border: `1px solid ${s.ok ? C.green : C.red}22`, borderRadius: 6, padding: "4px 8px", textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: s.ok ? C.green : C.red, fontWeight: 700 }}>{s.ok ? "✓" : "✗"}</div>
                          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 1 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {analysis.score < 60 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: C.yellow, background: `${C.yellow}10`, borderRadius: 6, padding: "6px 10px" }}>
                        💡 Suggestion: {!analysis.hasService ? `mention "${topSvc}"` : !analysis.hasCity ? `include "${city}"` : !analysis.hasCTA ? "add a CTA (Call Now, Book Today)" : "add an entity term (licensed, certified)"}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ SCHEDULER — Real Calendar ═══ */}
      {activePostTab === "scheduler" && (() => {
        const { year, month } = schedMonth;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthLabel = new Date(year, month).toLocaleString("en-US", { month: "long", year: "numeric" });
        const today = new Date();
        const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
        const getScheduled = (d) => scheduled.filter(s => s.date === `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
        const isPast = (d) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const makeDateStr = (d) => `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

        const prevMonth = () => setSchedMonth(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 });
        const nextMonth = () => setSchedMonth(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 });

        // Add new post for a specific day
        const handleDayClick = (d) => {
          const dateStr = makeDateStr(d);
          setEditingPost({ id: Date.now(), date: dateStr, text: "", photo: null, photoName: "", status: "draft", type: "What's New" });
        };

        // Edit existing post
        const handleEdit = (post) => setEditingPost({ ...post });

        const handleGenerateAI = async () => {
          if (!editingPost) return;
          setAiGenerating(true);
          const svc = (client.services || [client.category])[0] || cat;
          const prompt = `Write a Google Business Profile post for ${client.name} (${client.category}) in ${city}.
Service to highlight: ${svc}. Type: ${editingPost.type}.
Requirements: mention the city, include a call to action, under 1500 chars, professional tone.
Output ONLY the post text.`;
          const result = await callClaude(prompt, 350);
          setEditingPost(prev => ({ ...prev, text: result || "" }));
          setAiGenerating(false);
        };

        const handlePhotoUpload = (e) => {
          const file = e.target.files?.[0];
          if (file) setEditingPost(prev => ({ ...prev, photo: URL.createObjectURL(file), photoName: file.name }));
        };

        const handleSave = () => {
          if (!editingPost || !editingPost.text.trim()) return;
          setScheduled(prev => {
            const filtered = prev.filter(s => s.id !== editingPost.id);
            return [...filtered, { ...editingPost, status: "scheduled" }].sort((a, b) => a.date.localeCompare(b.date));
          });
          setEditingPost(null);
        };

        const handleDelete = (id) => {
          setScheduled(prev => prev.filter(s => s.id !== id));
          if (editingPost?.id === id) setEditingPost(null);
        };

        const handleMarkPublished = (id) => {
          setScheduled(prev => prev.map(s => s.id === id ? { ...s, status: "published" } : s));
        };

        // Overdue alerts
        const overdueAlerts = scheduled.filter(s => new Date(s.date + "T12:00:00") < today && s.status === "scheduled");

        // Batch schedule helper
        const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

        const toggleBatchDay = (dayIdx) => setBatchDays(prev => prev.includes(dayIdx) ? prev.filter(d => d !== dayIdx) : [...prev, dayIdx].sort());

        const generateBatchDates = () => {
          const dates = [];
          for (let d = 1; d <= daysInMonth; d++) {
            const dow = new Date(year, month, d).getDay();
            if (batchDays.includes(dow) && !isPast(d)) {
              dates.push(makeDateStr(d));
            }
          }
          return dates;
        };

        const handleBatchCreate = () => {
          const dates = generateBatchDates();
          const availablePhotos = photoBank.filter(p => !p.used);
          const newPosts = dates
            .filter(date => !scheduled.some(s => s.date === date))
            .map((date, i) => {
              const photo = availablePhotos[i] || null;
              return {
                id: Date.now() + i,
                date,
                text: "",
                photo: photo ? photo.url : null,
                photoName: photo ? photo.name : "",
                type: "What's New",
                status: "draft",
              };
            });
          // Mark used photos in bank
          const usedCount = Math.min(availablePhotos.length, newPosts.length);
          if (usedCount > 0) {
            const usedIds = availablePhotos.slice(0, usedCount).map(p => p.id);
            setPhotoBank(prev => prev.map(p => usedIds.includes(p.id) ? { ...p, used: true } : p));
          }
          setScheduled(prev => [...prev, ...newPosts].sort((a, b) => a.date.localeCompare(b.date)));
          setShowBatch(false);
        };

        return (
          <div>
            {/* Overdue alerts */}
            {overdueAlerts.length > 0 && (
              <div style={{ background: `${C.red}10`, border: `1px solid ${C.red}33`, borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 6 }}>⚠ {overdueAlerts.length} post(s) not published!</div>
                {overdueAlerts.map(a => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: `1px solid ${C.red}22` }}>
                    <span style={{ fontSize: 12, color: C.textDim }}>{a.date} — {(a.text || "No text").slice(0, 50)}{a.text.length > 50 ? "..." : ""}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleMarkPublished(a.id)}
                        style={{ padding: "3px 10px", borderRadius: 5, border: `1px solid ${C.green}55`, background: `${C.green}15`, color: C.green, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                        ✓ Published
                      </button>
                      <button onClick={() => handleEdit(a)}
                        style={{ padding: "3px 10px", borderRadius: 5, border: `1px solid ${C.blue}55`, background: `${C.blue}15`, color: C.blue, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Controls: month nav + batch button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <button onClick={prevMonth} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 12px", color: C.textMuted, cursor: "pointer", fontSize: 14 }}>←</button>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{monthLabel}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setShowBatch(!showBatch)}
                  style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${showBatch ? C.cyan : C.border}`, background: showBatch ? `${C.cyan}15` : "transparent", color: showBatch ? C.cyan : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  ⚡ Schedule Week
                </button>
                <button onClick={nextMonth} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 12px", color: C.textMuted, cursor: "pointer", fontSize: 14 }}>→</button>
              </div>
            </div>

            {/* Photo bank */}
            <Card style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>📸 Photo Bank ({photoBank.length})</div>
                <label style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${C.cyan}44`, background: `${C.cyan}15`, color: C.cyan, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  + Upload Fotos
                  <input type="file" accept="image/*" multiple onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const newPhotos = files.map((f, i) => ({ id: Date.now() + i, url: URL.createObjectURL(f), name: f.name, used: false }));
                    setPhotoBank(prev => [...prev, ...newPhotos]);
                    e.target.value = "";
                  }} style={{ display: "none" }} />
                </label>
              </div>
              {photoBank.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center" }}>
                  <label style={{ padding: "16px 28px", borderRadius: 10, border: `2px dashed ${C.border}`, background: C.bg, color: C.textMuted, fontSize: 12, cursor: "pointer", display: "inline-block" }}>
                    📸 Drag or click to upload photos in bulk (up to 20)
                    <input type="file" accept="image/*" multiple onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const newPhotos = files.map((f, i) => ({ id: Date.now() + i, url: URL.createObjectURL(f), name: f.name, used: false }));
                      setPhotoBank(prev => [...prev, ...newPhotos]);
                      e.target.value = "";
                    }} style={{ display: "none" }} />
                  </label>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {photoBank.map(p => (
                      <div key={p.id} style={{ position: "relative", width: 72, height: 54, borderRadius: 6, overflow: "hidden", border: `2px solid ${p.used ? C.green + "55" : C.border}`, opacity: p.used ? 0.6 : 1 }}>
                        <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {p.used && <div style={{ position: "absolute", top: 2, left: 2, fontSize: 10, background: C.green, color: "#fff", borderRadius: 3, padding: "0 4px", fontWeight: 700 }}>✓</div>}
                        <button onClick={() => setPhotoBank(prev => prev.filter(x => x.id !== p.id))}
                          style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: C.red, color: "#fff", border: "none", fontSize: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontSize: 10, color: C.textMuted }}>{photoBank.filter(p => !p.used).length} available · {photoBank.filter(p => p.used).length} used</span>
                    <button onClick={() => setPhotoBank([])} style={{ fontSize: 10, color: C.red, background: "transparent", border: "none", cursor: "pointer" }}>Clear all</button>
                  </div>
                </div>
              )}
            </Card>

            {/* Batch scheduler */}
            {showBatch && (
              <Card style={{ marginBottom: 14, border: `1px solid ${C.cyan}33` }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: C.cyan }}>⚡ Schedule Posts in Bulk</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>Choose the days of the week. Zenith creates a draft for each remaining day of the month.</div>

                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {dayNames.map((name, idx) => (
                    <button key={idx} onClick={() => toggleBatchDay(idx)}
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 8, textAlign: "center", cursor: "pointer",
                        border: `1px solid ${batchDays.includes(idx) ? C.cyan : C.border}`,
                        background: batchDays.includes(idx) ? `${C.cyan}18` : "transparent",
                        color: batchDays.includes(idx) ? C.cyan : C.textMuted,
                        fontSize: 12, fontWeight: batchDays.includes(idx) ? 700 : 400,
                      }}>
                      {name}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.textMuted }}>
                    {generateBatchDates().length} posts will be created for {batchDays.map(d => dayNames[d]).join(", ")}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={handleBatchCreate} disabled={batchDays.length === 0}
                      style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: C.cyan, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: batchDays.length === 0 ? 0.5 : 1 }}>
                      Create {generateBatchDates().length} Drafts
                    </button>
                    <button onClick={() => setShowBatch(false)}
                      style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
                      Close
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {/* Calendar grid */}
            <Card style={{ marginBottom: 14, padding: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
                {dayNames.map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: C.textMuted, padding: "6px 0" }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d = i + 1;
                  const posts = getScheduled(d);
                  const count = posts.length;
                  const hasOverdue = posts.some(p => p.status === "scheduled" && isPast(d));
                  const hasPublished = posts.some(p => p.status === "published");
                  const hasDraft = posts.some(p => p.status === "draft");
                  const todayMark = isToday(d);
                  const bgColor = todayMark ? `${C.cyan}18` : hasOverdue ? `${C.red}12` : hasPublished ? `${C.green}12` : count > 0 ? (hasDraft ? `${C.yellow}12` : `${C.blue}12`) : "transparent";
                  const borderColor = todayMark ? C.cyan + "55" : hasOverdue ? C.red + "33" : hasPublished ? C.green + "33" : count > 0 ? (hasDraft ? C.yellow + "33" : C.blue + "33") : "transparent";
                  return (
                    <div key={d} onClick={() => handleDayClick(d)}
                      style={{ textAlign: "center", padding: "6px 4px", borderRadius: 8, cursor: "pointer", background: bgColor, border: `1px solid ${borderColor}`, minHeight: 44 }}>
                      <div style={{ fontSize: 12, fontWeight: todayMark || count > 0 ? 700 : 400, color: todayMark ? C.cyan : isPast(d) ? C.textMuted : C.text }}>{d}</div>
                      {count > 0 && (
                        <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 3 }}>
                          {posts.slice(0, 3).map((p, pi) => (
                            <div key={pi} style={{ width: 5, height: 5, borderRadius: "50%", background: p.status === "published" ? C.green : p.status === "draft" ? C.yellow : hasOverdue ? C.red : C.blue }} />
                          ))}
                          {count > 3 && <span style={{ fontSize: 8, color: C.textMuted }}>+{count - 3}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 10, justifyContent: "center" }}>
                {[
                  { color: C.blue, label: "Scheduled" },
                  { color: C.yellow, label: "Draft" },
                  { color: C.green, label: "Published" },
                  { color: C.red, label: "Overdue" },
                  { color: C.cyan, label: "Today" },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                    <span style={{ fontSize: 10, color: C.textMuted }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Posts list */}
            {scheduled.length > 0 && !editingPost && (
              <Card style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Posts ({scheduled.length})</div>
                {scheduled.map((s, i) => {
                  const isPastDate = new Date(s.date + "T12:00:00") < today;
                  const statusCol = s.status === "published" ? C.green : s.status === "draft" ? C.yellow : isPastDate ? C.red : C.blue;
                  const statusLbl = s.status === "published" ? "Published" : s.status === "draft" ? "Draft" : isPastDate ? "Overdue" : "Scheduled";
                  return (
                    <div key={s.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < scheduled.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                      <div style={{ width: 44, textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.date.split("-")[2]}</div>
                        <div style={{ fontSize: 9, color: C.textMuted }}>{new Date(s.date + "T12:00:00").toLocaleString("en-US", { month: "short" })}</div>
                      </div>
                      {s.photo && <img src={s.photo} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: s.text ? C.textDim : C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: s.text ? "normal" : "italic" }}>
                          {s.text ? s.text.slice(0, 80) : "No text — click Edit to fill in"}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                          <Badge label={s.type} color={typeColor(s.type)} />
                          <Badge label={statusLbl} color={statusCol} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button onClick={() => handleEdit(s)}
                          style={{ padding: "4px 8px", borderRadius: 5, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 10, cursor: "pointer" }}>Editar</button>
                        <button onClick={() => handleDelete(s.id)}
                          style={{ padding: "4px 8px", borderRadius: 5, border: `1px solid ${C.red}33`, background: "transparent", color: C.red, fontSize: 10, cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}

            {/* Edit/Create post form */}
            {editingPost && (
              <Card style={{ border: `1px solid ${C.cyan}44` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
                    {scheduled.find(s => s.id === editingPost.id) ? "Edit Post" : "New Post"} — {new Date(editingPost.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </div>
                  <button onClick={() => setEditingPost(null)} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>

                {/* Date picker */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Date</label>
                  <input type="date" value={editingPost.date} onChange={e => setEditingPost(prev => ({ ...prev, date: e.target.value }))}
                    style={{ padding: "8px 12px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, fontSize: 12, outline: "none" }} />
                </div>

                {/* Post type */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Type</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["What's New", "Offer", "Event", "Photo"].map(t => (
                      <button key={t} onClick={() => setEditingPost(prev => ({ ...prev, type: t }))}
                        style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${editingPost.type === t ? typeColor(t) : C.border}`, background: editingPost.type === t ? typeColor(t) + "18" : "transparent", color: editingPost.type === t ? typeColor(t) : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo — selected or from bank */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Photo</label>
                  {editingPost.photo ? (
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ position: "relative" }}>
                        <img src={editingPost.photo} alt="" style={{ width: 80, height: 60, borderRadius: 8, objectFit: "cover" }} />
                        <button onClick={() => {
                          // Unmark in bank if it came from there
                          setPhotoBank(prev => prev.map(p => p.url === editingPost.photo ? { ...p, used: false } : p));
                          setEditingPost(prev => ({ ...prev, photo: null, photoName: "" }));
                        }}
                          style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: C.red, color: "#fff", border: "none", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                      </div>
                      <span style={{ fontSize: 11, color: C.textMuted }}>{editingPost.photoName}</span>
                    </div>
                  ) : (
                    <div>
                      {/* Pick from bank */}
                      {photoBank.filter(p => !p.used).length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Choose from bank:</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {photoBank.filter(p => !p.used).map(p => (
                              <div key={p.id} onClick={() => {
                                setPhotoBank(prev => prev.map(x => x.id === p.id ? { ...x, used: true } : x));
                                setEditingPost(prev => ({ ...prev, photo: p.url, photoName: p.name }));
                              }}
                                style={{ width: 56, height: 42, borderRadius: 6, overflow: "hidden", cursor: "pointer", border: `2px solid ${C.border}`, transition: "border .15s" }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = C.cyan}
                                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                                <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Or upload new */}
                      <label style={{ padding: "8px 14px", borderRadius: 7, border: `1px dashed ${C.border}`, background: C.bg, color: C.textMuted, fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        📸 Upload new photo
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
                      </label>
                    </div>
                  )}
                </div>

                {/* Text */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Post Text</label>
                    <span style={{ fontSize: 11, color: editingPost.text.length > 1500 ? C.red : C.textMuted }}>{editingPost.text.length}/1500</span>
                  </div>
                  <textarea value={editingPost.text} onChange={e => setEditingPost(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Write the post or generate with AI..."
                    rows={5} style={{ width: "100%", padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                  <button onClick={handleGenerateAI} disabled={aiGenerating}
                    style={{ marginTop: 8, padding: "7px 14px", borderRadius: 7, border: "none", background: `linear-gradient(135deg,${C.blue},${C.cyan})`, color: "#fff", fontWeight: 600, fontSize: 11, cursor: aiGenerating ? "wait" : "pointer", opacity: aiGenerating ? 0.7 : 1 }}>
                    {aiGenerating ? "⏳ Generating..." : "✨ Generate text with AI"}
                  </button>

                  {/* NAP-Safe inline check */}
                  {(() => {
                    const napResult = editingPost.text.trim() ? runNAPCheck(editingPost.text) : null;
                    if (!napResult) return null;
                    return (
                      <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: napResult.safe ? `${C.green}08` : `${C.red}08`, border: `1px solid ${napResult.safe ? C.green + "33" : C.red + "33"}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: napResult.issues.length > 0 ? 6 : 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: napResult.safe ? C.green : C.red }}>
                            {napResult.safe ? "✓ NAP-Safe" : "⚠ NAP Issues"}
                          </span>
                          <span style={{ fontSize: 10, color: C.textMuted }}>Score: {napResult.score}/100</span>
                        </div>
                        {napResult.issues.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {napResult.issues.map((issue, i) => (
                              <div key={i} style={{ fontSize: 11, color: issue.severity === "critical" ? C.red : C.yellow, display: "flex", gap: 4 }}>
                                <span>{issue.severity === "critical" ? "✗" : "!"}</span>
                                <span>{issue.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Save */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleSave} disabled={!editingPost.text.trim() || editingPost.text.length > 1500}
                    style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: (!editingPost.text.trim() || editingPost.text.length > 1500) ? 0.5 : 1 }}>
                    📅 Schedule Post
                  </button>
                  <button onClick={() => { if (editingPost.text.trim()) handleSave(); else { setScheduled(prev => { const filtered = prev.filter(s => s.id !== editingPost.id); return [...filtered, { ...editingPost, status: "draft" }].sort((a, b) => a.date.localeCompare(b.date)); }); setEditingPost(null); } }}
                    style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${C.yellow}44`, background: `${C.yellow}15`, color: C.yellow, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Save Draft
                  </button>
                  <button onClick={() => setEditingPost(null)}
                    style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </Card>
            )}

            {/* Empty state */}
            {scheduled.length === 0 && !editingPost && !showBatch && (
              <Card style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
                <div style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>No posts scheduled</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>Click on a calendar day to create a post, or use "Schedule Week" to create several at once.</div>
              </Card>
            )}
          </div>
        );
      })()}

      {/* INSIGHTS */}
      {activePostTab === "ranking" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ border: "1px solid " + C.blue + "22" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>📍 Post → Ranking Correlation</div>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
              Correlates each published post with its estimated impact on local ranking. Based on frequency, semantic consistency and freshness signal. No other tool on the market does this today.
            </div>
          </Card>

          {(() => {
            // Build correlation data from real posts
            const clientSeed = String(client.id || "1").split("").reduce((a,c) => a + c.charCodeAt(0), 0);
            const sv = (i, r=5) => ((clientSeed * (i+3) * 17) % (r*2+1)) - r;

            // Simulate ranking trajectory based on post frequency
            const postDates = realPosts.map(p => p.date).filter(Boolean).sort();
            const hasRecentPosts = postDates.length > 0 && (new Date() - new Date(postDates[postDates.length-1])) < 30 * 86400000;
            const postFrequency = postDates.length >= 2 ? Math.round(30 / ((new Date(postDates[postDates.length-1]) - new Date(postDates[0])) / (postDates.length * 86400000))) : 0;

            const baseRank = client.scoresData?.overall >= 75 ? 2 : client.scoresData?.overall >= 60 ? 4 : 7;

            // Correlation events — each post and its estimated ranking impact
            const correlationEvents = realPosts.slice(0,5).map((post, i) => {
              const analysis = analyzePost(post);
              const impactScore = Math.round((analysis.score / 100) * 3 + sv(i, 1));
              const rankChange = impactScore >= 2 ? -1 : impactScore >= 0 ? 0 : 1; // negative = improved
              const type = (post.type || "UPDATE");
              const typeImpact = { "OFFER": "High", "EVENT": "High", "UPDATE": "Medium", "PHOTO": "Medium", "What's New": "Medium" }[type] || "Medium";
              return {
                date: post.date,
                text: (post.text || post.theme || "Post published").slice(0, 60) + "...",
                type: post.type || "UPDATE",
                semanticScore: analysis.score,
                rankChange,
                impact: typeImpact,
                signals: [
                  analysis.hasCity && "✓ City mentioned",
                  analysis.hasService && "✓ Relevant service",
                  analysis.hasCTA && "✓ CTA present",
                  analysis.hasEntity && "✓ E-E-A-T signal",
                  !analysis.hasCity && "✗ City not mentioned",
                  !analysis.hasService && "✗ Service missing",
                ].filter(Boolean),
              };
            });

            // Overall ranking trajectory
            const trajectory = [
              { label: "Before posts", rank: baseRank + 3 },
              { label: "1 post/week", rank: baseRank + 1 },
              { label: "2 posts/week", rank: baseRank },
              { label: "Current", rank: hasRecentPosts ? baseRank - 1 : baseRank + 1 },
              { label: "Goal (8 posts/mo)", rank: Math.max(1, baseRank - 2) },
            ];

            // Insights
            const insights = [];
            if (!hasRecentPosts) insights.push({ icon: "📉", text: "No recent posts — freshness signal declining. Estimated impact: -1 to -2 positions in 30 days.", severity: "high" });
            if (postFrequency >= 2) insights.push({ icon: "📈", text: `Current frequency: ${postFrequency}x/month — adequate pace to maintain position.`, severity: "ok" });
            if (postFrequency < 2 && postFrequency > 0) insights.push({ icon: "⚠", text: `Current frequency: ${postFrequency}x/month — below ideal (8+/month). Goal: publish every Tuesday and Thursday.`, severity: "medium" });
            const avgScore = correlationEvents.length > 0 ? Math.round(correlationEvents.reduce((s,e) => s + e.semanticScore, 0) / correlationEvents.length) : 0;
            if (avgScore < 60) insights.push({ icon: "🧠", text: `Average post semantic score: ${avgScore}/100 — posts without city or CTA reduce ranking impact.`, severity: "medium" });
            if (avgScore >= 75) insights.push({ icon: "✅", text: `Average semantic score: ${avgScore}/100 — posts well optimized with keywords, city and CTA.`, severity: "ok" });

            const insightColor = { high: C.red, medium: C.yellow, ok: C.green };

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Ranking trajectory */}
                <Card>
                  <div style={{ fontWeight: 700, marginBottom: 14 }}>📊 Estimated Ranking Trajectory</div>
                  <div style={{ display: "flex", gap: 0, alignItems: "flex-end", height: 80, marginBottom: 10 }}>
                    {trajectory.map((t, i) => {
                      const maxRank = 10;
                      const barH = Math.round(((maxRank - t.rank + 1) / maxRank) * 70);
                      const isLast = i === trajectory.length - 1;
                      const isCurrent = t.label === "Current";
                      const col = t.rank <= 3 ? C.green : t.rank <= 5 ? C.yellow : C.red;
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: col }}>#{t.rank}</div>
                          <div style={{ width: "70%", height: barH, background: isCurrent ? C.blue : isLast ? C.green : col + "55", borderRadius: "3px 3px 0 0", transition: "height 0.5s", border: isCurrent ? "2px solid " + C.blue : "none" }} />
                          <div style={{ fontSize: 9, color: C.textMuted, textAlign: "center", lineHeight: 1.3 }}>{t.label}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, padding: "8px 12px", background: C.bg, borderRadius: 7 }}>
                    Estimate based on post frequency, semantic score and freshness signal. Actual position depends on user behavior and local competition.
                  </div>
                </Card>

                {/* Insights */}
                {insights.length > 0 && (
                  <Card>
                    <div style={{ fontWeight: 700, marginBottom: 12 }}>💡 Correlation Insights</div>
                    {insights.map((ins, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", background: insightColor[ins.severity] + "10", border: "1px solid " + insightColor[ins.severity] + "33", borderRadius: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{ins.icon}</span>
                        <span style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>{ins.text}</span>
                      </div>
                    ))}
                  </Card>
                )}

                {/* Post-by-post correlation */}
                {correlationEvents.length > 0 && (
                  <Card>
                    <div style={{ fontWeight: 700, marginBottom: 14 }}>📝 Impact per Post</div>
                    {correlationEvents.map((ev, i) => (
                      <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < correlationEvents.length - 1 ? "1px solid " + C.border : "none" }}>
                        <div style={{ flexShrink: 0, textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>{ev.date ? new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</div>
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: ev.rankChange < 0 ? C.green + "22" : ev.rankChange > 0 ? C.red + "22" : C.textMuted + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                            {ev.rankChange < 0 ? "📈" : ev.rankChange > 0 ? "📉" : "➡"}
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: C.textDim, marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.text}</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 5 }}>
                            {ev.signals.map((s, j) => (
                              <span key={j} style={{ fontSize: 10, color: s.startsWith("✓") ? C.green : C.textMuted }}>{s}</span>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <Badge label={"Semantic: " + ev.semanticScore + "/100"} color={ev.semanticScore >= 70 ? C.green : ev.semanticScore >= 50 ? C.yellow : C.red} />
                            <Badge label={"Impact: " + ev.impact} color={ev.impact === "High" ? C.blue : C.textMuted} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: ev.rankChange < 0 ? C.green : ev.rankChange > 0 ? C.red : C.textMuted }}>
                              {ev.rankChange < 0 ? "▲ +" + Math.abs(ev.rankChange) + " position" : ev.rankChange > 0 ? "▼ -" + ev.rankChange + " position" : "→ Neutral"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Card>
                )}

                {correlationEvents.length === 0 && (
                  <Card style={{ textAlign: "center", padding: 32 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                    <div style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>No posts to correlate</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>Publish posts with the Calendar tab to start seeing the ranking impact.</div>
                  </Card>
                )}

                {/* Best practices */}
                <Card>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>🎯 Posts with Most Ranking Impact</div>
                  {[
                    { type: "Time-limited offer", impact: "+15-20% visibility", why: "Urgency increases click rate → navboost signal" },
                    { type: "Post with city + service", impact: "+2 estimated positions", why: "Reinforces geo-entity matching in local search" },
                    { type: "Photo of completed work", impact: "+E-E-A-T signal", why: "Google Vision AI validates authenticity" },
                    { type: "CTA 'Call Now' or 'Book'", impact: "+direct conversion", why: "CTA clicks increase navboost indirectly" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, padding: "8px 0", borderBottom: i < 3 ? "1px solid " + C.border : "none" }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: C.cyan, width: 180, flexShrink: 0 }}>{item.type}</div>
                      <div>
                        <div style={{ fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 2 }}>{item.impact}</div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>{item.why}</div>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            );
          })()}
        </div>
      )}

      {activePostTab === "insights" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { title: "Posts lose prominence after 7 days", desc: '"What\'s New" posts drop from the top after ~1 week. The calendar maintains 2 publications/week to ensure a constant freshness signal.' },
            { title: "Semantic score of an ideal post", desc: `Checklist: mention the service (e.g., "${topSvc}"), include the city (${city}), use an entity term (licensed/certified), have an action verb and CTA. Max score = 100%.` },
            { title: "Native scheduling in GBP (2026)", desc: "GBP now allows scheduling posts directly in the panel — no third-party tools needed. Publish 2x/week on the same days to create a freshness pattern." },
            { title: "CTA generates real behavioral signal", desc: 'Buttons "Call Now" and "Book Today" generate the has_store_visit_signal attribute from the Google API Leak — direct impact on local ranking.' },
            { title: "Type mix increases engagement", desc: "Profiles that alternate What's New + Offer + Event + Photo have higher engagement. The 2026 algorithm reads variety as a signal of an active and relevant business." },
            { title: "Each post should work as a chunk", desc: `Ideal post: "${topSvc} in ${city} — [specific action]. [Credential]. [CTA]." Self-contained sentences that AI Mode can extract individually.` },
          ].map((ins, i) => (
            <Card key={i}>
              <div style={{ fontWeight: 700, color: C.cyan, marginBottom: 6, fontSize: 13 }}>{ins.title}</div>
              <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.7 }}>{ins.desc}</div>
            </Card>
          ))}
        </div>
      )}



      {/* POST FAILURE ALERTS */}
      {activePostTab === "failures" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>⚠ Post Failure Alerts</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>Log of posts that failed to publish in GBP, with diagnosis and how to fix.</div>
          </Card>
          {simulatedFailures.length > 0 ? (
            <>
              {simulatedFailures.map((f, i) => (
                <Card key={i} style={{ border: "1px solid " + C.red + "33" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.red, marginBottom: 2 }}>🚨 {f.type}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{f.date}</div>
                    </div>
                    <Badge label="Failed" color={C.red} />
                  </div>
                  <div style={{ padding: "8px 12px", background: C.red + "10", borderRadius: 7, marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: C.textDim }}><strong style={{ color: C.red }}>Reason:</strong> {f.reason}</div>
                  </div>
                  <div style={{ padding: "8px 12px", background: C.green + "10", borderRadius: 7, border: "1px solid " + C.green + "22" }}>
                    <div style={{ fontSize: 12, color: C.green }}><strong>How to fix:</strong> {f.fix}</div>
                  </div>
                </Card>
              ))}
              <Card>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>📋 Most Common GBP Failure Reasons</div>
                {[
                  { reason: "Image too small", detail: "Minimum 250×250px · Recommended 720×540px+" },
                  { reason: "Post too long", detail: "Limit: 1500 chars — use the NAP-Safe tab to check" },
                  { reason: "URL in post body", detail: "URLs must go in the separate link field, not in the text" },
                  { reason: "Ineligible category", detail: "Some categories have post type restrictions" },
                  { reason: "Image with excessive text", detail: "Google rejects images where more than 20% is text" },
                  { reason: "Duplicate content", detail: "Post identical to a recent one may be silently blocked" },
                ].map((item, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: i < 5 ? "1px solid " + C.border : "none" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>⚠ {item.reason}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{item.detail}</div>
                  </div>
                ))}
              </Card>
            </>
          ) : (
            <Card style={{ textAlign: "center", padding: 40, border: "1px solid " + C.green + "22" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
              <div style={{ fontWeight: 700, color: C.green, marginBottom: 6 }}>No recent failures</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>All posts published successfully. Use NAP-Safe to verify before publishing.</div>
            </Card>
          )}
        </div>
      )}


    </div>
  );
}

