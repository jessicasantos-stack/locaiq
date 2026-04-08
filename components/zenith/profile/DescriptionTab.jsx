"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { Card, Badge } from "../shared";
import { callClaude } from "../utils/ai";

export default function DescriptionTab({ client, onNavigate }) {
  const sem = client.semanticData || {};
  const desc = client.description || "";
  const charCount = desc.length;

  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const city = client.city || client.address?.split(",")[0]?.trim() || "";
  const state = client.address?.split(",")[1]?.trim()?.split(" ")[0] || "";
  const services = (client.services || []).slice(0, 4).join(", ");

  const nicheProblems = {
    "Home Renovation Contractor": "outdated kitchens, storm-damaged exteriors, aging siding",
    "Dentist": "dental anxiety, cosmetic issues, tooth pain",
    "HVAC Contractor": "broken AC in summer heat, high energy bills, heating failures",
    "Plumber": "burst pipes, slow drains, water heater failures",
    "Family Law Attorney": "divorce uncertainty, custody disputes",
    "Digital Marketing Agency": "low Google visibility, zero leads from Maps",
  };
  const problems = nicheProblems[client.category] || "service problems, quality concerns";

  const layers = [
    { n: 1, name: "Entity", color: C.blue, icon: "🏢",
      present: ["licensed","contractor","builder","company","specialist","certified","provider","practice","firm"].some(t => desc.toLowerCase().includes(t)),
      tip: "Who/what the business is" },
    { n: 2, name: "Action", color: C.cyan, icon: "⚡",
      present: ["specialize","install","build","remodel","repair","renovate","replace","restore","design","serve","offer"].some(t => desc.toLowerCase().includes(t)),
      tip: "What it does" },
    { n: 3, name: "Problem", color: C.yellow, icon: "🔧",
      present: ["damage","outdated","leak","worn","storm","old","broken","need","upgrade","aging","emergency"].some(t => desc.toLowerCase().includes(t)),
      tip: "Why people search" },
    { n: 4, name: "Scenario", color: C.green, icon: "🗺️",
      present: ["residential","homeowner","home","commercial","property","emergency","family","patient","client","business"].some(t => desc.toLowerCase().includes(t)),
      tip: "Who/when/where it serves" },
  ];

  const layersPresent = layers.filter(l => l.present).length;
  const missing = layers.filter(l => !l.present).map(l => l.name);

  const handleGenerate = async () => {
    setGenerating(true);
    setSaved(false);
    const prompt = `Generate an optimized Google Business Profile description for:
Business: ${client.name}
Category: ${client.category}
City: ${city}, ${state}
Services: ${services}
Problems solved: ${problems}
Use the 4-layer ontology (Entity + Action + Problem + Scenario). Each sentence must be a self-contained semantic chunk. Maximum 750 characters. Output ONLY the description text, no headers or labels.`;
    const result = await callClaude(prompt, 400);
    setGenerated(result || "");
    setEditText(result || "");
    setEditing(true);
    setGenerating(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/gbp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-description",
          accountId: client.accountId || client._accountId,
          locationId: client.locationId || client._locationId || client.id,
          description: editText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSaved(true);
    } catch (err) {
      console.error("Save description error:", err);
      alert("Erro ao salvar: " + (err.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, paddingBottom: 10, borderBottom: "1px solid " + C.border }}>Profile Description — {client.name}</div>
        {desc.length < 400 && (
          <span style={{ padding: "6px 12px", borderRadius: 6, background: C.red + "15", color: C.red, fontSize: 11, fontWeight: 700 }}>⚠ Too short ({desc.length} chars)</span>
        )}
      </div>

      {/* Current description + Generate/Edit/Save */}
      <Card style={{ marginBottom: 16, border: `1px solid ${charCount >= 400 ? C.green + "33" : C.yellow + "33"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>Current GBP Description</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: charCount >= 700 ? C.green : charCount >= 400 ? C.yellow : C.red, fontWeight: 700 }}>{charCount}/750 characters</span>
            <Badge label={charCount >= 700 ? "Excellent" : charCount >= 400 ? "Medium" : "Insufficient"} color={charCount >= 700 ? C.green : charCount >= 400 ? C.yellow : C.red} />
          </div>
        </div>

        {desc ? (
          <div style={{ padding: 16, background: C.bg, borderRadius: 8, fontSize: 14, color: C.text, lineHeight: 1.8, border: `1px solid ${C.border}`, marginBottom: 12 }}>
            {desc}
          </div>
        ) : (
          <div style={{ padding: 16, background: `${C.red}10`, borderRadius: 8, fontSize: 13, color: C.red, border: `1px solid ${C.red}33`, marginBottom: 12 }}>
            ✗ Description not filled in — critical field for local SEO and AI Mode.
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: C.textMuted }}>
            Semantic score: <span style={{ color: sem.score >= 70 ? C.green : sem.score >= 45 ? C.yellow : C.red, fontWeight: 700 }}>{sem.score || 0}/100</span>
          </div>
          <div style={{ fontSize: 12, color: C.textMuted }}>·</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>
            Layers: <span style={{ color: layersPresent === 4 ? C.green : C.yellow, fontWeight: 700 }}>{layersPresent}/4</span>
          </div>
          {missing.length > 0 && (
            <div style={{ fontSize: 12, color: C.red }}>· Missing: {missing.join(", ")}</div>
          )}
        </div>

        {/* Generate button */}
        {!editing && (
          <button onClick={handleGenerate} disabled={generating}
            style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${C.blue},${C.cyan})`, color: "#fff", fontWeight: 700, fontSize: 12, cursor: generating ? "wait" : "pointer", opacity: generating ? 0.7 : 1 }}>
            {generating ? "⏳ Generating..." : "✨ Generate with AI"}
          </button>
        )}

        {/* Editable generated description */}
        {editing && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>✨ Generated Description — edit before saving</span>
              <span style={{ fontSize: 11, color: editText.length > 750 ? C.red : C.textMuted, fontWeight: 600 }}>{editText.length}/750</span>
            </div>
            <textarea
              value={editText}
              onChange={e => { setEditText(e.target.value); setSaved(false); }}
              style={{
                width: "100%", minHeight: 120, padding: 14, background: `${C.green}08`, border: `1px solid ${C.green}33`,
                borderRadius: 8, fontSize: 13, color: C.text, lineHeight: 1.7, resize: "vertical",
                fontFamily: "inherit", outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={handleSave} disabled={saving || saved || editText.length === 0 || editText.length > 750}
                style={{
                  padding: "9px 20px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12, cursor: saving ? "wait" : "pointer",
                  background: saved ? C.green : `linear-gradient(135deg,${C.green},${C.cyan})`,
                  color: "#fff", opacity: (saving || editText.length === 0 || editText.length > 750) ? 0.5 : 1,
                }}>
                {saving ? "⏳ Saving..." : saved ? "✓ Saved" : "💾 Save to Profile"}
              </button>
              <button onClick={handleGenerate} disabled={generating}
                style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${C.blue}44`, background: "transparent", color: C.blue, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                {generating ? "⏳..." : "🔄 Generate another"}
              </button>
              <button onClick={() => { setEditing(false); setGenerated(""); setSaved(false); }}
                style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
                Cancelar
              </button>
            </div>
            {saved && (
              <div style={{ marginTop: 8, fontSize: 11, color: C.green, fontWeight: 600 }}>
                ✓ Description saved. The update to the Google profile will be applied automatically.
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 4 Layers analysis */}
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 16 }}>4-Layer Mini Ontology — Current Description Analysis</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {layers.map(l => (
            <div key={l.n} style={{ display: "flex", gap: 14, padding: "12px 14px", background: C.bg, borderRadius: 10, border: `1px solid ${l.present ? l.color + "33" : C.red + "33"}` }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: l.present ? l.color : C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{l.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, color: l.present ? l.color : C.red }}>Layer {l.n}: {l.name}</span>
                  <Badge label={l.present ? "✓ Detected" : "✗ Missing"} color={l.present ? C.green : C.red} />
                </div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{l.tip}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
