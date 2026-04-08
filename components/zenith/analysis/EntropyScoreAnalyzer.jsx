"use client";
import { useState, useMemo } from "react";
import { C } from "../constants/colors";
import { Card, Badge, ScoreCircle } from "../shared";

// ─── Fuzzy Matching Engine ──────────────────────────────────
function normalize(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function fuzzyScore(a, b) {
  const na = normalize(a), nb = normalize(b);
  if (na === nb) return 100;
  if (!na || !nb) return 0;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 100;
  const dist = levenshtein(na, nb);
  return Math.max(0, Math.round((1 - dist / maxLen) * 100));
}

function phoneNormalize(phone) {
  return (phone || "").replace(/[^0-9]/g, "").slice(-10);
}

function phoneMatch(a, b) {
  const na = phoneNormalize(a), nb = phoneNormalize(b);
  if (!na || !nb) return 0;
  return na === nb ? 100 : 0;
}

// ─── Data Sources ───────────────────────────────────────────
const DATA_SOURCES = [
  // Tier 1 — Critical (GBP + major aggregators)
  { id: "gbp", name: "Google Business Profile", tier: 1, icon: "G", color: "#4285F4", isReference: true },
  { id: "dataaxle", name: "Data Axle (Infogroup)", tier: 1, icon: "DA", color: "#1a5276", aggregator: true },
  { id: "localeze", name: "Localeze (Neustar)", tier: 1, icon: "LZ", color: "#2e86c1", aggregator: true },
  { id: "foursquare", name: "Foursquare (Factual)", tier: 1, icon: "4S", color: "#f94877", aggregator: true },
  // Tier 2 — Important directories
  { id: "yelp", name: "Yelp", tier: 2, icon: "Y", color: "#d32323" },
  { id: "bing", name: "Bing Places", tier: 2, icon: "B", color: "#00809d" },
  { id: "apple", name: "Apple Maps", tier: 2, icon: "A", color: "#555555" },
  { id: "facebook", name: "Facebook Business", tier: 2, icon: "f", color: "#1877F2" },
  { id: "bbb", name: "BBB", tier: 2, icon: "BBB", color: "#003f8a" },
  // Tier 3 — Secondary
  { id: "yellowpages", name: "Yellow Pages", tier: 3, icon: "YP", color: "#f6a623" },
  { id: "angi", name: "Angi", tier: 3, icon: "An", color: "#e44000" },
  { id: "nextdoor", name: "Nextdoor", tier: 3, icon: "ND", color: "#8bc34a" },
  // Secretary of State
  { id: "sos", name: "Secretary of State", tier: 1, icon: "SoS", color: "#8e44ad", isOfficial: true },
];

// Deterministic simulation based on client data
function simulateSourceData(client, source) {
  const seed = String(client.id || "1").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const srcSeed = source.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const combined = (seed * srcSeed) % 1000;

  const name = client.businessName || client.name || "";
  const address = client.address || "";
  const phone = client.phone || "";

  if (source.isReference) {
    return { name, address, phone, found: true, status: "reference" };
  }

  // Simulate whether found and with what variations
  const foundChance = source.tier === 1 ? 0.85 : source.tier === 2 ? 0.7 : 0.5;
  const found = (combined % 100) / 100 < foundChance;

  if (!found) {
    return { name: "", address: "", phone: "", found: false, status: "not_found" };
  }

  // Simulate common NAP variations
  const variations = [];

  // Name variations
  const nameVar = combined % 7;
  let simName = name;
  if (nameVar === 0) { simName = name + " LLC"; variations.push("LLC suffix added"); }
  else if (nameVar === 1 && name.includes("LLC")) { simName = name.replace(" LLC", ""); variations.push("LLC suffix removed"); }
  else if (nameVar === 2 && name.length > 15) { simName = name.split(" ").slice(0, 2).join(" "); variations.push("Name truncated"); }

  // Phone variations
  const phoneVar = (combined + srcSeed) % 11;
  let simPhone = phone;
  if (phoneVar === 0) { simPhone = phone.replace(/\(|\)|\s|-/g, ""); variations.push("Different phone format"); }
  else if (phoneVar === 1) { simPhone = ""; variations.push("Missing phone"); }
  else if (phoneVar === 2) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 10) { simPhone = digits.slice(0, -1) + ((parseInt(digits.slice(-1)) + 1) % 10); variations.push("Wrong digit in phone"); }
  }

  // Address variations
  const addrVar = (combined * 3 + srcSeed) % 9;
  let simAddress = address;
  if (addrVar === 0) { simAddress = address.replace(/,\s*\w{2}\s*\d{5}/, ""); variations.push("Missing ZIP code"); }
  else if (addrVar === 1) { simAddress = address.replace("St", "Street").replace("Ave", "Avenue").replace("Dr", "Drive"); variations.push("Different abbreviation"); }
  else if (addrVar === 2) { simAddress = ""; variations.push("Missing address"); }

  // Secretary of State specific — often has registered agent name
  if (source.isOfficial) {
    const sosVar = combined % 4;
    if (sosVar === 0) { simName = name.replace(/\s+(LLC|Inc|Corp|Co)\.?$/i, "") + " Inc."; variations.push("Registered name differs from DBA"); }
    if (sosVar === 1) { simAddress = address.split(",")[0] + ", Registered Agent Address"; variations.push("Registered agent address"); }
  }

  const status = variations.length === 0 ? "match" : "mismatch";
  return { name: simName, address: simAddress, phone: simPhone, found: true, status, variations };
}

