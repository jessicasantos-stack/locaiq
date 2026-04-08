"use client";
import { C } from "../constants/colors";
import { Card, Badge, ScoreCircle } from "../shared";
import { AIAnalysisPanel } from "../ai";

export default function AIMode({ client }) {
  const sem = client.semanticData || {};
  const aiScore = sem.score || 0;
  const desc = (client.description || "").toLowerCase();

  // Real chunks from description
  const sentences = (client.description || "").split(/[.!?]+/).filter(s => s.trim().length > 20);
  const geoTerms = ["connecticut","ct","danbury","westchester","ny","nashua","nh","boston","ma","orlando","fl","miami","phoenix","az","austin","tx","seattle","wa","denver","co","las vegas","nv","county","metro"];
  const actTerms = ["specialize","install","build","remodel","repair","renovate","help","optimize","provide","offer","serve","replace","restore","design"];
  const autonomousChunks = sentences.filter(s => {
    const l = s.toLowerCase();
    return geoTerms.some(g => l.includes(g)) && actTerms.some(a => l.includes(a));
  });

  const layers = [
    { name: "Entity", label: "Entity", color: C.blue, icon: "🏢",
      present: ["licensed","contractor","builder","company","specialist","certified","provider","practice","firm"].some(t => desc.includes(t)),
      tip: "Who/what the business is — e.g.: 'licensed general contractor', 'family dental practice'" },
    { name: "Action", label: "Action", color: C.cyan, icon: "⚡",
      present: ["specialize","install","build","remodel","repair","renovate","replace","restore","design","serve","offer"].some(t => desc.includes(t)),
      tip: "What it does — e.g.: 'specialize in kitchen remodeling', 'serving residential homeowners'" },
    { name: "Problem", label: "Problem", color: C.yellow, icon: "🔧",
      present: ["damage","outdated","leak","worn","storm","old","broken","need","upgrade","aging","emergency","problem"].some(t => desc.includes(t)),
      tip: "Why people search — e.g.: 'outdated kitchens', 'storm-damaged siding', 'aging pipes'" },
    { name: "Scenario", label: "Scenario", color: C.green, icon: "🗺️",
      present: ["residential","homeowner","home","commercial","property","emergency","family","patient","client","business"].some(t => desc.includes(t)),
      tip: "Who/when/where — e.g.: 'residential homeowners across Connecticut', 'emergency 24/7 service'" },
  ];

  const layersPresent = layers.filter(l => l.present).length;

  const fanOut = [
    { intent: "Service + Location", example: `"${client.category} in ${client.city}"`, covered: sem.geoTerms >= 1 },
    { intent: "Problem + Solution", example: `"need ${client.category} urgently"`, covered: layers[2].present },
    { intent: "Price Comparison", example: `"how much does ${client.category} cost"`, covered: false },
    { intent: "Urgency + Availability", example: `"${client.category} available now"`, covered: desc.includes("emergency") || desc.includes("24/7") },
    { intent: "Reputation + Rating", example: `"best ${client.category} near me"`, covered: (client.reviewsData?.average || 0) >= 4.5 },
    { intent: "Specific Location", example: `"${client.category} near me"`, covered: sem.geoTerms >= 2 },
  ];

  const statusLabel = aiScore >= 80 ? "Dominant" : aiScore >= 65 ? "Authoritative" : aiScore >= 45 ? "Visible" : "Dormant";
  const statusColor = aiScore >= 80 ? C.green : aiScore >= 65 ? C.cyan : aiScore >= 45 ? C.yellow : C.red;
  const statusDesc = {
    Dominant: "Profile being cited regularly in AI Overviews and AI Packs.",
    Authoritative: "High citation probability. Small improvements ensure constant presence.",
    Visible: "Appears occasionally. Strengthen ontology and triangulation to rank up.",
    Dormant: "Profile invisible to Google's AI. Immediate action required.",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>AI Mode Discovery — {client.name}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onNavigate && onNavigate("description")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.purple + "44", background: C.purple + "15", color: C.purple, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>🧬 Improve Chunks</button>
          <button onClick={() => onNavigate && onNavigate("optimize")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.blue + "44", background: C.blue + "15", color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✨ Rewrite with AI</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
        <Card style={{ textAlign: "center", border: `1px solid ${statusColor}44` }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>GEO Score — AI Mode</div>
          <ScoreCircle score={aiScore} size={110} />
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "inline-block", background: `${statusColor}22`, color: statusColor, borderRadius: 8, padding: "4px 14px", fontSize: 13, fontWeight: 700, border: `1px solid ${statusColor}44` }}>{statusLabel}</div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: C.textDim, lineHeight: 1.6 }}>{statusDesc[statusLabel]}</div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { l: "Layers", v: `${layersPresent}/4`, c: layersPresent === 4 ? C.green : C.yellow },
              { l: "Chunks", v: `${autonomousChunks.length}`, c: autonomousChunks.length >= 2 ? C.green : C.red },
              { l: "Geo Terms", v: `${sem.geoTerms || 0}`, c: (sem.geoTerms || 0) >= 2 ? C.green : C.red },
              { l: "Triangul.", v: `${sem.triTerms || 0}`, c: (sem.triTerms || 0) >= 4 ? C.green : C.yellow },
            ].map(m => (
              <div key={m.l} style={{ background: C.bg, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: m.c }}>{m.v}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{m.l}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>4-Layer Ontology — Real Analysis</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {layers.map(l => (
              <div key={l.name} style={{ display: "flex", gap: 12, padding: "10px 14px", background: C.bg, borderRadius: 10, border: `1px solid ${l.present ? l.color + "33" : C.red + "33"}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: l.present ? l.color : C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{l.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, color: l.present ? l.color : C.red }}>{l.label}</span>
                    <Badge label={l.present ? "✓ Present" : "✗ Missing"} color={l.present ? C.green : C.red} />
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>{l.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Chunks autônomos */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Autonomous Chunks Detected in Description</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>Sentences that work on their own — Google's AI Mode extracts individual chunks, not entire pages.</div>
        {autonomousChunks.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {autonomousChunks.map((chunk, i) => (
              <div key={i} style={{ background: `${C.green}10`, border: `1px solid ${C.green}33`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.text, lineHeight: 1.6 }}>
                <span style={{ color: C.green, fontWeight: 700, marginRight: 8 }}>✓ Chunk {i + 1}</span>{chunk.trim()}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: `${C.red}10`, border: `1px solid ${C.red}33`, borderRadius: 8, padding: 14, fontSize: 13, color: C.red }}>
            ✗ No autonomous chunks detected. Rewrite the description with sentences that contain service + location in the same sentence.
          </div>
        )}
        {(client.description || "").length > 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: C.textMuted }}>
            Current description: {(client.description || "").length} characters · {sentences.length} sentences · {autonomousChunks.length} autonomous chunks
          </div>
        )}
      </Card>

      {/* Fan Out */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>Intent Fan Out — Synthetic Queries</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {fanOut.map(f => (
            <div key={f.intent} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.bg, borderRadius: 8, border: `1px solid ${f.covered ? C.green + "33" : C.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: f.covered ? C.green : C.red, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{f.intent}</div>
                <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{f.example}</div>
              </div>
              <Badge label={f.covered ? "Covered" : "Gap"} color={f.covered ? C.green : C.red} />
            </div>
          ))}
        </div>
      </Card>

      {/* Semantic findings */}
      {(sem.findings || []).length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Complete Semantic Diagnosis</div>
          {sem.findings.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: f.t === "pass" ? C.green : f.t === "warn" ? C.yellow : C.red, fontWeight: 700, flexShrink: 0 }}>{f.t === "pass" ? "✓" : f.t === "warn" ? "⚠" : "✗"}</span>
              <span style={{ fontSize: 13, color: C.textDim, lineHeight: 1.5 }}>{f.m}</span>
            </div>
          ))}
        </Card>
      )}

      {client.scoresData && client.semanticData && (
        <AIAnalysisPanel data={client} scores={client.scoresData} semantic={client.semanticData} analysisType="aimode" />
      )}
    </div>
  );
}

