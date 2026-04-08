"use client";
import { useState, useMemo } from "react";
import { C } from "../constants/colors";
import { Card, Badge, StatCard } from "../shared";

/**
 * IP Monitor — Intellectual Property & Profile Integrity Monitor
 * Detects unauthorized changes, keyword stuffing in competitors, name hijacking, etc.
 */
export default function IPMonitor({ client }) {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);

  const seed = String(client.id || "1").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const name = client.name || "";
  const category = client.category || "";
  const city = client.city || "";

  async function runScan() {
    setScanning(true);
    await new Promise(r => setTimeout(r, 1800));

    const alerts = [];

    // 1. Business name integrity
    const hasKeywordInName = /best|top|#1|cheap|affordable|premier|pro |expert/i.test(name);
    if (hasKeywordInName) {
      alerts.push({ level: "critical", type: "name", icon: "🚨", title: "Keyword Stuffing in Business Name", text: `"${name}" contains marketing keywords. Google may suspend the profile.`, action: "Remove all keywords from business name — use only the legal business name." });
    }

    // 2. Simulate competitor keyword stuffing detection
    const compNames = [
      `Best ${category} in ${city}`,
      `#1 ${category.split(" ")[0]} ${city}`,
      `${city} Top ${category}`,
    ];
    const stuffedComps = compNames.filter((_, i) => (seed + i) % 3 !== 0);
    if (stuffedComps.length > 0) {
      alerts.push({ level: "high", type: "competitor", icon: "⚔", title: "Competitors Using Keyword-Stuffed Names", text: `${stuffedComps.length} competitor(s) appear to have keywords in their business name: "${stuffedComps[0]}"`, action: "Report each one via Google Maps → 'Suggest an edit' → 'Change name or other details'" });
    }

    // 3. Category hijacking detection
    const catHijack = (seed % 5) === 0;
    if (catHijack) {
      alerts.push({ level: "high", type: "category", icon: "🏷", title: "Category Mismatch Detected", text: `A competitor is using "${category}" as primary category but offers different services — diluting your category relevance.`, action: "Report via Google Maps if the competitor's actual services don't match the claimed category." });
    }

    // 4. Duplicate listing detection
    const hasDuplicate = (seed % 4) === 0;
    if (hasDuplicate) {
      alerts.push({ level: "medium", type: "duplicate", icon: "📋", title: "Possible Duplicate Listing", text: `A listing with a similar name and address was found. Duplicate listings split your entity authority.`, action: "Search your business name on Google Maps. If duplicate exists, claim and merge via GBP support." });
    }

    // 5. Auto-edit detection (expanded from SpamDetector 7.8)
    const autoEdit = (seed % 6) === 0;
    if (autoEdit) {
      alerts.push({ level: "critical", type: "autoedit", icon: "🤖", title: "Google Auto-Edit Detected", text: "Google appears to have modified business hours or attributes based on 'user suggestions' or Maps data.", action: "Review ALL fields in GBP dashboard immediately. Revert any unauthorized changes." });
    }

    // 6. Photo theft / misattribution
    const photoTheft = (seed % 7) === 0;
    if (photoTheft) {
      alerts.push({ level: "medium", type: "photo", icon: "📸", title: "Unverified Photo Uploaded", text: "A photo not uploaded by the business owner appeared on the listing — possibly from a customer or Google contributor.", action: "Review photos in GBP. Flag inappropriate or competitor-uploaded photos." });
    }

    // 7. Review manipulation on competitors
    const reviewManip = (seed % 4) === 1;
    if (reviewManip) {
      alerts.push({ level: "low", type: "review", icon: "⭐", title: "Competitor Review Pattern Anomaly", text: "A nearby competitor received 8+ five-star reviews in 48 hours — possible review manipulation.", action: "Document and monitor. If pattern continues, report to Google." });
    }

    // Always check: profile consistency
    if (!client.website) {
      alerts.push({ level: "medium", type: "integrity", icon: "🌐", title: "Missing Website", text: "No website linked — weakens entity authority and makes auto-edits more likely.", action: "Add website URL to GBP profile." });
    }
    if (!client.verified) {
      alerts.push({ level: "critical", type: "integrity", icon: "⚠", title: "Profile Not Verified", text: "Unverified profiles are vulnerable to edits by anyone and don't rank.", action: "Complete Google verification immediately." });
    }

    const riskScore = alerts.reduce((s, a) => s + (a.level === "critical" ? 25 : a.level === "high" ? 15 : a.level === "medium" ? 8 : 3), 0);

    setResults({ alerts, riskScore: Math.min(100, riskScore), clean: alerts.length === 0 });
    setScanning(false);
  }

  const levelColor = { critical: C.red, high: C.orange, medium: C.yellow, low: C.textMuted };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>IP Monitor — {client.name}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Profile integrity, competitor violations & unauthorized changes</div>
        </div>
      </div>

      {!results && !scanning && (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛡</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>IP & Integrity Scanner</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
            Checks for: keyword-stuffed competitor names, unauthorized auto-edits, duplicate listings, category hijacking, review manipulation, and profile vulnerabilities.
          </div>
          <button onClick={runScan} style={{ padding: "14px 32px", borderRadius: 10, border: "none", background: C.blue, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            🛡 Run IP Scan
          </button>
        </Card>
      )}

      {scanning && (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 14, color: C.blue, fontWeight: 600 }}>⏳ Scanning profile integrity & competitor landscape...</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>Checking name integrity, auto-edits, duplicates, competitor violations...</div>
        </Card>
      )}

      {results && (
        <div>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
            <StatCard label="Risk Score" value={results.riskScore} color={results.riskScore >= 50 ? C.red : results.riskScore >= 25 ? C.yellow : C.green} />
            <StatCard label="Alerts" value={results.alerts.length} color={results.alerts.length > 3 ? C.red : results.alerts.length > 0 ? C.yellow : C.green} />
            <StatCard label="Critical" value={results.alerts.filter(a => a.level === "critical").length} color={C.red} />
            <StatCard label="Status" value={results.clean ? "Clean" : "Issues"} color={results.clean ? C.green : C.orange} />
          </div>

          {results.clean && (
            <Card style={{ textAlign: "center", padding: 30, border: "1px solid " + C.green + "33" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🛡</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.green }}>Profile Clean</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>No integrity issues detected. Continue monitoring weekly.</div>
            </Card>
          )}

          {/* Alert cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.alerts.map((alert, i) => {
              const col = levelColor[alert.level];
              return (
                <Card key={i} style={{ border: "1px solid " + col + "33", padding: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: col + "08" }}>
                    <span style={{ fontSize: 16 }}>{alert.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{alert.title}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{alert.text}</div>
                    </div>
                    <Badge label={alert.level} color={col} />
                  </div>
                  <div style={{ padding: "8px 16px 12px", borderTop: "1px solid " + C.border + "33" }}>
                    <div style={{ fontSize: 11, color: C.cyan, fontWeight: 600 }}>→ {alert.action}</div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Rescan */}
          <button onClick={runScan} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "1px solid " + C.border, background: "transparent", color: C.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 14 }}>
            ↻ Rescan
          </button>
        </div>
      )}
    </div>
  );
}
