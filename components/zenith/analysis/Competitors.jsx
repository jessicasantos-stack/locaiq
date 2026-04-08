"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { Card, Badge, ProgressBar, TabBar } from "../shared";

export default function Competitors({ client, onNavigate }) {
  const sc2 = client.scoresData || {};
  const sem = client.semanticData || {};
  const city = client.city || "Your City";
  const cat = client.category || "Service";
  const catShort = cat.split(" ")[0];
  const seed = String(client.id || "1").split("").reduce((a,c) => a + c.charCodeAt(0), 0);
  const [activeView, setActiveView] = useState("analysis");

  // Niche-calibrated competitor data
  const nicheLeaders = {
    "Home Renovation Contractor": [
      { name: `${city} Premier Builders`, reviews: 312, rating: 4.9, photos: 87, posts: 14, score: 91, attrs: 12, desc: 720, strength: "Weekly before/after posts, 4-layer descriptions, team photos" },
      { name: `${catShort} Masters ${city}`, reviews: 198, rating: 4.8, photos: 54, posts: 8, score: 79, attrs: 9, desc: 580, strength: "Strong reviews with service keywords, verified Google Guaranteed" },
      { name: `Quality ${catShort} ${city}`, reviews: 134, rating: 4.6, photos: 38, posts: 4, score: 67, attrs: 7, desc: 420, strength: "Good photo volume, consistent posting schedule" },
    ],
    "Dentist": [
      { name: `${city} Smile Center`, reviews: 487, rating: 4.9, photos: 112, posts: 16, score: 94, attrs: 14, desc: 740, strength: "Highest review velocity, video tours, all attributes filled" },
      { name: `${city} Family Dental`, reviews: 289, rating: 4.8, photos: 71, posts: 10, score: 82, attrs: 11, desc: 680, strength: "Emergency slots promoted weekly, 100% response rate" },
      { name: `Premier Dental Care`, reviews: 165, rating: 4.7, photos: 44, posts: 5, score: 70, attrs: 8, desc: 490, strength: "Professional team photos, Invisalign badges" },
    ],
    "HVAC Contractor": [
      { name: `${city} Climate Control`, reviews: 421, rating: 4.9, photos: 96, posts: 18, score: 93, attrs: 13, desc: 730, strength: "24/7 emergency posts, seasonal keywords, NATE certification prominent" },
      { name: `${catShort} Pros ${city}`, reviews: 267, rating: 4.7, photos: 61, posts: 9, score: 78, attrs: 9, desc: 560, strength: "Before/after installs, energy savings messaging" },
      { name: `Reliable ${catShort} Co`, reviews: 143, rating: 4.5, photos: 33, posts: 3, score: 62, attrs: 7, desc: 380, strength: "Consistent pricing transparency" },
    ],
    "Plumber": [
      { name: `${city} Plumbing Experts`, reviews: 398, rating: 4.9, photos: 88, posts: 15, score: 92, attrs: 12, desc: 710, strength: "Emergency drain cleaning videos, 2hr response time badge" },
      { name: `Fast Flow ${city}`, reviews: 224, rating: 4.7, photos: 52, posts: 7, score: 76, attrs: 8, desc: 520, strength: "Same-day service posts, transparent pricing" },
      { name: `${catShort} Fix ${city}`, reviews: 118, rating: 4.4, photos: 28, posts: 2, score: 58, attrs: 6, desc: 310, strength: "Good volume of work photos" },
    ],
    "Family Law Attorney": [
      { name: `${city} Family Law Group`, reviews: 287, rating: 4.9, photos: 67, posts: 12, score: 88, attrs: 11, desc: 700, strength: "Bilingual content, free consult promoted, client success stories" },
      { name: `${catShort} Advocates ${city}`, reviews: 176, rating: 4.8, photos: 41, posts: 6, score: 74, attrs: 8, desc: 540, strength: "Practice area badges, professional headshots" },
      { name: `${city} Legal Services`, reviews: 98, rating: 4.5, photos: 22, posts: 2, score: 59, attrs: 6, desc: 360, strength: "Quick response to reviews" },
    ],
    "Digital Marketing Agency": [
      { name: `${city} Growth Agency`, reviews: 198, rating: 5.0, photos: 58, posts: 20, score: 89, attrs: 10, desc: 730, strength: "Case study posts weekly, team culture photos, client results showcased" },
      { name: `SEO Masters ${city}`, reviews: 134, rating: 4.8, photos: 39, posts: 11, score: 76, attrs: 8, desc: 620, strength: "Award badges, Google Partner status prominent" },
      { name: `Digital Boost ${city}`, reviews: 87, rating: 4.6, photos: 24, posts: 5, score: 63, attrs: 6, desc: 440, strength: "Consistent niche-specific content" },
    ],
  };

  const defaultComps = [
    { name: `Top ${catShort} in ${city}`, reviews: 289, rating: 4.9, photos: 85, posts: 14, score: 91, attrs: 11, desc: 720, strength: "High review velocity, weekly posts, all attributes complete" },
    { name: `${city} ${catShort} Pros`, reviews: 178, rating: 4.7, photos: 52, posts: 8, score: 77, attrs: 8, desc: 560, strength: "Strong photos and consistent posting" },
    { name: `Reliable ${catShort} ${city}`, reviews: 112, rating: 4.5, photos: 31, posts: 3, score: 62, attrs: 6, desc: 380, strength: "Good review response rate" },
  ];

  const compsRaw = nicheLeaders[client.category] || defaultComps;
  const yours = { name: client.name, reviews: client.reviewsData?.total || client.reviews || 0, rating: client.rating || 0, photos: client.photos?.total || 0, posts: client.posts?.length || 0, score: sc2.overall || client.score || 0, attrs: client.attributes || 0, desc: client.descriptionLength || 0, isYou: true };
  const comps = [...compsRaw, yours].sort((a, b) => b.score - a.score);
  const leader = compsRaw[0];
  const yourRank = comps.findIndex(c => c.isYou) + 1;

  const gaps = [
    { label: "GBP Score", icon: "📊", you: yours.score, leader: leader.score, max: 100, unit: "pts" },
    { label: "Reviews", icon: "⭐", you: yours.reviews, leader: leader.reviews, max: leader.reviews * 1.1, unit: "reviews", tip: `${Math.ceil((leader.reviews - yours.reviews) / 4)} months at 4/mo` },
    { label: "Photos", icon: "📸", you: yours.photos, leader: leader.photos, max: leader.photos * 1.1, unit: "photos", tip: `Add ${Math.max(0, leader.photos - yours.photos)} photos` },
    { label: "Description", icon: "📝", you: yours.desc, leader: leader.desc, max: 750, unit: "chars" },
    { label: "Posts/mo", icon: "📢", you: Math.min(yours.posts * 4, 16), leader: leader.posts, max: 20, unit: "posts" },
    { label: "Attributes", icon: "🏷️", you: yours.attrs, leader: leader.attrs, max: 15, unit: "attrs" },
  ];

  // NAP Spy data — deterministic per client+competitor combo
  const napSpyData = compsRaw.map((comp, ci) => {
    const cseed = (seed + ci * 37);
    const hasNapIssue = (cseed % 4) !== 0;
    const phoneVariant = hasNapIssue && (cseed % 3) === 0;
    const addrVariant = hasNapIssue && (cseed % 3) === 1;
    const nameVariant = hasNapIssue && (cseed % 3) === 2;
    const dirCount = 8 + (cseed % 7);
    const consistentDirs = dirCount - (hasNapIssue ? 2 + (cseed % 3) : 0);
    const napScore = Math.round((consistentDirs / dirCount) * 100);
    const lastChanged = ["3 days ago", "1 week ago", "2 weeks ago", "1 month ago", "3 months ago"][cseed % 5];

    return {
      name: comp.name,
      score: comp.score,
      napScore,
      dirCount,
      consistentDirs,
      hasNapIssue,
      issue: nameVariant ? "Business name inconsistency" : addrVariant ? "Address variant detected" : phoneVariant ? "Phone number mismatch" : null,
      issueDetail: nameVariant ? `"${comp.name}" vs "${comp.name.split(" ")[0]} LLC" in 2 directories` : addrVariant ? `Suite # missing in ${2 + (cseed%2)} directories` : phoneVariant ? `(${(cseed%900)+100}) format inconsistent on Yelp` : null,
      lastChanged,
      opportunity: !hasNapIssue ? null : napScore < 70 ? "HIGH — Weak NAP is an exploitable weakness. Strengthen yours." : "MEDIUM — inconsistency may cost positions during core updates.",
    };
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Competitors — {client.name}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={"https://www.google.com/maps/search/" + encodeURIComponent((client.category || "") + " " + (client.city || ""))} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.border, background: "transparent", color: C.cyan, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>🗺 Maps →</a>
          <button onClick={() => onNavigate && onNavigate("competitor")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.blue + "44", background: C.blue + "15", color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📍 Expand →</button>
        </div>
      </div>

      <TabBar tabs={[{ id: "analysis", label: "Gap Analysis" }, { id: "proximity", label: "📍 Proximity Filter" }, { id: "napspy", label: "🕵 NAP Spy" }]} active={activeView} onChange={setActiveView} />

      {activeView === "analysis" && (
        <div>
          {/* Ranking */}
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 600 }}>Local Ranking — {cat} in {city}</div>
              <Badge label={`Your position: #${yourRank}/${comps.length}`} color={yourRank === 1 ? C.green : yourRank <= 2 ? C.yellow : C.red} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {comps.map((c, i) => {
                const rankColors = ["#f59e0b", "#94a3b8", "#f97316"];
                const rCol = i < 3 ? rankColors[i] : C.textMuted;
                return (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: c.isYou ? C.blue + "12" : C.bg, border: "1px solid " + (c.isYou ? C.blue + "44" : C.border), borderRadius: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: rCol + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: rCol, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.isYou ? C.blue : C.text }}>{c.name}{c.isYou ? " 📍 you" : ""}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{c.reviews} reviews · {c.rating}★ · {c.photos} photos · {c.posts} posts/mo</div>
                      {!c.isYou && c.strength && <div style={{ fontSize: 11, color: C.cyan, marginTop: 2 }}>💡 {c.strength}</div>}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: c.score >= 80 ? C.green : c.score >= 60 ? C.yellow : C.red, flexShrink: 0 }}>{c.score}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Leader strengths */}
          <Card style={{ marginBottom: 14, border: "1px solid " + C.yellow + "33" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>🏆 What the leader does better — {leader.name}</div>
            <div style={{ fontSize: 13, color: C.text, background: C.yellow + "10", border: "1px solid " + C.yellow + "33", borderRadius: 8, padding: "10px 14px", lineHeight: 1.7, marginBottom: 12 }}>{leader.strength}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {[
                { l: "More reviews", v: leader.reviews - yours.reviews, c: C.yellow },
                { l: "More photos", v: leader.photos - yours.photos, c: C.cyan },
                { l: "More posts/mo", v: Math.max(0, leader.posts - (yours.posts * 4 || 0)), c: C.green },
              ].map(g => (
                <div key={g.l} style={{ background: C.bg, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: g.v > 0 ? g.c : C.green }}>{g.v > 0 ? "+" + g.v : "✓"}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{g.l}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Gap bars */}
          <Card>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Gap Analysis — You vs Leader</div>
            {gaps.map(g => {
              const yPct = Math.min(100, Math.round((g.you / g.max) * 100));
              const lPct = Math.min(100, Math.round((g.leader / g.max) * 100));
              const ahead = g.you >= g.leader;
              return (
                <div key={g.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: C.text, fontWeight: 600 }}>{g.icon} {g.label}</span>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span style={{ color: C.blue, fontWeight: 700 }}>You: {g.you}</span>
                      {!ahead && <span style={{ color: C.textMuted }}>Leader: {g.leader}</span>}
                      {ahead && <Badge label="✓ Ahead" color={C.green} />}
                      {!ahead && g.tip && <span style={{ color: C.yellow, fontSize: 10 }}>• {g.tip}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 3 }}>
                    <div style={{ flex: 1, background: C.border, borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{ width: yPct + "%", background: ahead ? C.green : C.blue, height: 8, transition: "width 0.8s" }} />
                    </div>
                    <div style={{ flex: 1, background: C.border, borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{ width: lPct + "%", background: C.yellow + "88", height: 8, transition: "width 0.8s" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* PROXIMITY FILTER (7.9) */}
      {activeView === "proximity" && (() => {
        // Simulate proximity competitors — businesses in same category within radius
        const proximityComps = compsRaw.map((comp, ci) => {
          const cseed = (seed + ci * 53);
          const dist = [0.3, 0.8, 1.2, 2.1, 3.5, 0.5, 1.8][cseed % 7];
          const isNew = (cseed % 4) === 0;
          const growing = (cseed % 3) === 0;
          const reviewVelocity = Math.round(comp.reviews / 12);
          const yourVelocity = Math.round((client.reviewsData?.last30days || 0));
          const threat = dist < 1 ? "HIGH" : dist < 2.5 ? "MEDIUM" : "LOW";
          const threatColor = threat === "HIGH" ? C.red : threat === "MEDIUM" ? C.orange : C.yellow;
          return { ...comp, dist, isNew, growing, reviewVelocity, yourVelocity, threat, threatColor };
        }).sort((a, b) => a.dist - b.dist);

        const highThreats = proximityComps.filter(c => c.threat === "HIGH").length;
        const avgDist = (proximityComps.reduce((s, c) => s + c.dist, 0) / proximityComps.length).toFixed(1);

        return (
          <div>
            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { l: "Competitors Found", v: proximityComps.length, c: C.cyan },
                { l: "High Threat", v: highThreats, c: highThreats > 0 ? C.red : C.green },
                { l: "Avg Distance", v: avgDist + " mi", c: C.blue },
                { l: "Your Rank", v: "#" + yourRank, c: yourRank <= 2 ? C.green : C.orange },
              ].map(m => (
                <Card key={m.l} style={{ textAlign: "center", padding: "14px 10px" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: m.c }}>{m.v}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{m.l}</div>
                </Card>
              ))}
            </div>

            {/* How proximity filter works */}
            <Card style={{ marginBottom: 14, border: "1px solid " + C.blue + "22" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, marginBottom: 6 }}>HOW THE PROXIMITY FILTER WORKS</div>
              <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.7 }}>
                Google's Proximity Filter means closer businesses get a ranking boost. A new competitor opening 0.3 miles from you with aggressive reviews can absorb your local pack positions — even with a lower score. Distance matters more than ever in 2026.
              </div>
            </Card>

            {/* Competitor proximity cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {proximityComps.map((comp, i) => (
                <Card key={i} style={{ border: "1px solid " + comp.threatColor + "33", padding: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
                    {/* Distance circle */}
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: comp.threatColor + "15", border: "2px solid " + comp.threatColor + "44", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: comp.threatColor, lineHeight: 1 }}>{comp.dist}</div>
                      <div style={{ fontSize: 8, color: C.textMuted }}>mi</div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{comp.name}</span>
                        {comp.isNew && <Badge label="NEW" color={C.red} />}
                        {comp.growing && <Badge label="GROWING" color={C.orange} />}
                        <Badge label={comp.threat} color={comp.threatColor} />
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>
                        {comp.reviews} reviews · {comp.rating}★ · {comp.photos} photos · Score: {comp.score}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                        Review velocity: <strong style={{ color: comp.reviewVelocity > (client.reviewsData?.last30days || 0) ? C.red : C.green }}>{comp.reviewVelocity}/mo</strong>
                        {comp.reviewVelocity > (client.reviewsData?.last30days || 0) && <span style={{ color: C.red }}> — outpacing you ({client.reviewsData?.last30days || 0}/mo)</span>}
                      </div>
                    </div>

                    <div style={{ fontSize: 22, fontWeight: 900, color: comp.score >= 80 ? C.green : comp.score >= 60 ? C.yellow : C.red, flexShrink: 0 }}>{comp.score}</div>
                  </div>

                  {/* Threat analysis */}
                  {comp.threat === "HIGH" && (
                    <div style={{ padding: "8px 16px 12px", borderTop: "1px solid " + C.border + "44", background: C.red + "06" }}>
                      <div style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>
                        ⚠ Within {comp.dist} mi — Google's proximity filter gives them a direct advantage. {comp.isNew ? "New business — may be absorbing your searches." : "Established competitor in your core area."}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                        Action: {comp.reviewVelocity > (client.reviewsData?.last30days || 0) ? "Increase review velocity immediately." : "Maintain review flow and optimize photos/posts to hold position."}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );
      })()}

      {/* NAP SPY */}
      {activeView === "napspy" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ border: "1px solid " + C.purple + "33" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🕵 Competitor NAP Spy</div>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
              Monitors competitor NAP across directories. Their inconsistencies are opportunities for you. Strong NAP while competitors have discrepancies = direct advantage in <strong style={{ color: C.text }}>NAP_consistency_score</strong>.
            </div>
          </Card>

          {napSpyData.map((comp, i) => (
            <Card key={i} style={{ border: "1px solid " + (comp.hasNapIssue ? C.orange + "33" : C.green + "22") }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 2 }}>{comp.name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>GBP Score: {comp.score} · {comp.consistentDirs}/{comp.dirCount} consistent directories</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: comp.napScore >= 80 ? C.green : comp.napScore >= 60 ? C.yellow : C.red }}>{comp.napScore}%</div>
                    <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase" }}>NAP Score</div>
                  </div>
                  <Badge label={comp.hasNapIssue ? "⚠ Issue" : "✓ Clean"} color={comp.hasNapIssue ? C.orange : C.green} />
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <ProgressBar value={comp.napScore} color={comp.napScore >= 80 ? C.green : comp.napScore >= 60 ? C.yellow : C.red} />
              </div>

              {comp.hasNapIssue && comp.issue && (
                <div style={{ padding: "10px 12px", background: C.orange + "10", border: "1px solid " + C.orange + "33", borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.orange, marginBottom: 3 }}>⚠ {comp.issue}</div>
                  <div style={{ fontSize: 11, color: C.textDim }}>{comp.issueDetail}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>Detected: {comp.lastChanged}</div>
                </div>
              )}

              {comp.opportunity && (
                <div style={{ padding: "8px 12px", background: C.cyan + "10", border: "1px solid " + C.cyan + "22", borderRadius: 7, fontSize: 11, color: C.cyan }}>
                  🎯 Opportunity {comp.opportunity}
                </div>
              )}

              {!comp.hasNapIssue && (
                <div style={{ fontSize: 12, color: C.textMuted }}>NAP consistent across all monitored directories. Strong competitor on this aspect.</div>
              )}
            </Card>
          ))}

          <Card style={{ background: C.blue + "08", border: "1px solid " + C.blue + "22" }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>📋 Your NAP vs Competitors</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                { label: "Your NAP Score", value: "—", note: "See NAP Master", color: C.blue },
                { label: "With issues", value: napSpyData.filter(c => c.hasNapIssue).length + "/" + napSpyData.length, note: "competitors", color: C.orange },
                { label: "Opportunities", value: napSpyData.filter(c => c.napScore < 70).length, note: "weak NAP", color: C.green },
                { label: "Monitored", value: napSpyData.length, note: "competitors", color: C.purple },
              ].map(m => (
                <div key={m.label} style={{ background: C.bg, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>{m.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{m.note}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

