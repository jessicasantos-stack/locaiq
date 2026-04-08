"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { Card, SectionTitle, Badge, Btn } from "../shared";

export default function RankEstimator({ client }) {
  const scores = client.scoresData || {};
  const sem = client.semanticData || {};
  const city = client.city || "";
  const cat = client.category || "";
  const [keyword, setKeyword] = useState((client.services || [])[0] || cat);
  const [radius, setRadius] = useState("5");
  const [estimated, setEstimated] = useState(null);
  const [loading, setLoading] = useState(false);

  const NICHE_COMPETITION = {
    "Dentist": 85, "Family Law Attorney": 78, "HVAC Contractor": 72,
    "Plumber": 68, "Home Renovation Contractor": 65, "Electrician": 60,
    "Digital Marketing Agency": 75, "Car Detailing Service": 50,
    "Landscaping Company": 45, "IT Services & Computer Repair": 55,
  };

  const estimate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    const competition = NICHE_COMPETITION[cat] || 60;
    const overallScore = scores.overall || 50;
    const aiScore = sem.score || 40;
    const reviews = client.reviews || 0;
    const rating = client.rating || 0;
    const radiusNum = Number(radius);

    // Rank estimation algorithm
    const proximityBonus = radiusNum <= 2 ? 15 : radiusNum <= 5 ? 8 : 0;
    const reviewStrength = Math.min(25, (reviews / 50) * 25);
    const ratingStrength = rating >= 4.7 ? 20 : rating >= 4.3 ? 14 : rating >= 4.0 ? 8 : 0;
    const profileStrength = (overallScore / 100) * 25;
    const aiStrength = (aiScore / 100) * 15;

    const rawScore = proximityBonus + reviewStrength + ratingStrength + profileStrength + aiStrength;
    const competitionPenalty = (competition / 100) * 30;
    const finalScore = Math.max(5, rawScore - competitionPenalty);

    // Translate to rank
    const rank = finalScore >= 75 ? 1 : finalScore >= 60 ? 2 : finalScore >= 45 ? 3 :
                 finalScore >= 35 ? 4 : finalScore >= 25 ? 6 : finalScore >= 15 ? 10 : 15;

    const inPack = finalScore >= 35; // In top 3 pack

    const factors = [
      { label: "GBP Score", value: overallScore + "/100", contribution: Math.round(profileStrength), color: overallScore >= 70 ? C.green : C.yellow },
      { label: "Reviews", value: reviews + " (" + rating + "★)", contribution: Math.round(reviewStrength + ratingStrength), color: reviews >= 50 ? C.green : C.yellow },
      { label: "AI Mode", value: aiScore + "/100", contribution: Math.round(aiStrength), color: aiScore >= 60 ? C.green : C.red },
      { label: "Proximity (" + radius + "mi)", value: proximityBonus > 0 ? "+" + proximityBonus : "Neutral", contribution: proximityBonus, color: proximityBonus > 0 ? C.cyan : C.textMuted },
      { label: "Competition (" + cat.split(" ")[0] + ")", value: competition + "/100", contribution: -Math.round(competitionPenalty), color: competition >= 70 ? C.red : C.yellow },
    ];

    setEstimated({ rank, inPack, finalScore: Math.round(finalScore), factors, keyword, city });
    setLoading(false);
  };

  // What to improve
  const improvements = [];
  if ((scores.overall || 0) < 70) improvements.push({ action: "Improve GBP Score to 70+", impact: "+2 estimated positions", tab: "optimize" });
  if ((sem.score || 0) < 60) improvements.push({ action: "Optimize AI Mode (4 layers + chunks)", impact: "+1 estimated position", tab: "aimode" });
  if ((client.reviews || 0) < 50) improvements.push({ action: "Request " + (50 - (client.reviews || 0)) + " more reviews", impact: "+1-2 estimated positions", tab: "reviews" });
  if ((client.rating || 0) < 4.5) improvements.push({ action: "Raise average rating to 4.5★+", impact: "+1 estimated position", tab: "reviews" });

  return (
    <div>
      <SectionTitle>Rank Estimator — {client.name}</SectionTitle>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16, padding: "8px 12px", background: C.blue + "10", borderRadius: 8, border: "1px solid " + C.blue + "33" }}>
        ⚠ Estimate based on GBP attributes (score, reviews, AI Mode, niche competition). Actual position depends on user geolocation, click history, and other behavioral signals from Google.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Configure Estimate</div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: C.textMuted, fontWeight: 700, display: "block", marginBottom: 5 }}>KEYWORD / SERVICE</label>
            <input value={keyword} onChange={e => setKeyword(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", background: C.bg, border: "1px solid " + C.border, borderRadius: 8, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              placeholder={"Ex: " + cat} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: C.textMuted, fontWeight: 700, display: "block", marginBottom: 5 }}>SEARCH RADIUS: {radius} miles</label>
            <input type="range" min="1" max="25" step="1" value={radius} onChange={e => setRadius(e.target.value)}
              style={{ width: "100%", accentColor: C.blue }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted }}>
              <span>1mi — neighborhood</span><span>5mi — local</span><span>25mi — regional</span>
            </div>
          </div>
          <div style={{ marginBottom: 14, padding: "10px 12px", background: C.bg, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>City: <strong style={{ color: C.text }}>{city}</strong></div>
            <div style={{ fontSize: 11, color: C.textMuted }}>Category: <strong style={{ color: C.text }}>{cat}</strong></div>
          </div>
          <Btn onClick={estimate} disabled={loading} style={{ width: "100%" }}>
            {loading ? "Calculating..." : "Estimate Position"}
          </Btn>
        </Card>

        {estimated ? (
          <Card style={{ border: "1px solid " + (estimated.inPack ? C.green + "44" : C.yellow + "44"), textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>ESTIMATED POSITION</div>
            <div style={{ fontSize: 80, fontWeight: 900, color: estimated.inPack ? C.green : estimated.rank <= 5 ? C.yellow : C.red, lineHeight: 1, marginBottom: 8 }}>#{estimated.rank}</div>
            <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 12 }}>para "{estimated.keyword}" em {estimated.city}</div>
            <Badge label={estimated.inPack ? "✓ In Local Pack (Top 3)" : estimated.rank <= 5 ? "Top 5" : "Outside pack"} color={estimated.inPack ? C.green : estimated.rank <= 5 ? C.yellow : C.red} />
            <div style={{ marginTop: 16, fontSize: 12, color: C.textMuted }}>Visibility Score: <strong style={{ color: C.cyan }}>{estimated.finalScore}/100</strong></div>
          </Card>
        ) : (
          <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📍</div>
              <div style={{ color: C.textMuted, fontSize: 13 }}>Configure and click Estimate</div>
            </div>
          </Card>
        )}
      </div>

      {estimated && (
        <>
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Ranking Factors</div>
            {estimated.factors.map((f, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < estimated.factors.length - 1 ? "1px solid " + C.border : "none" }}>
                <span style={{ fontSize: 13, color: C.textDim }}>{f.label}</span>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.textMuted }}>{f.value}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: f.contribution >= 0 ? f.color : C.red }}>{f.contribution >= 0 ? "+" : ""}{f.contribution} pts</span>
                </div>
              </div>
            ))}
          </Card>

          {improvements.length > 0 && (
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>🎯 To Move Up in Position</div>
              {improvements.map((imp, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < improvements.length - 1 ? "1px solid " + C.border : "none" }}>
                  <div>
                    <div style={{ fontSize: 13, color: C.text, marginBottom: 2 }}>{imp.action}</div>
                    <div style={{ fontSize: 11, color: C.green }}>{imp.impact}</div>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