// ─── Entropy Score Calculator ───────────────────────────────
function calculateEntropy(client) {
  const refName = client.businessName || client.name || "";
  const refAddress = client.address || "";
  const refPhone = client.phone || "";

  const results = DATA_SOURCES.map(source => {
    const data = simulateSourceData(client, source);
    if (!data.found) {
      return { ...source, data, scores: { name: 0, address: 0, phone: 0, overall: 0 }, status: "not_found" };
    }
    if (source.isReference) {
      return { ...source, data, scores: { name: 100, address: 100, phone: 100, overall: 100 }, status: "reference" };
    }

    const nameScore = fuzzyScore(refName, data.name);
    const addrScore = fuzzyScore(refAddress, data.address);
    const phoneScore = phoneMatch(refPhone, data.phone);

    // Weighted overall: phone exact match is critical
    const overall = Math.round(nameScore * 0.35 + addrScore * 0.35 + phoneScore * 0.30);

    const status = overall >= 95 ? "match" : overall >= 70 ? "partial" : data.found ? "mismatch" : "not_found";

    return { ...source, data, scores: { name: nameScore, address: addrScore, phone: phoneScore, overall }, status };
  });

  // Calculate Entropy Score (0 = perfect consistency, 100 = total chaos)
  const foundSources = results.filter(r => r.data.found && !r.isReference);
  const totalSources = foundSources.length;

  if (totalSources === 0) return { score: 50, results, stats: { found: 0, total: DATA_SOURCES.length - 1, matches: 0, partial: 0, mismatches: 0, notFound: DATA_SOURCES.length - 1 } };

  const avgConsistency = foundSources.reduce((sum, r) => sum + r.scores.overall, 0) / totalSources;
  const entropyScore = Math.round(100 - avgConsistency);

  // Aggregator penalty — inconsistency in aggregators is 2x worse
  const aggregatorResults = foundSources.filter(r => r.aggregator);
  const aggregatorPenalty = aggregatorResults.filter(r => r.scores.overall < 90).length * 5;

  // Not found penalty
  const notFoundPenalty = results.filter(r => !r.data.found && !r.isReference).length * 3;

  const finalScore = Math.max(0, Math.min(100, entropyScore + aggregatorPenalty + notFoundPenalty));

  const stats = {
    found: totalSources,
    total: DATA_SOURCES.length - 1,
    matches: foundSources.filter(r => r.status === "match").length,
    partial: foundSources.filter(r => r.status === "partial").length,
    mismatches: foundSources.filter(r => r.status === "mismatch").length,
    notFound: results.filter(r => !r.data.found && !r.isReference).length,
  };

  return { score: finalScore, results, stats };
}

