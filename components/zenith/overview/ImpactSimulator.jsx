"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { Card, SectionTitle, Badge } from "../shared";
import { calcScores, calcScoresSim } from "../utils/scoring";

export default function ImpactSimulator({ client, allClients }) {
  const sc2 = client.scoresData || {};
  const currentScore = sc2.overall || client.score || 0;

  const [extraReviews, setExtraReviews] = useState(0);
  const [descLength, setDescLength] = useState(client.descriptionLength || 200);
  const [extraPhotos, setExtraPhotos] = useState(0);
  const [postFreq, setPostFreq] = useState(1);
  const [extraAttrs, setExtraAttrs] = useState(0);
  const [addSecCat, setAddSecCat] = useState((client.secondaryCategories || []).length > 0);

  // Build overrides from sliders
  const simReviewsTotal = (client.reviewsData?.total || 0) + extraReviews;
  const simWithResponse = Math.round(simReviewsTotal * 0.95);
  const simLast30 = Math.max(client.reviewsData?.last30days || 0, Math.round(extraReviews * 0.3));
  const postsPerWeek = postFreq;
  const lpDays = postsPerWeek >= 2 ? 4 : postsPerWeek >= 1 ? 7 : 30;
  const simPostDate = new Date(Date.now() - lpDays * 86400000).toISOString().split("T")[0];
  const simSecCats = addSecCat && (client.secondaryCategories || []).length === 0
    ? ["General"] : (client.secondaryCategories || []);

  // Use calcScoresSim — same formula as real scoring
  const sim = calcScoresSim(client, {
    descriptionLength: descLength,
    photosTotal: (client.photos?.total || 0) + extraPhotos,
    photosLastUpload: extraPhotos > 0 ? new Date().toISOString() : client.photos?.lastUpload,
    posts: [{ date: simPostDate }],
    reviewsTotal: simReviewsTotal,
    reviewsWithResponse: simWithResponse,
    reviewsLast30: simLast30,
    attributes: (client.attributes || 0) + extraAttrs,
    secondaryCategories: simSecCats,
  });

  const simOverall = sim.overall;
  const delta = simOverall - currentScore;
  const deltaColor = delta > 0 ? C.green : delta < 0 ? C.red : C.textMuted;

  const sectionDeltas = [
    { label: "Description", before: sc2.desc || 0, after: sim.desc, icon: "📝" },
    { label: "Photos", before: sc2.photo || 0, after: sim.photo, icon: "📸" },
    { label: "Posts", before: sc2.post || 0, after: sim.post, icon: "📢" },
    { label: "Reviews", before: sc2.review || 0, after: sim.review, icon: "⭐" },
    { label: "Info", before: sc2.basic || 0, after: sim.basic, icon: "🏢" },
  ];

  const allScored = (allClients || []).map(p => ({ ...p, s: calcScores(p) }));
  const yourRankBefore = allScored.filter(p => p.s.overall > currentScore).length + 1;
  const yourRankAfter = allScored.filter(p => p.s.overall > simOverall).length + 1;

  const sliderStyle = { width: "100%", accentColor: C.blue };
  const labelStyle = { fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, display: "block" };

  return (
    <div>
      <SectionTitle>Impact Simulator — {client.name}</SectionTitle>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>
        Move the sliders to simulate the impact of each action on the score. All calculations are real-time.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Sliders */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Simulate Actions</div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>ADDITIONAL REVIEWS (+{extraReviews})</label>
              <input type="range" min={0} max={50} step={1} value={extraReviews} onChange={e => setExtraReviews(+e.target.value)} style={sliderStyle} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                <span>0</span><span style={{ color: C.cyan }}>{simReviewsTotal} total</span><span>+50</span>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>DESCRIPTION LENGTH ({descLength} chars)</label>
              <input type="range" min={50} max={750} step={10} value={descLength} onChange={e => setDescLength(+e.target.value)} style={sliderStyle} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                <span>50</span><span style={{ color: descLength >= 700 ? C.green : C.yellow }}>{descLength >= 700 ? "✓ Excellent" : descLength >= 400 ? "Medium" : "Insufficient"}</span><span>750</span>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>PHOTOS ADDED (+{extraPhotos})</label>
              <input type="range" min={0} max={30} step={1} value={extraPhotos} onChange={e => setExtraPhotos(+e.target.value)} style={sliderStyle} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                <span>0</span><span style={{ color: C.cyan }}>{(client.photos?.total || 0) + extraPhotos} total</span><span>+30</span>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>POST FREQUENCY (per week: {postFreq}x)</label>
              <input type="range" min={0} max={3} step={1} value={postFreq} onChange={e => setPostFreq(+e.target.value)} style={sliderStyle} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                <span>0</span><span style={{ color: postFreq >= 2 ? C.green : postFreq >= 1 ? C.yellow : C.red }}>{postFreq === 0 ? "Inactive" : postFreq === 1 ? "Minimum" : postFreq === 2 ? "Good" : "Excellent"}</span><span>3x</span>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>ATTRIBUTES ADDED (+{extraAttrs})</label>
              <input type="range" min={0} max={8} step={1} value={extraAttrs} onChange={e => setExtraAttrs(+e.target.value)} style={sliderStyle} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                <span>0</span><span style={{ color: C.cyan }}>{(client.attributes || 0) + extraAttrs} total</span><span>+8</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" id="seccat" checked={addSecCat} onChange={e => setAddSecCat(e.target.checked)} style={{ accentColor: C.blue, width: 16, height: 16 }} />
              <label htmlFor="seccat" style={{ fontSize: 13, color: C.text, cursor: "pointer" }}>Add secondary category</label>
              {addSecCat && <Badge label="+17 pts Info" color={C.green} />}
            </div>
          </Card>

          <button onClick={() => { setExtraReviews(0); setDescLength(client.descriptionLength || 200); setExtraPhotos(0); setPostFreq(1); setExtraAttrs(0); setAddSecCat((client.secondaryCategories||[]).length > 0); }} style={{ padding: "8px 0", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
            Reset simulation
          </button>
        </div>

        {/* Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card style={{ border: `1px solid ${deltaColor}44`, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>GLOBAL SCORE IMPACT</div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 42, fontWeight: 900, color: currentScore >= 80 ? C.green : currentScore >= 50 ? C.yellow : C.red, lineHeight: 1 }}>{currentScore}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Current</div>
              </div>
              <div style={{ fontSize: 28, color: C.textMuted }}>→</div>
              <div>
                <div style={{ fontSize: 52, fontWeight: 900, color: simOverall >= 80 ? C.green : simOverall >= 50 ? C.yellow : C.red, lineHeight: 1 }}>{simOverall}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Simulated</div>
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: deltaColor, marginBottom: 8 }}>
              {delta > 0 ? `▲ +${delta} points` : delta < 0 ? `▼ ${delta} points` : "— No change"}
            </div>
            {delta > 0 && (
              <div style={{ fontSize: 12, color: C.textMuted }}>
                {delta >= 15 ? "Significant impact — worth prioritizing" : delta >= 8 ? "Moderate impact — good initiative" : "Small but positive impact"}
              </div>
            )}
          </Card>

          <Card>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Impact by Section</div>
            {sectionDeltas.map(s => {
              const d = s.after - s.before;
              const colBefore = s.before >= 80 ? C.green : s.before >= 50 ? C.yellow : C.red;
              const colAfter = s.after >= 80 ? C.green : s.after >= 50 ? C.yellow : C.red;
              return (
                <div key={s.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: C.textDim }}>{s.icon} {s.label}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: colBefore }}>{s.before}</span>
                      <span style={{ color: C.textMuted }}>→</span>
                      <span style={{ color: colAfter, fontWeight: 700 }}>{s.after}</span>
                      {d !== 0 && <Badge label={d > 0 ? `+${d}` : `${d}`} color={d > 0 ? C.green : C.red} />}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 3 }}>
                    <div style={{ flex: 1, background: C.border, borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div style={{ width: `${s.before}%`, background: colBefore, height: 6, transition: "width 0.4s" }} />
                    </div>
                    <div style={{ flex: 1, background: C.border, borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div style={{ width: `${s.after}%`, background: colAfter, height: 6, transition: "width 0.4s" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>

          <Card>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Agency Portfolio Rank</div>
            <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.textMuted }}>#{yourRankBefore}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>Current rank</div>
              </div>
              <div style={{ fontSize: 20, color: C.textMuted, display: "flex", alignItems: "center" }}>→</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: yourRankAfter < yourRankBefore ? C.green : C.textMuted }}>#{yourRankAfter}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>Simulated rank</div>
              </div>
            </div>
            {yourRankAfter < yourRankBefore && (
              <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: C.green }}>
                ▲ Moves up {yourRankBefore - yourRankAfter} position(s) in agency ranking
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>⚡ Quick Wins — Highest Impact per Effort</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { action: "Publish 1 post per week", effort: "Low", impact: `+${Math.max(0, 80 - (sc2.post || 0))} pts em Posts`, color: C.green },
            { action: "Rewrite description (700 chars)", effort: "Medium", impact: `+${Math.max(0, 100 - (sc2.desc || 0))} pts em Description`, color: C.blue },
            { action: "Add 10 new photos", effort: "Medium", impact: `+${Math.max(0, 70 - (sc2.photo || 0))} pts em Photos`, color: C.cyan },
            { action: "Request 5 reviews this month", effort: "Low", impact: `+${Math.min(10, Math.max(0, 80 - (sc2.review || 0)))} pts em Reviews`, color: C.yellow },
          ].map(qw => (
            <div key={qw.action} style={{ background: C.bg, border: `1px solid ${qw.color}22`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{qw.action}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge label={`Effort: ${qw.effort}`} color={qw.effort === "Low" ? C.green : C.yellow} />
                <span style={{ fontSize: 11, color: qw.color, fontWeight: 700 }}>{qw.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
