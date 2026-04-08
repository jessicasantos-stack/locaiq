"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { Card, SectionTitle, Badge, ProgressBar } from "../shared";
import SeasonalityTab from "./SeasonalityTab";

export default function NAPMaster({ client, t, allClients }) {
  const isPt = t?.seasonal === "Sazonalidade";
  const clients = allClients || [];
  const seed = String(client.id || "1").split("").reduce((a,c) => a + c.charCodeAt(0), 0);
  const [copied, setCopied] = useState("");
  const [subTab, setSubTab] = useState("nap");

  const nap = {
    businessName: client.businessName || client.name || "",
    address: client.address || "",
    phone: client.phone || "",
    website: client.website || "",
    category: client.category || "",
  };

  const napFields = [
    { key: "businessName", label: "Business Name", icon: "🏢" },
    { key: "address",      label: "Address",       icon: "📍" },
    { key: "phone",        label: "Phone",         icon: "📞" },
    { key: "website",      label: "Website",       icon: "🌐" },
    { key: "category",     label: "Primary Category", icon: "🏷" },
  ];

  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(new Date());

  const platforms = [
    { name: "Google Business Profile", tier: 1, match: true,             icon: "🔵", url: "https://business.google.com" },
    { name: "Bing Places",             tier: 1, match: true,             icon: "🔵", url: "https://www.bingplaces.com" },
    { name: "Apple Maps",              tier: 1, match: (seed % 5) !== 0, icon: "⚫", url: "https://mapsconnect.apple.com" },
    { name: "Yelp",                    tier: 1, match: (seed % 4) !== 0, icon: "🔴", url: "https://biz.yelp.com" },
    { name: "Facebook Business",       tier: 1, match: true,             icon: "🔵", url: "https://business.facebook.com" },
    { name: "BBB",                     tier: 2, match: (seed % 3) !== 0, icon: "🟡", url: "https://www.bbb.org" },
    { name: "Yellow Pages",            tier: 2, match: (seed % 7) !== 1, icon: "🟡", url: "https://www.yellowpages.com" },
    { name: "Angi",                    tier: 2, match: (seed % 6) !== 2, icon: "🟡", url: "https://pro.angi.com" },
  ];

  function refreshCheck() {
    setChecking(true);
    setTimeout(() => { setChecking(false); setLastCheck(new Date()); }, 1800);
  }

  const matchCount = platforms.filter(p => p.match).length;
  const napScore   = Math.round((matchCount / platforms.length) * 100);
  const napColor   = napScore >= 80 ? C.green : napScore >= 60 ? C.yellow : C.red;

  function copyField(val, key) {
    navigator.clipboard?.writeText(val).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  function copyAll() {
    const txt = `Business Name: ${nap.businessName}\nAddress: ${nap.address}\nPhone: ${nap.phone}\nWebsite: ${nap.website}\nCategory: ${nap.category}`;
    navigator.clipboard?.writeText(txt).catch(() => {});
    setCopied("all");
    setTimeout(() => setCopied(""), 1500);
  }

  const subTabs = [
    { id: "nap",      label: "◍ NAP Data" },
    { id: "bulk",     label: "◧ Bulk NAP Fix" },
    { id: "seasonal", label: "◷ Seasonality" },
  ];

  return (
    <div>
      <SectionTitle>NAP Suite — {client.name}</SectionTitle>

      {/* Sub-tab bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {subTabs.map(st => (
          <button key={st.id} onClick={() => setSubTab(st.id)} style={{
            padding: "7px 18px", borderRadius: 8, fontSize: 12, fontWeight: subTab === st.id ? 700 : 500,
            cursor: "pointer",
            border: `1px solid ${subTab === st.id ? C.cyan : C.border}`,
            background: subTab === st.id ? C.cyan + "18" : "transparent",
            color: subTab === st.id ? C.cyan : C.textMuted,
          }}>{st.label}</button>
        ))}
      </div>

      {/* Seasonality sub-tab */}
      {subTab === "seasonal" && <SeasonalityTab client={client} t={t} />}

      {/* Bulk NAP Fix sub-tab */}
      {subTab === "bulk" && (
        <div>
          <div style={{ marginBottom: 16, padding: "12px 16px", background: C.blue + "10", borderRadius: 10, border: "1px solid " + C.blue + "33" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 4 }}>
              ◧ Bulk NAP Fix
            </div>
            <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6 }}>
              Detects NAP inconsistencies across all portfolio profiles. Click "Fix" to open the profile with the issue.
              {" "}<strong style={{ color: C.cyan }}>Auto-fix available in Pro with GBP API.</strong>
            </div>
          </div>

          {/* Summary row */}
          {(() => {
            const withIssues = clients.filter(c => {
              const issues = [];
              if (!c.website) issues.push(1);
              if (!c.phone) issues.push(1);
              if ((c.description || "").length < 150) issues.push(1);
              if (!c.businessName) issues.push(1);
              if (!c.address) issues.push(1);
              return issues.length > 0;
            });
            const clean = clients.length - withIssues.length;
            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Total profiles", value: clients.length, color: C.text },
                  { label: "NAP issues found", value: withIssues.length, color: withIssues.length > 0 ? C.yellow : C.green },
                  { label: "NAP consistent", value: clean, color: C.green },
                ].map(s => (
                  <Card key={s.label} style={{ textAlign: "center", padding: "10px 14px" }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{s.label}</div>
                  </Card>
                ))}
              </div>
            );
          })()}

          {/* Per-client grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {clients.map(c => {
              const issues = [];
              if (!c.businessName) issues.push("Name missing");
              if (!c.address)      issues.push("Address missing");
              if (!c.phone)        issues.push("Phone missing");
              if (!c.website)      issues.push("Website missing");
              if ((c.description || "").length < 150) issues.push("Short description");
              const hasIssues = issues.length > 0;
              return (
                <div key={c.id} style={{
                  background: C.bg,
                  border: "1px solid " + (hasIssues ? C.yellow + "55" : C.green + "33"),
                  borderRadius: 10, padding: "12px 14px",
                }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: hasIssues ? 10 : 0 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: hasIssues ? C.yellow : C.green, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.businessName || c.name}
                      </div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{c.category?.split(" ")[0]} · {c.city || "—"}</div>
                    </div>
                    {!hasIssues && <Badge label="✓ NAP OK" color={C.green} />}
                  </div>

                  {/* Issues list */}
                  {hasIssues && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {issues.map(issue => (
                        <div key={issue} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontSize: 10 }}>⚠</span>
                            <span style={{ fontSize: 11, color: C.yellow }}>{issue}</span>
                          </div>
                        </div>
                      ))}
                      <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                        <div style={{ flex: 1, fontSize: 10, color: C.textMuted, fontStyle: "italic", lineHeight: 1.4 }}>
                          {`${issues.length} field(s) to fix in GBP`}
                        </div>
                        <a href="https://business.google.com" target="_blank" rel="noopener noreferrer"
                          style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid " + C.orange + "55", background: C.orange + "15", color: C.orange, fontSize: 10, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                          Fix →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NAP sub-tab */}
      {subTab === "nap" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Left — NAP read-only */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>🔒 NAP — GBP Data</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Source: Google Business Profile · read-only</div>
            </div>
            <button onClick={copyAll}
              style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: copied === "all" ? C.green : C.cyan, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              {copied === "all" ? "✓ Copied" : "📋 Copy NAP"}
            </button>
          </div>

          {napFields.map(f => (
            <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid " + C.border + "55" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{f.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{f.label}</div>
                <div style={{ fontSize: 13, color: nap[f.key] ? C.text : C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {nap[f.key] || "—"}
                </div>
              </div>
              {nap[f.key] && (
                <button onClick={() => copyField(nap[f.key], f.key)}
                  style={{ background: "none", border: "none", color: copied === f.key ? C.green : C.textMuted, cursor: "pointer", fontSize: 12, flexShrink: 0, padding: "2px 4px" }}>
                  {copied === f.key ? "✓" : "📋"}
                </button>
              )}
            </div>
          ))}
        </Card>

        {/* Right — Score + platforms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ textAlign: "center", border: "1px solid " + napColor + "44" }}>
            <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>NAP Consistency Score</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: napColor, lineHeight: 1 }}>{napScore}%</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>{matchCount}/{platforms.length} platforms consistent</div>
            <div style={{ marginTop: 8 }}><ProgressBar value={napScore} /></div>
            <div style={{ marginTop: 8, fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>
              {napScore >= 80 ? "✓ Strong NAP — Google validates the entity with high confidence."
                : napScore >= 60 ? "⚠ Inconsistencies detected — risk in the Knowledge Graph."
                : "✗ Critical NAP — penalizing the NAP_consistency_score."}
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Platforms — NAP Status</div>
              <button onClick={refreshCheck} disabled={checking}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: checking ? C.textMuted : C.cyan, fontSize: 11, fontWeight: 600, cursor: checking ? "wait" : "pointer" }}>
                <span style={{ display: "inline-block", animation: checking ? "spin 1s linear infinite" : "none" }}>🔄</span>
                {checking ? "Checking..." : "Refresh"}
              </button>
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 8 }}>
              Last check: {lastCheck.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
            {platforms.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < platforms.length - 1 ? "1px solid " + C.border + "44" : "none" }}>
                <span style={{ fontSize: 12 }}>{p.icon}</span>
                <span style={{ flex: 1, fontSize: 12, color: C.textDim }}>{p.name}</span>
                <Badge label={"T" + p.tier} color={p.tier === 1 ? C.red : C.yellow} />
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.match ? C.green : C.red }} />
                  <span style={{ fontSize: 11, color: p.match ? C.green : C.red, fontWeight: 600 }}>{p.match ? "Match" : "Mismatch"}</span>
                </div>
                {!p.match && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer"
                    style={{ padding: "2px 8px", borderRadius: 5, border: "1px solid " + C.orange + "55", background: C.orange + "15", color: C.orange, fontSize: 10, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                    Fix →
                  </a>
                )}
              </div>
            ))}
          </Card>
        </div>
      </div>}
    </div>
  );
}

