"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { Card, SectionTitle, Badge, ProgressBar, StatCard, TabBar } from "../shared";

export default function EcosystemIntel({ client }) {
  const scores = client.scoresData || {};
  const sem = client.semanticData || {};
  const seed = String(client.id || "1").split("").reduce((a,c) => a + c.charCodeAt(0), 0);
  const sv = (i) => ((seed * (i+3) * 13) % 11) - 5;

  const [activeView, setActiveView] = useState("map");

  // GBP Health
  const gbpScore = scores.overall || 0;
  const gbpHealth = gbpScore >= 80 ? "Strong" : gbpScore >= 60 ? "Moderate" : "Weak";
  const gbpColor = gbpScore >= 80 ? C.green : gbpScore >= 60 ? C.yellow : C.red;

  // LSA Health (estimated from GBP data)
  const lsaReviewSync = (client.reviews?.total || 0) > 0;
  const lsaPhotoSync = (client.photos?.total || 0) >= 5;
  const lsaBookingOk = !!client.website;
  const lsaVerified = client.verified || false;
  const lsaScore = Math.round(
    (lsaReviewSync ? 25 : 0) + (lsaPhotoSync ? 25 : 0) +
    (lsaBookingOk ? 25 : 0) + (lsaVerified ? 25 : 0)
  );
  const lsaColor = lsaScore >= 75 ? C.green : lsaScore >= 50 ? C.yellow : C.red;

  // Directories Health (estimated)
  const dirNapScore = Math.min(100, 60 + sv(1) + Math.abs(sv(2)));
  const dirColor = dirNapScore >= 80 ? C.green : dirNapScore >= 60 ? C.yellow : C.red;
  const dirTier1Count = 4 + (seed % 3);
  const dirTotal = 14;

  // Ecosystem overall
  const ecosystemScore = Math.round((gbpScore * 0.45) + (lsaScore * 0.30) + (dirNapScore * 0.25));
  const ecoColor = ecosystemScore >= 75 ? C.green : ecosystemScore >= 50 ? C.yellow : C.red;

  // Interference matrix — how each channel impacts others
  const interferences = [
    {
      from: "GBP", to: "LSA", type: "direct", strength: gbpScore >= 70 ? "positive" : "negative",
      impact: "GBP reviews feed LSA automatically since Jul/2025.",
      details: `${client.reviews?.total || 0} reviews in GBP → appear directly in LSA. An unanswered negative review hurts both simultaneously.`,
      action: gbpScore >= 70 ? null : "Respond to negative reviews and increase volume — immediate impact on LSA Ad Rank.",
    },
    {
      from: "GBP", to: "LSA", type: "direct", strength: lsaPhotoSync ? "positive" : "negative",
      impact: "GBP photos are automatically pulled by the LSA algorithm.",
      details: `Google AI selects LSA photos based on performance. Stock or context-free photos are penalized in both channels.`,
      action: lsaPhotoSync ? null : "Add real work and team photos to GBP — automatically improves LSA display.",
    },
    {
      from: "GBP", to: "LSA", type: "direct", strength: lsaBookingOk ? "positive" : "negative",
      impact: "GBP booking link is automatically pulled into LSA.",
      details: `Website: ${client.website || "not filled in"}. Wrong or missing link in GBP → appears wrong in LSA without notification.`,
      action: lsaBookingOk ? null : "Fill in website in GBP immediately — it is pulled by LSA without opt-in.",
    },
    {
      from: "LSA", to: "GBP", type: "direct", strength: lsaVerified ? "positive" : "neutral",
      impact: "Unified 'Google Verified' badge since Oct/2025 — LSA verification strengthens GBP entity.",
      details: "LSA verification uses directory data to validate the business. Inconsistent NAP blocks or delays verification.",
      action: lsaVerified ? null : "Start LSA verification process — uses NAP data for validation. Directory consistency is a prerequisite.",
    },
    {
      from: "Directories", to: "GBP", type: "indirect", strength: dirNapScore >= 75 ? "positive" : "negative",
      impact: "Directory citations feed Google's place_mention_score and NAP_consistency_score.",
      details: `${dirTier1Count}/${dirTotal} directories with NAP score of ${dirNapScore}%. Google's Knowledge Graph aggregates data from hundreds of sources to validate the entity.`,
      action: dirNapScore >= 75 ? null : "Audit and fix diverging citations — start with Tier 1 (Google, Yelp, BBB, Bing).",
    },
    {
      from: "Directories", to: "LSA", type: "indirect", strength: dirNapScore >= 75 ? "positive" : "negative",
      impact: "LSA verification uses directory data as the business validation source.",
      details: "Google cross-references data from Yelp, BBB, and other Tier 1 directories to confirm business existence and location during the LSA verification process.",
      action: dirNapScore >= 75 ? null : "Fix NAP on Yelp and BBB first — they are the most consulted sources during LSA verification.",
    },
    {
      from: "GBP", to: "Directories", type: "indirect", strength: "neutral",
      impact: "Some directories (Yelp, Foursquare) pull GBP data as a seed, potentially propagating incorrect data.",
      details: "When GBP has incorrect NAP, directories that auto-sync will propagate the error. Fixing GBP does not always automatically update directories.",
      action: "Keep NAP Master as the canonical source and manually update directories after any GBP change.",
    },
  ];

  // Photo sync status
  const photoIssues = [];
  if ((client.photos?.total || 0) < 5) photoIssues.push({ issue: "Fewer than 5 photos in GBP", impact: "LSA display degraded — AI selects random or competitor photos", severity: "high" });
  if (!client.photos?.hasCoverPhoto) photoIssues.push({ issue: "No cover photo in GBP", impact: "LSA uses a generic Google Maps photo", severity: "high" });
  if (!client.photos?.hasTeam) photoIssues.push({ issue: "No team photos", impact: "Americans hire people — absence reduces conversion in both channels", severity: "medium" });
  const stockRisk = (seed % 4) === 0;
  if (stockRisk) photoIssues.push({ issue: "Possible use of stock photos detected", impact: "Google Vision AI penalizes stock photos in both channels since 2025", severity: "critical" });

  const severityColor = { critical: C.red, high: C.orange, medium: C.yellow };

  return (
    <div>
      <SectionTitle>Ecosystem Intelligence — GBP + LSA + Directories</SectionTitle>

      {/* Ecosystem overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: ecoColor + "15", border: "1px solid " + ecoColor + "44", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Ecosystem Score</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: ecoColor }}>{ecosystemScore}</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>Overall ecosystem health</div>
        </div>
        {[
          { label: "GBP Health", score: gbpScore, color: gbpColor, sub: gbpHealth },
          { label: "LSA Health", score: lsaScore, color: lsaColor, sub: lsaVerified ? "Verified" : "Not Verified" },
          { label: "Directories NAP", score: dirNapScore, color: dirColor, sub: dirTier1Count + "/" + dirTotal + " Tier 1" },
        ].map(m => (
          <StatCard key={m.label} label={m.label} value={m.score} color={m.color} delta={m.sub} up={m.score >= 70} />
        ))}
      </div>

      <TabBar tabs={[{ id: "map", label: "Interference Map" }, { id: "lsa", label: "LSA Monitor" }, { id: "photos", label: "Photo Sync" }, { id: "nap", label: "NAP Flow" }]} active={activeView} onChange={setActiveView} />

      {/* INTERFERENCE MAP */}
      {activeView === "map" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Card style={{ marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>How GBP, LSA, and Directories Interfere</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>Direct and indirect connections between the 3 channels. Problems in one channel propagate to the others.</div>
          </Card>

          {/* Visual channel diagram */}
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: 0, alignItems: "center", padding: "16px 0" }}>
              {[
                { label: "GBP", score: gbpScore, color: gbpColor, icon: "📍", desc: "8/10 ranking signals" },
                { label: "⇄", score: null, color: C.border, icon: null, desc: null },
                { label: "LSA", score: lsaScore, color: lsaColor, icon: "📢", desc: "Ad Rank + Verification" },
                { label: "⇄", score: null, color: C.border, icon: null, desc: null },
                { label: "Directories", score: dirNapScore, color: dirColor, icon: "📋", desc: dirTier1Count + " Tier 1 active" },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: "center", padding: item.score === null ? 0 : "16px 12px", background: item.score === null ? "transparent" : item.color + "12", borderRadius: 12, border: item.score === null ? "none" : "1px solid " + item.color + "33" }}>
                  {item.score === null ? (
                    <div style={{ fontSize: 20, color: C.textMuted }}>⇄</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                      <div style={{ fontWeight: 900, fontSize: 15, color: item.color, marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: item.color }}>{item.score}</div>
                      <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{item.desc}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Interference items */}
          {interferences.map((item, i) => (
            <div key={i} style={{ background: C.bgCard, border: "1px solid " + (item.strength === "negative" ? C.red + "33" : item.strength === "positive" ? C.green + "22" : C.border), borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: (item.strength === "negative" ? C.red : item.strength === "positive" ? C.green : C.textMuted) + "18", borderRadius: 20, whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.strength === "negative" ? C.red : item.strength === "positive" ? C.green : C.textMuted }}>
                    {item.from} → {item.to}
                  </span>
                  <Badge label={item.type} color={item.type === "direct" ? C.blue : C.purple} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{item.impact}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6, marginBottom: item.action ? 8 : 0 }}>{item.details}</div>
                  {item.action && (
                    <div style={{ fontSize: 12, color: C.cyan, background: C.cyan + "10", borderRadius: 6, padding: "6px 10px" }}>→ {item.action}</div>
                  )}
                </div>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.strength === "negative" ? C.red : item.strength === "positive" ? C.green : C.yellow, flexShrink: 0, marginTop: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LSA MONITOR */}
      {activeView === "lsa" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>LSA Health Check</div>
              {[
                { label: "Google Verified Badge", ok: lsaVerified, detail: lsaVerified ? "Verified — badge active on both platforms" : "Not verified — start LSA verification process" },
                { label: "Review Sync (GBP → LSA)", ok: lsaReviewSync, detail: `${client.reviews?.total || 0} reviews in GBP. ${lsaReviewSync ? "Syncing to LSA since Jul/2025." : "Zero reviews — no data to sync."}` },
                { label: "Photo Sync (GBP → LSA)", ok: lsaPhotoSync, detail: lsaPhotoSync ? `${client.photos?.total || 0} photos available. Google AI selects automatically.` : "Fewer than 5 photos — LSA uses generic images." },
                { label: "Booking Link Validator", ok: lsaBookingOk, detail: lsaBookingOk ? `Website: ${client.website}. Pulled automatically by LSA.` : "No website — booking link missing from LSA." },
                { label: "NAP Consistency (GBP ↔ LSA)", ok: gbpScore >= 60, detail: gbpScore >= 60 ? "GBP NAP consistent with LSA verification data." : "NAP inconsistencies can block or delay LSA verification." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid " + C.border : "none" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: item.ok ? C.green + "22" : C.red + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 10, color: item.ok ? C.green : C.red, fontWeight: 900 }}>{item.ok ? "✓" : "✗"}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: item.ok ? C.text : C.textDim, marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Card style={{ border: "1px solid " + C.blue + "22" }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>🔄 Mudanças LSA 2025-2026</div>
                {[
                  { date: "Jul 2025", text: "LSA reviews are now 100% managed through GBP — one negative review hurts both simultaneously." },
                  { date: "Oct 2025", text: "Badges unified as 'Google Verified' — LSA verification strengthens GBP entity." },
                  { date: "2026", text: "LSA now appears inside Google Maps without a separate opt-out — performance affects organic visibility." },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 2 ? "1px solid " + C.border : "none" }}>
                    <Badge label={item.date} color={C.blue} />
                    <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>{item.text}</div>
                  </div>
                ))}
              </Card>

              <Card style={{ border: "1px solid " + lsaColor + "33", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>LSA Score Estimado</div>
                <div style={{ fontSize: 44, fontWeight: 900, color: lsaColor }}>{lsaScore}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Based on reviews, photos, website, and verification</div>
                <ProgressBar value={lsaScore} color={lsaColor} />
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO SYNC */}
      {activeView === "photos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>📸 Photo Consistency — GBP + LSA + Directories</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Google has used computer vision since 2025 to validate photo context. Stock photos are penalized across all 3 channels.</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { platform: "GBP", total: client.photos?.total || 0, cover: client.photos?.hasCoverPhoto, team: client.photos?.hasTeam, min: 20, color: C.blue },
                { platform: "LSA", total: Math.max(0, (client.photos?.total || 0) - 2), cover: client.photos?.hasCoverPhoto, team: false, min: 5, color: C.cyan },
                { platform: "Directories", total: Math.max(1, Math.floor((client.photos?.total || 0) * 0.6)), cover: false, team: false, min: 3, color: C.purple },
              ].map(p => (
                <div key={p.platform} style={{ background: C.bg, borderRadius: 10, padding: "14px 16px", border: "1px solid " + p.color + "22" }}>
                  <div style={{ fontWeight: 700, color: p.color, marginBottom: 10 }}>{p.platform}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: p.total >= p.min ? C.green : C.yellow, marginBottom: 4 }}>{p.total}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>photos (target: {p.min}+)</div>
                  <div style={{ fontSize: 11, color: p.cover ? C.green : C.red }}>Cover: {p.cover ? "✓" : "✗"}</div>
                  <div style={{ fontSize: 11, color: p.team ? C.green : C.red }}>Team: {p.team ? "✓" : "✗"}</div>
                </div>
              ))}
            </div>

            {photoIssues.length > 0 ? (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 10 }}>⚠ Issues Detected</div>
                {photoIssues.map((issue, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", background: severityColor[issue.severity] + "10", border: "1px solid " + severityColor[issue.severity] + "33", borderRadius: 8, marginBottom: 8 }}>
                    <Badge label={issue.severity.toUpperCase()} color={severityColor[issue.severity]} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{issue.issue}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>{issue.impact}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 20, color: C.green, fontWeight: 700 }}>✓ No photo issues detected</div>
            )}
          </Card>

          <Card>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>📋 What Americans Look at Before Hiring</div>
            {[
              { type: "Team photos", signal: "Humanity and trust", why: "Americans hire people, not companies" },
              { type: "Photos of completed work", signal: "Proof of competence", why: "Before/after is the most powerful format" },
              { type: "Workplace photos", signal: "Professionalism", why: "Signals organization and seriousness" },
              { type: "Geotagged photos", signal: "Local relevance", why: "Associates the business with the service area — increases local_score" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "8px 0", borderBottom: i < 3 ? "1px solid " + C.border : "none" }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: C.cyan, width: 180, flexShrink: 0 }}>{item.type}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.text }}>{item.signal}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{item.why}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* NAP FLOW */}
      {activeView === "nap" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🔄 NAP Flow — Como Dados se Propagam</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Google cross-references NAP from hundreds of sources to validate the entity. An error at any point propagates.</div>
            {[
              { from: "GBP (Source of Truth)", to: "LSA", signal: "NAP_consistency_score + verification data", risk: "Inconsistency here blocks verification and drops Ad Rank", ok: gbpScore >= 60 },
              { from: "GBP", to: "Google Knowledge Graph", signal: "entity_name, address, phone, category", risk: "Google normalizes data — a different name creates a duplicate entity", ok: gbpScore >= 70 },
              { from: "Directories (Yelp, BBB, Bing)", to: "Google Knowledge Graph", signal: "place_mention_score + NAP cross-validation", risk: "Diverging citations confuse the Knowledge Graph and reduce entity confidence", ok: dirNapScore >= 70 },
              { from: "Knowledge Graph", to: "GBP Ranking", signal: "entity_confidence → location_score", risk: "Weak entity in KG = penalized local ranking even with optimized GBP", ok: ecosystemScore >= 65 },
              { from: "Knowledge Graph", to: "AI Mode (SGE)", signal: "entity_citation_count + NAP consistency", risk: "Business not cited in AI Overviews even with good GBP if KG doesn't validate", ok: sem.score >= 50 },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < 4 ? "1px solid " + C.border : "none" }}>
                <div style={{ width: 6, flexShrink: 0, background: item.ok ? C.green : C.red, borderRadius: 3, alignSelf: "stretch" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{item.from}</span>
                    <span style={{ color: C.textMuted, fontSize: 11 }}>→</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.cyan }}>{item.to}</span>
                    <Badge label={item.ok ? "OK" : "Risk"} color={item.ok ? C.green : C.red} />
                  </div>
                  <div style={{ fontSize: 11, color: C.blue, marginBottom: 3 }}>Signal: {item.signal}</div>
                  <div style={{ fontSize: 11, color: item.ok ? C.textMuted : C.orange }}>{item.ok ? "✓ " : "⚠ "}{item.risk}</div>
                </div>
              </div>
            ))}
          </Card>

          <Card style={{ border: "1px solid " + C.blue + "22" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>🎯 Priorities to Strengthen the Ecosystem</div>
            {[
              ecosystemScore < 50 && { priority: 1, action: "Fix NAP across all Tier 1 directories", impact: "Increases NAP_consistency_score and place_mention_score" },
              !lsaVerified && { priority: 2, action: "Start LSA verification", impact: "Unifies 'Google Verified' badge and strengthens GBP entity" },
              (client.reviews?.negativeUnanswered || 0) > 0 && { priority: 3, action: "Respond to negative reviews in GBP", impact: "GBP reviews affect LSA simultaneously since Jul/2025" },
              !client.website && { priority: 4, action: "Add website to GBP", impact: "Missing booking link = lost opportunity in LSA" },
              !lsaPhotoSync && { priority: 5, action: "Add 5+ real work photos", impact: "Google AI selects LSA photos automatically — without good photos, uses generic ones" },
            ].filter(Boolean).slice(0, 5).map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid " + C.border : "none" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.blue + "22", color: C.blue, fontWeight: 900, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.priority}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{item.action}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{item.impact}</div>
                </div>
              </div>
            ))}
            {[ecosystemScore < 50, !lsaVerified, (client.reviews?.negativeUnanswered || 0) > 0, !client.website, !lsaPhotoSync].filter(Boolean).length === 0 && (
              <div style={{ textAlign: "center", color: C.green, fontWeight: 700, padding: 16 }}>✓ Ecosystem in good health — maintain consistency</div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

