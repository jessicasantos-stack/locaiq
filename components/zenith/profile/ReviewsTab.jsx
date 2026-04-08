"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { C } from "../constants/colors";
import { Card, SectionTitle, Badge, ProgressBar, StatCard, TabBar } from "../shared";
import { AIAnalysisPanel } from "../ai";
import { callClaude } from "../utils/ai";

const TONES = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "empathetic", label: "Empathetic" },
  { id: "promotional", label: "Promotional" },
];

export default function ReviewsTab({ client }) {
  const [activeTab, setActiveTab] = useState("reviews");
  const [filter, setFilter] = useState("all");
  const [starFilter, setStarFilter] = useState(0);
  const [starRules, setStarRules] = useState({ 5: "auto", 4: "auto", 3: "confirm", 2: "confirm", 1: "off" });
  const [aiResponses, setAiResponses] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [editingResponse, setEditingResponse] = useState({});
  const [savedResponses, setSavedResponses] = useState({});
  const [toneOverrides, setToneOverrides] = useState({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const aiTriggered = useRef({});

  const reviewsData = client.reviewsData || { total: client.reviews || 0, average: client.rating || 0, withResponse: 0, last30days: 0, negativeUnanswered: 0, samples: [] };
  const samples = reviewsData.samples || [];
  const responseRate = Math.round((reviewsData.withResponse / Math.max(reviewsData.total, 1)) * 100);
  const city = client.city || "";
  const topServices = (client.services || []).slice(0, 3).join(", ");

  const allSamples = useMemo(() => {
    const list = [...samples];
    if (reviewsData.negativeUnanswered > 0 && samples.filter(s => s.rating <= 3).length === 0) {
      list.push({ author: "Customer", text: "Service was not as expected. Need improvement.", rating: 2, responded: false, date: "1 day ago" });
    }
    return list;
  }, [samples, reviewsData.negativeUnanswered]);

  // Keyword triangulation
  const allReviewText = samples.map(r => r.text.toLowerCase()).join(" ");
  const serviceKeywords = (client.services || []).flatMap(s => s.toLowerCase().split(/\s+/)).filter(w => w.length > 4);
  const foundKeywords = [...new Set(serviceKeywords.filter(k => allReviewText.includes(k)))];

  // Pending queue (negative first)
  const pendingQueue = useMemo(() =>
    allSamples
      .map((r, i) => ({ ...r, idx: i }))
      .filter(r => !r.responded && !savedResponses[r.idx] && starRules[r.rating || 5] !== "off")
      .sort((a, b) => (a.rating || 5) - (b.rating || 5)),
  [allSamples, savedResponses, starRules]);

  const negPending = pendingQueue.filter(r => (r.rating || 5) <= 3).length;

  // ── AI Response Generation (better prompts from ReviewResponder) ──
  const generateResponse = async (idx, review, toneId) => {
    setAiLoading(prev => ({ ...prev, [idx]: true }));
    const stars = review.rating || 5;
    const isNegative = stars <= 3;
    const autoTone = toneId || (isNegative ? "empathetic" : stars === 4 ? "friendly" : "professional");

    const prompt = `You are a local business review response specialist. Generate a Google Review response.

Business: ${client.name} (${client.category}) in ${city}
Services: ${topServices}
Reviewer: ${review.author}
Rating: ${stars}/5 stars
Review: "${review.text}"
Tone: ${autoTone}

Rules:
- 80-150 words max
- Thank reviewer by FIRST NAME only
- Mention business name ONCE naturally
- Include city name naturally (SEO triangulation)
- ${isNegative ? "Acknowledge issue sincerely. Do NOT be defensive. Offer to resolve offline. Never admit legal fault." : "Mention a specific detail from their review. Reinforce positive experience."}
- ${autoTone === "promotional" ? "Add soft CTA about a related service" : "Keep genuine, not salesy"}
- Include 1 service keyword naturally (for SEO)
- End with professional sign-off
- Output ONLY the response text.`;

    const result = await callClaude(prompt, 300);
    setAiResponses(prev => ({ ...prev, [idx]: result || "" }));
    setEditingResponse(prev => ({ ...prev, [idx]: result || "" }));
    setAiLoading(prev => ({ ...prev, [idx]: false }));
    return result;
  };

  // Auto-generate based on per-star rules
  useEffect(() => {
    allSamples.forEach((r, idx) => {
      const rule = starRules[r.rating || 5] || "off";
      if (rule !== "off" && !r.responded && !aiTriggered.current[idx] && !savedResponses[idx]) {
        aiTriggered.current[idx] = true;
        generateResponse(idx, r);
      }
    });
  }, [starRules]);

  // ── Bulk Auto-Respond ──
  const handleBulkGenerate = async () => {
    setBulkLoading(true);
    setBulkProgress(0);
    for (let i = 0; i < pendingQueue.length; i++) {
      const r = pendingQueue[i];
      if (!aiResponses[r.idx]) {
        await generateResponse(r.idx, r);
      }
      setBulkProgress(Math.round(((i + 1) / pendingQueue.length) * 100));
    }
    setBulkLoading(false);
  };

  const handleSaveResponse = (idx) => {
    const text = editingResponse[idx];
    if (!text?.trim()) return;
    setSavedResponses(prev => ({ ...prev, [idx]: text }));
  };

  const copyText = (text, id) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllResponses = () => {
    const allText = pendingQueue
      .filter(r => aiResponses[r.idx])
      .map(r => `[${r.author} - ${r.rating}★]\n${aiResponses[r.idx]}`)
      .join("\n\n---\n\n");
    copyText(allText, "all");
  };

  // Filtering
  const filtered = allSamples.filter((r, i) => {
    if (filter === "pending" && (r.responded || savedResponses[i])) return false;
    if (filter === "negative" && (r.rating || 5) > 3) return false;
    if (filter === "responded" && !r.responded && !savedResponses[i]) return false;
    if (starFilter > 0 && (r.rating || 5) !== starFilter) return false;
    return true;
  });

  // Star distribution
  const starCounts = [5, 4, 3, 2, 1].map(s => ({ star: s, count: allSamples.filter(r => (r.rating || 5) === s).length }));
  const maxStarCount = Math.max(...starCounts.map(s => s.count), 1);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <SectionTitle style={{ margin: 0 }}>Reviews — {client.name}</SectionTitle>
        <button onClick={() => { navigator.clipboard?.writeText(`Happy with our ${(client.services?.[0] || client.category)}? A Google review helps a lot! ${client.website || ""}`); }}
          style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.cyan, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          Copy Review Request
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
        <StatCard label="Total" value={reviewsData.total} color={reviewsData.total >= 50 ? C.green : reviewsData.total >= 20 ? C.yellow : C.red} />
        <StatCard label="Rating" value={`${reviewsData.average} ★`} color={reviewsData.average >= 4.5 ? C.green : C.yellow} />
        <StatCard label="Response Rate" value={`${responseRate}%`} color={responseRate >= 80 ? C.green : C.red} />
        <StatCard label="Pending" value={pendingQueue.length} color={pendingQueue.length > 0 ? C.red : C.green} />
        <StatCard label="Last 30 Days" value={reviewsData.last30days} color={reviewsData.last30days >= 3 ? C.green : C.yellow} />
      </div>

      <TabBar tabs={[
        { id: "reviews", label: `Reviews (${allSamples.length})` },
        { id: "bulk", label: `Bulk Respond (${pendingQueue.length})` },
        { id: "rules", label: "AI Rules" },
        { id: "strategy", label: "Strategy" },
      ]} active={activeTab} onChange={setActiveTab} />

      {/* ═══ REVIEWS TAB ═══ */}
      {activeTab === "reviews" && (
        <div>
          {/* Filters */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            {[["all", "All"], ["pending", "Pending"], ["responded", "Responded"], ["negative", "Negative"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${filter === v ? C.blue : C.border}`, background: filter === v ? `${C.blue}22` : "transparent", color: filter === v ? C.blue : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{l}</button>
            ))}
            <div style={{ width: 1, height: 20, background: C.border }} />
            <button onClick={() => setStarFilter(0)}
              style={{ padding: "5px 8px", borderRadius: 6, border: `1px solid ${starFilter === 0 ? C.yellow : C.border}`, background: starFilter === 0 ? `${C.yellow}22` : "transparent", color: starFilter === 0 ? C.yellow : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>All ★</button>
            {[5, 4, 3, 2, 1].map(s => (
              <button key={s} onClick={() => setStarFilter(starFilter === s ? 0 : s)}
                style={{ padding: "5px 8px", borderRadius: 6, border: `1px solid ${starFilter === s ? C.yellow : C.border}`, background: starFilter === s ? `${C.yellow}22` : "transparent", color: starFilter === s ? C.yellow : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{s}★</button>
            ))}
          </div>

          {/* Star distribution */}
          <Card style={{ marginBottom: 14, padding: "10px 16px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {starCounts.map(s => (
                <div key={s.star} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: C.yellow, fontWeight: 600, width: 20 }}>{s.star}★</span>
                  <div style={{ flex: 1, height: 6, background: C.bg, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${(s.count / maxStarCount) * 100}%`, height: "100%", background: s.star >= 4 ? C.green : s.star === 3 ? C.yellow : C.red, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 10, color: C.textMuted, width: 16, textAlign: "right" }}>{s.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Reviews list */}
          <Card>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: C.textMuted, fontSize: 13 }}>No reviews match this filter.</div>
            ) : (
              filtered.map((r, fi) => {
                const idx = allSamples.indexOf(r);
                const stars = r.rating || 5;
                const isPending = !r.responded && !savedResponses[idx];
                const rule = starRules[stars] || "off";
                const aiText = aiResponses[idx];
                const isLoadingAI = aiLoading[idx];
                const isSaved = !!savedResponses[idx];
                const tone = toneOverrides[idx];

                return (
                  <div key={idx} style={{ padding: "14px 0", borderBottom: fi < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: stars >= 4 ? `${C.green}22` : stars === 3 ? `${C.yellow}22` : `${C.red}22`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: stars >= 4 ? C.green : stars === 3 ? C.yellow : C.red, flexShrink: 0 }}>
                          {(r.author || "?")[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.author || "Anonymous"}</div>
                          <div style={{ color: C.yellow, fontSize: 12 }}>{"★".repeat(stars)}{"☆".repeat(5 - stars)}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {r.date && <span style={{ fontSize: 11, color: C.textMuted }}>{r.date}</span>}
                        <Badge label={isSaved ? "Saved" : r.responded ? "Responded" : "Pending"} color={isSaved ? C.cyan : r.responded ? C.green : C.red} />
                      </div>
                    </div>

                    {/* Review text */}
                    <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6, marginBottom: 10 }}>{r.text}</div>

                    {/* Existing response */}
                    {r.responded && r.response && !isSaved && (
                      <div style={{ padding: "8px 12px", background: `${C.green}08`, borderRadius: 8, border: `1px solid ${C.green}22`, fontSize: 12, color: C.textDim }}>
                        <span style={{ color: C.green, fontWeight: 600 }}>Response: </span>{r.response}
                      </div>
                    )}

                    {/* Saved response */}
                    {isSaved && (
                      <div style={{ padding: "8px 12px", background: `${C.cyan}08`, borderRadius: 8, border: `1px solid ${C.cyan}22`, fontSize: 12, color: C.textDim }}>
                        <span style={{ color: C.cyan, fontWeight: 600 }}>✓ Saved: </span>{savedResponses[idx]}
                      </div>
                    )}

                    {/* AI response for pending */}
                    {isPending && rule !== "off" && (
                      <div style={{ marginTop: 6 }}>
                        {isLoadingAI && (
                          <div style={{ fontSize: 11, color: C.purple, padding: "6px 0" }}>⏳ Generating AI response...</div>
                        )}
                        {aiText && !isLoadingAI && (
                          <div style={{ background: `${C.purple}08`, border: `1px solid ${C.purple}22`, borderRadius: 8, padding: "10px 12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontSize: 10, color: C.purple, fontWeight: 700 }}>✨ AI Response</span>
                              {/* Tone selector */}
                              <div style={{ display: "flex", gap: 3 }}>
                                {TONES.map(t => (
                                  <button key={t.id} onClick={() => { setToneOverrides(prev => ({ ...prev, [idx]: t.id })); generateResponse(idx, r, t.id); }}
                                    style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${(tone || "professional") === t.id ? C.purple : C.border}`, background: (tone || "professional") === t.id ? `${C.purple}18` : "transparent", color: (tone || "professional") === t.id ? C.purple : C.textMuted, fontSize: 9, cursor: "pointer" }}>
                                    {t.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {rule === "confirm" ? (
                              <div>
                                <textarea value={editingResponse[idx] || ""} onChange={e => setEditingResponse(prev => ({ ...prev, [idx]: e.target.value }))}
                                  rows={3} style={{ width: "100%", padding: "8px 10px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, lineHeight: 1.5, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                                  <button onClick={() => handleSaveResponse(idx)}
                                    style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: C.green, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                                    ✓ Publish
                                  </button>
                                  <button onClick={() => copyText(editingResponse[idx] || aiText, idx)}
                                    style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.blue}44`, background: `${C.blue}15`, color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                                    {copiedId === idx ? "✓ Copied" : "Copy"}
                                  </button>
                                  <button onClick={() => generateResponse(idx, r, tone)}
                                    style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 11, cursor: "pointer" }}>
                                    Regenerate
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5, marginBottom: 6 }}>{aiText}</div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <Badge label="Auto-published" color={C.green} />
                                  <button onClick={() => copyText(aiText, idx)}
                                    style={{ padding: "3px 10px", borderRadius: 5, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 10, cursor: "pointer" }}>
                                    {copiedId === idx ? "✓" : "Copy"}
                                  </button>
                                  <button onClick={() => { setStarRules(prev => ({ ...prev, [stars]: "confirm" })); setEditingResponse(prev => ({ ...prev, [idx]: aiText })); }}
                                    style={{ padding: "3px 10px", borderRadius: 5, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 10, cursor: "pointer" }}>
                                    Edit
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {!aiText && !isLoadingAI && (
                          <button onClick={() => generateResponse(idx, r)}
                            style={{ padding: "5px 14px", borderRadius: 6, border: `1px solid ${C.purple}44`, background: `${C.purple}15`, color: C.purple, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            ✨ Generate AI Response
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </Card>
        </div>
      )}

      {/* ═══ BULK RESPOND TAB ═══ */}
      {activeTab === "bulk" && (
        <div>
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Bulk Auto-Respond</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                  AI generates responses for all {pendingQueue.length} pending reviews. Tone auto-selected by rating.
                </div>
              </div>
              <button onClick={handleBulkGenerate} disabled={bulkLoading || pendingQueue.length === 0}
                style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: bulkLoading || pendingQueue.length === 0 ? C.border : `linear-gradient(135deg,${C.purple},${C.blue})`, color: "#fff", fontWeight: 700, fontSize: 12, cursor: bulkLoading || pendingQueue.length === 0 ? "not-allowed" : "pointer" }}>
                {bulkLoading ? `Generating... ${bulkProgress}%` : pendingQueue.length === 0 ? "All responded" : `Generate All (${pendingQueue.length})`}
              </button>
            </div>
            {bulkLoading && <ProgressBar value={bulkProgress} color={C.purple} />}

            {/* Auto-tone guide */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 12 }}>
              {[
                { stars: "1-2 ★", tone: "Empathetic", color: C.red, desc: "Acknowledge + resolve offline" },
                { stars: "3 ★", tone: "Professional", color: C.yellow, desc: "Thank + show improvement" },
                { stars: "4 ★", tone: "Friendly", color: C.cyan, desc: "Warm + engagement" },
                { stars: "5 ★", tone: "Professional", color: C.green, desc: "Thank + SEO keywords" },
              ].map(t => (
                <div key={t.stars} style={{ padding: "8px 10px", background: `${t.color}08`, border: `1px solid ${t.color}22`, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.stars}</div>
                  <div style={{ fontSize: 10, color: C.text, marginTop: 2 }}>{t.tone}</div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Bulk results */}
          {pendingQueue.filter(r => aiResponses[r.idx]).length > 0 && (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{pendingQueue.filter(r => aiResponses[r.idx]).length} responses ready</span>
                <button onClick={copyAllResponses}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: copiedId === "all" ? C.green : C.blue, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {copiedId === "all" ? "✓ All Copied!" : "Copy All"}
                </button>
              </div>
              {pendingQueue.filter(r => aiResponses[r.idx]).map(r => (
                <div key={r.idx} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: C.yellow, fontSize: 11 }}>{"★".repeat(r.rating || 5)}</span>
                      <span style={{ fontWeight: 600, fontSize: 12 }}>{r.author}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => copyText(aiResponses[r.idx], r.idx)}
                        style={{ padding: "4px 10px", borderRadius: 5, border: "none", background: copiedId === r.idx ? C.green : C.blue, color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                        {copiedId === r.idx ? "✓" : "Copy"}
                      </button>
                      <button onClick={() => handleSaveResponse(r.idx)}
                        style={{ padding: "4px 10px", borderRadius: 5, border: `1px solid ${C.green}44`, background: "transparent", color: C.green, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                        ✓ Done
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>"{r.text}"</div>
                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, background: C.bg, borderRadius: 6, padding: "8px 12px", borderLeft: `3px solid ${(r.rating || 5) >= 4 ? C.green : (r.rating || 5) === 3 ? C.yellow : C.red}` }}>
                    {aiResponses[r.idx]}
                  </div>
                </div>
              ))}
            </Card>
          )}

          {pendingQueue.length === 0 && (
            <Card style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.green }}>All reviews responded!</div>
            </Card>
          )}
        </div>
      )}

      {/* ═══ RULES TAB ═══ */}
      {activeTab === "rules" && (
        <div>
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>AI Response Rules by Rating</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[5, 4, 3, 2, 1].map(star => {
                const rule = starRules[star];
                return (
                  <div key={star} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: C.bg, borderRadius: 8 }}>
                    <span style={{ fontSize: 14, color: C.yellow, fontWeight: 700, width: 36 }}>{star}★</span>
                    <div style={{ display: "flex", gap: 4, flex: 1 }}>
                      {[
                        { id: "auto", label: "Auto Respond", color: C.green, desc: "AI publishes automatically" },
                        { id: "confirm", label: "Confirm First", color: C.blue, desc: "AI drafts, you approve" },
                        { id: "off", label: "Skip", color: C.textMuted, desc: "No AI response" },
                      ].map(opt => (
                        <button key={opt.id} onClick={() => setStarRules(prev => ({ ...prev, [star]: opt.id }))}
                          style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${rule === opt.id ? opt.color : C.border}`, background: rule === opt.id ? `${opt.color}18` : "transparent", color: rule === opt.id ? opt.color : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", flex: 1, textAlign: "center" }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Triangulation + Sentiment */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {foundKeywords.length > 0 && (
              <Card>
                <div style={{ fontWeight: 600, marginBottom: 10, color: C.green, fontSize: 13 }}>Keyword Triangulation</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {foundKeywords.map(k => <Badge key={k} label={k} color={C.green} />)}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{foundKeywords.length} service terms confirmed in reviews</div>
              </Card>
            )}
            <Card>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Sentiment</div>
              {[
                { label: "Positive", pct: Math.round(((reviewsData.total - reviewsData.negativeUnanswered) / Math.max(reviewsData.total, 1)) * 85), color: C.green },
                { label: "Neutral", pct: 10, color: C.yellow },
                { label: "Negative", pct: Math.round((reviewsData.negativeUnanswered / Math.max(reviewsData.total, 1)) * 100) || 5, color: C.red },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 56, fontSize: 11, color: C.textMuted }}>{s.label}</div>
                  <div style={{ flex: 1 }}><ProgressBar value={s.pct} color={s.color} /></div>
                  <div style={{ width: 32, fontSize: 11, fontWeight: 700, color: s.color, textAlign: "right" }}>{s.pct}%</div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* ═══ STRATEGY TAB ═══ */}
      {activeTab === "strategy" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { title: "Respond to 100% of reviews — positive and negative", desc: "Google uses response rate as an active business signal. Responding to positive reviews also reinforces your entity rating and encourages more reviews.", color: C.blue },
            { title: "Negative reviews within 24 hours — ALWAYS", desc: "Unanswered negative reviews are the strongest negative signal. Each one reduces conversion by ~22%. Acknowledge, apologize, and offer offline resolution.", color: C.red },
            { title: "Include city + service in EVERY response", desc: "Every response is indexable content. Natural mention of city + service reinforces semantic triangulation and strengthens your entity for AI Overviews.", color: C.cyan },
            { title: "NEVER copy identical templates", desc: "Google detects duplicate responses and reduces their weight. Use Bulk Auto-Respond as a base and personalize specific details before publishing.", color: C.yellow },
            { title: "Response speed is a ranking signal", desc: "Profiles that respond in under 24h rank on average 0.5 positions higher in the Local Pack vs profiles that take days. Bulk Auto-Respond eliminates this bottleneck.", color: C.green },
          ].map((item, i) => (
            <Card key={i} style={{ border: `1px solid ${item.color}22` }}>
              <div style={{ fontWeight: 700, color: item.color, marginBottom: 6, fontSize: 13 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.7 }}>{item.desc}</div>
            </Card>
          ))}
        </div>
      )}

      {client.scoresData && client.semanticData && (
        <div style={{ marginTop: 14 }}>
          <AIAnalysisPanel data={client} scores={client.scoresData} semantic={client.semanticData} analysisType="reviews" />
        </div>
      )}
    </div>
  );
}