// ─── Component ─────────────────────────────────────────────
export default function EntropyScoreAnalyzer({ client, onNavigate, t }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const analysis = useMemo(() => calculateEntropy(client), [client]);

  const entropyColor = analysis.score <= 15 ? C.green : analysis.score <= 35 ? C.yellow : C.red;
  const entropyLabel = analysis.score <= 15 ? "Consistent" : analysis.score <= 35 ? "Attention" : "Chaotic";

  const statusConfig = {
    reference: { color: C.blue, label: "Reference", icon: "◎" },
    match: { color: C.green, label: "Match", icon: "✓" },
    partial: { color: C.yellow, label: "Partial", icon: "~" },
    mismatch: { color: C.red, label: "Mismatch", icon: "✕" },
    not_found: { color: C.textMuted, label: "Not Found", icon: "?" },
  };

  const sections = [
    { id: "overview", label: "Overview", icon: "◎" },
    { id: "sources", label: `Sources (${analysis.stats.total + 1})`, icon: "◉" },
    { id: "aggregators", label: "Aggregators", icon: "◈" },
    { id: "actions", label: "Fixes", icon: "→" },
  ];

  // Simulate scanning animation
  async function runScan() {
    setScanning(true);
    await new Promise(r => setTimeout(r, 2000));
    setScanning(false);
    setScanned(true);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>NAP Entropy Score — {client.name}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Data consistency across platforms + Secretary of State</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onNavigate && onNavigate("nap")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.blue + "44", background: C.blue + "15", color: C.blue, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>◍ NAP Suite</button>
          <button onClick={() => onNavigate && onNavigate("contentstudio")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.cyan + "44", background: C.cyan + "15", color: C.cyan, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>◎ Citations</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.bgCard, borderRadius: 10, padding: 4, border: "1px solid " + C.border }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={{ flex: 1, padding: "8px 12px", borderRadius: 7, border: "none", background: activeSection === s.id ? entropyColor + "22" : "transparent", color: activeSection === s.id ? entropyColor : C.textMuted, fontSize: 12, fontWeight: activeSection === s.id ? 700 : 400, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <span style={{ fontSize: 11 }}>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {activeSection === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
            {/* Entropy Score */}
            <Card style={{ textAlign: "center", border: "1px solid " + entropyColor + "44" }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>NAP Entropy Score</div>
              <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto" }}>
                <ScoreCircle score={100 - analysis.score} size={110} />
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: C.textMuted }}>Entropy: {analysis.score}/100</div>
              <div style={{ marginTop: 6 }}>
                <div style={{ display: "inline-block", background: entropyColor + "22", color: entropyColor, borderRadius: 8, padding: "4px 14px", fontSize: 13, fontWeight: 700, border: "1px solid " + entropyColor + "44" }}>
                  {entropyLabel}
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: C.textMuted }}>
                {analysis.score <= 15 ? "NAP consistent across all platforms" : analysis.score <= 35 ? "Some inconsistencies to fix" : "Severe inconsistencies — weakened entity"}
              </div>
            </Card>

            {/* Stats breakdown */}
            <Card>
              <div style={{ fontWeight: 600, marginBottom: 14 }}>Consistency Distribution</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>
                {[
                  { l: "Match", v: analysis.stats.matches, c: C.green },
                  { l: "Partial", v: analysis.stats.partial, c: C.yellow },
                  { l: "Mismatch", v: analysis.stats.mismatches, c: C.red },
                  { l: "Not Found", v: analysis.stats.notFound, c: C.textMuted },
                  { l: "Sources", v: analysis.stats.total + 1, c: C.cyan },
                ].map(m => (
                  <div key={m.l} style={{ background: C.bg, borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: m.c }}>{m.v}</div>
                    <div style={{ fontSize: 9, color: C.textMuted }}>{m.l}</div>
                  </div>
                ))}
              </div>

              {/* NAP Reference */}
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Reference NAP (GBP)</div>
              {[
                { label: "Name", value: client.businessName || client.name, icon: "◈" },
                { label: "Address", value: client.address, icon: "◉" },
                { label: "Phone", value: client.phone, icon: "◇" },
                { label: "Website", value: client.website, icon: "◎" },
              ].map(f => (
                <div key={f.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid " + C.border }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{f.icon} {f.label}</span>
                  <span style={{ fontSize: 11, color: f.value ? C.text : C.red, fontFamily: "'JetBrains Mono', monospace" }}>{f.value || "Not filled in"}</span>
                </div>
              ))}
            </Card>
          </div>

          {/* Consistency bar visualization */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Consistency by Field</div>
            {["name", "address", "phone"].map(field => {
              const label = field === "name" ? "Name" : field === "address" ? "Address" : "Phone";
              const foundResults = analysis.results.filter(r => r.data.found && !r.isReference);
              const avgScore = foundResults.length > 0
                ? Math.round(foundResults.reduce((sum, r) => sum + r.scores[field], 0) / foundResults.length)
                : 0;
              const barColor = avgScore >= 90 ? C.green : avgScore >= 70 ? C.yellow : C.red;
              return (
                <div key={field} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: C.textDim }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{avgScore}%</span>
                  </div>
                  <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: avgScore + "%", height: "100%", background: barColor, transition: "width 0.3s", borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </Card>
        </>
      )}

      {/* ═══ ALL SOURCES ═══ */}
      {activeSection === "sources" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map(tier => {
            const tierResults = analysis.results.filter(r => r.tier === tier);
            if (tierResults.length === 0) return null;
            return (
              <Card key={tier} style={{ marginBottom: 4 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>
                  {tier === 1 ? "Tier 1 — Critical (GBP + Aggregators + SoS)" : tier === 2 ? "Tier 2 — Main Directories" : "Tier 3 — Secondary"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {tierResults.map(r => {
                    const st = statusConfig[r.status];
                    return (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: st.color + "06", border: "1px solid " + st.color + "22", borderRadius: 8 }}>
                        {/* Icon */}
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: r.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: r.color, fontSize: 10, flexShrink: 0 }}>{r.icon}</div>

                        {/* Source info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{r.name}</span>
                            {r.aggregator && <Badge label="Aggregator" color={C.purple} />}
                            {r.isOfficial && <Badge label="Official" color={C.cyan} />}
                          </div>
                          {r.data.found && !r.isReference && r.data.variations?.length > 0 && (
                            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>
                              {r.data.variations.join(" • ")}
                            </div>
                          )}
                          {!r.data.found && (
                            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Listing not found on this platform</div>
                          )}
                        </div>

                        {/* Scores */}
                        {r.data.found && !r.isReference && (
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            {[
                              { l: "N", v: r.scores.name },
                              { l: "A", v: r.scores.address },
                              { l: "P", v: r.scores.phone },
                            ].map(s => (
                              <div key={s.l} style={{ width: 32, textAlign: "center" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: s.v >= 90 ? C.green : s.v >= 70 ? C.yellow : C.red }}>{s.v}</div>
                                <div style={{ fontSize: 8, color: C.textMuted }}>{s.l}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Status badge */}
                        <Badge label={st.label} color={st.color} />
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ AGGREGATORS DEEP DIVE ═══ */}
      {activeSection === "aggregators" && (
        <>
          <Card style={{ marginBottom: 16, padding: "14px 18px", border: "1px solid " + C.purple + "33" }}>
            <div style={{ fontSize: 12, color: C.purple, fontWeight: 600, marginBottom: 4 }}>Why are Aggregators critical?</div>
            <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
              The 4 major aggregators (Data Axle, Localeze, Foursquare, Factual) feed HUNDREDS of smaller directories. Fixing NAP there propagates to the entire ecosystem. One inconsistency here multiplies exponentially.
            </div>
          </Card>

          {analysis.results.filter(r => r.aggregator || r.isOfficial).map(r => {
            const st = statusConfig[r.status];
            const refName = client.businessName || client.name;
            return (
              <Card key={r.id} style={{ marginBottom: 12, border: "1px solid " + st.color + "33" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: r.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: r.color, fontSize: 11 }}>{r.icon}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{r.name}</span>
                    {r.isOfficial && <span style={{ fontSize: 10, color: C.cyan, marginLeft: 8 }}>Official state registration</span>}
                  </div>
                  <Badge label={st.label} color={st.color} />
                </div>

                {r.data.found ? (
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr auto", gap: "6px 12px", alignItems: "center" }}>
                    <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>Campo</div>
                    <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>GBP (Referência)</div>
                    <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>Match</div>

                    {[
                      { label: "Name", ref: refName, val: r.data.name, score: r.scores.name },
                      { label: "Address", ref: client.address, val: r.data.address, score: r.scores.address },
                      { label: "Phone", ref: client.phone, val: r.data.phone, score: r.scores.phone },
                    ].map(field => {
                      const fc = field.score >= 90 ? C.green : field.score >= 70 ? C.yellow : C.red;
                      return [
                        <div key={field.label + "_l"} style={{ fontSize: 11, color: C.textMuted }}>{field.label}</div>,
                        <div key={field.label + "_r"} style={{ fontSize: 11, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{field.ref || "—"}</div>,
                        <div key={field.label + "_v"} style={{ fontSize: 11, color: field.score < 90 ? C.red : C.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: field.score < 90 ? 700 : 400 }}>{field.val || "—"}</div>,
                        <div key={field.label + "_s"} style={{ fontSize: 12, fontWeight: 700, color: fc }}>{field.score}%</div>,
                      ];
                    }).flat()}
                  </div>
                ) : (
                  <div style={{ background: C.red + "08", border: "1px solid " + C.red + "22", borderRadius: 8, padding: 14, textAlign: "center" }}>
                    <span style={{ fontSize: 12, color: C.red }}>Listing NOT found — create profile on this platform</span>
                  </div>
                )}

                {r.data.variations?.length > 0 && (
                  <div style={{ marginTop: 10, padding: "8px 12px", background: C.yellow + "08", borderRadius: 6, border: "1px solid " + C.yellow + "22" }}>
                    <span style={{ fontSize: 10, color: C.yellow, fontWeight: 600 }}>Discrepancies: </span>
                    <span style={{ fontSize: 10, color: C.textMuted }}>{r.data.variations.join(" • ")}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </>
      )}

      {/* ═══ CORRECTIVE ACTIONS ═══ */}
      {activeSection === "actions" && (
        <>
          {/* Priority: fix aggregators first */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Correction Order (Priority)</div>
            {[
              { step: 1, title: "Fix in the 4 Aggregators", desc: "Data Axle, Localeze, Foursquare → propagates to hundreds of directories automatically", impact: "HIGH — fixes 80% of the ecosystem", time: "1-2 weeks to propagate", color: C.red },
              { step: 2, title: "Verify Secretary of State", desc: "Registered name must match GBP. If different, may need a DBA filing", impact: "HIGH — legal base of the entity", time: "Varies by state (1-4 weeks)", color: "#ff8c00" },
              { step: 3, title: "Fix Tier 2 manually", desc: "Yelp, Bing, Apple Maps, Facebook, BBB — each has its own management panel", impact: "MEDIUM — high-traffic directories", time: "1-3 days per platform", color: C.yellow },
              { step: 4, title: "Monitor propagation", desc: "After fixing aggregators, check if smaller directories updated within 2-4 weeks", impact: "MAINTENANCE — ensure consistency", time: "Bi-weekly check", color: C.cyan },
            ].map(action => (
              <div key={action.step} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: action.step < 4 ? "1px solid " + C.border : "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: action.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: action.color, fontSize: 12, flexShrink: 0 }}>{action.step}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 }}>{action.title}</div>
                  <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>{action.desc}</div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 10, color: action.color, fontWeight: 600 }}>Impact: {action.impact}</span>
                    <span style={{ fontSize: 10, color: C.textMuted }}>Time: {action.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </Card>

          {/* Links to aggregator portals */}
          <Card>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Links for Correction</div>
            {[
              { name: "Data Axle", url: "https://www.dataaxle.com", desc: "Submit correction via online form" },
              { name: "Localeze (Neustar)", url: "https://www.neustarlocaleze.biz", desc: "Listing management portal" },
              { name: "Foursquare", url: "https://foursquare.com/manage", desc: "Claim and fix listing" },
              { name: "Yelp Business", url: "https://biz.yelp.com", desc: "Claim and update profile" },
              { name: "Bing Places", url: "https://www.bingplaces.com", desc: "Import from Google or create" },
              { name: "Apple Maps Connect", url: "https://mapsconnect.apple.com", desc: "Claim and fix" },
              { name: "Facebook Business", url: "https://business.facebook.com", desc: "Update page info" },
              { name: "BBB", url: "https://www.bbb.org", desc: "Request profile or correction" },
            ].map(link => (
              <div key={link.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid " + C.border }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{link.name}</span>
                  <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 8 }}>{link.desc}</span>
                </div>
                <span style={{ fontSize: 10, color: C.cyan, fontFamily: "'JetBrains Mono', monospace" }}>{link.url}</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
