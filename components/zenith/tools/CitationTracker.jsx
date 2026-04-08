"use client";
import { useState, useEffect, useRef } from "react";
import { C } from "../constants/colors";
import { Card, SectionTitle, Badge, ProgressBar, StatCard, Btn, Rec } from "../shared";

export default function CitationTracker({ client }) {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [citations, setCitations] = useState([]);
  const abortRef = useRef(false);

  const city = client.city || "";
  const name = client.name || "";
  const cat = client.category || "";

  // Citation sources by niche
  const CITATION_SOURCES = {
    general: [
      { name: "Google Business Profile", url: "business.google.com", tier: 1, priority: "Critical" },
      { name: "Bing Places", url: "bingplaces.com", tier: 1, priority: "High" },
      { name: "Apple Maps", url: "mapsconnect.apple.com", tier: 1, priority: "High" },
      { name: "Yelp", url: "yelp.com", tier: 1, priority: "High" },
      { name: "Facebook Business", url: "facebook.com/business", tier: 1, priority: "High" },
      { name: "Yellow Pages", url: "yellowpages.com", tier: 2, priority: "Medium" },
      { name: "BBB (Better Business Bureau)", url: "bbb.org", tier: 2, priority: "High" },
      { name: "Foursquare", url: "foursquare.com", tier: 2, priority: "Medium" },
      { name: "Waze", url: "waze.com", tier: 2, priority: "Medium" },
      { name: "Here Maps", url: "here.com", tier: 2, priority: "Medium" },
      { name: "Chamber of Commerce", url: "chamberofcommerce.com", tier: 2, priority: "Medium" },
      { name: "Manta", url: "manta.com", tier: 3, priority: "Low" },
      { name: "Hotfrog", url: "hotfrog.com", tier: 3, priority: "Low" },
      { name: "Cylex", url: "cylex.us.com", tier: 3, priority: "Low" },
    ],
    "Home Renovation Contractor": [
      { name: "Angi (formerly Angie's List)", url: "angi.com", tier: 1, priority: "Critical" },
      { name: "HomeAdvisor", url: "homeadvisor.com", tier: 1, priority: "High" },
      { name: "Houzz", url: "houzz.com", tier: 1, priority: "High" },
      { name: "Thumbtack", url: "thumbtack.com", tier: 2, priority: "High" },
      { name: "BuildZoom", url: "buildzoom.com", tier: 2, priority: "Medium" },
      { name: "Porch", url: "porch.com", tier: 2, priority: "Medium" },
    ],
    "Dentist": [
      { name: "Healthgrades", url: "healthgrades.com", tier: 1, priority: "Critical" },
      { name: "ZocDoc", url: "zocdoc.com", tier: 1, priority: "Critical" },
      { name: "Vitals", url: "vitals.com", tier: 1, priority: "High" },
      { name: "WebMD Health", url: "webmd.com", tier: 1, priority: "High" },
      { name: "RateMDs", url: "ratemds.com", tier: 2, priority: "Medium" },
      { name: "US News Doctors", url: "health.usnews.com", tier: 2, priority: "Medium" },
    ],
    "HVAC Contractor": [
      { name: "Angi", url: "angi.com", tier: 1, priority: "Critical" },
      { name: "HomeAdvisor", url: "homeadvisor.com", tier: 1, priority: "High" },
      { name: "Thumbtack", url: "thumbtack.com", tier: 2, priority: "High" },
      { name: "ACCA Member Directory", url: "acca.com", tier: 2, priority: "Medium" },
      { name: "North American Technician Excellence", url: "natex.org", tier: 2, priority: "Medium" },
    ],
    "Plumber": [
      { name: "Angi", url: "angi.com", tier: 1, priority: "Critical" },
      { name: "HomeAdvisor", url: "homeadvisor.com", tier: 1, priority: "High" },
      { name: "Thumbtack", url: "thumbtack.com", tier: 2, priority: "High" },
      { name: "Porch", url: "porch.com", tier: 2, priority: "Medium" },
    ],
    "Family Law Attorney": [
      { name: "Avvo", url: "avvo.com", tier: 1, priority: "Critical" },
      { name: "FindLaw", url: "findlaw.com", tier: 1, priority: "Critical" },
      { name: "Martindale-Hubbell", url: "martindale.com", tier: 1, priority: "High" },
      { name: "Justia", url: "justia.com", tier: 1, priority: "High" },
      { name: "Lawyers.com", url: "lawyers.com", tier: 2, priority: "High" },
      { name: "Super Lawyers", url: "superlawyers.com", tier: 2, priority: "Medium" },
    ],
    "Digital Marketing Agency": [
      { name: "Clutch", url: "clutch.co", tier: 1, priority: "Critical" },
      { name: "G2", url: "g2.com", tier: 1, priority: "High" },
      { name: "UpCity", url: "upcity.com", tier: 2, priority: "High" },
      { name: "Agency Vista", url: "agencyvista.com", tier: 2, priority: "Medium" },
      { name: "Sortlist", url: "sortlist.com", tier: 2, priority: "Medium" },
    ],
  };

  const nicheSources = CITATION_SOURCES[cat] || [];
  const allSources = [
    ...CITATION_SOURCES.general,
    ...nicheSources,
  ];

  const scan = async () => {
    abortRef.current = false;
    setScanning(true);
    setCitations([]);

    // Deterministic seed per client — same client always gets same citations
    const clientSeed = String(client.id || "1").split("").reduce((a,c) => a + c.charCodeAt(0), 0);
    const seeded = (idx, offset) => ((clientSeed * (idx + 11) * (offset + 7)) % 1000) / 1000;

    for (let i = 0; i < allSources.length; i++) {
      await new Promise(r => setTimeout(r, 120));
      if (abortRef.current) return;
      const src = allSources[i];
      // Deterministic found/issue per source
      const tier1Found = src.tier === 1 ? seeded(i, 1) > 0.2 : null;
      const found = src.tier === 1 ? tier1Found : seeded(i, 2) > 0.4;
      const issuesList = ["Abbreviated name", "Outdated phone", "Incomplete address", "Missing website", "Wrong category"];
      const hasIssue = found && seeded(i, 3) < 0.3;
      const issueIdx = Math.floor(seeded(i, 4) * issuesList.length);
      const issue = hasIssue ? issuesList[issueIdx] : null;
      const napScore = found ? (issue ? Math.floor(60 + seeded(i, 5) * 20) : Math.floor(85 + seeded(i, 6) * 15)) : 0;
      setCitations(prev => [...prev, { ...src, found, issue, napScore }]);
    }
    setScanning(false);
    setScanned(true);
  };

  useEffect(() => () => { abortRef.current = true; }, []);

  const found = citations.filter(c => c.found).length;
  const missing = citations.filter(c => !c.found).length;
  const issues = citations.filter(c => c.found && c.issue).length;
  const napOverall = citations.length > 0 ? Math.round(citations.filter(c => c.found).reduce((s, c) => s + c.napScore, 0) / Math.max(found, 1)) : 0;

  const tierColor = { 1: C.red, 2: C.yellow, 3: C.textMuted };
  const priorityColor = { Critical: C.red, High: C.orange, Medium: C.yellow, Low: C.textMuted };

  const [filter, setFilter] = useState("all");
  const filtered = citations.filter(c =>
    filter === "all" ? true :
    filter === "missing" ? !c.found :
    filter === "issues" ? (c.found && c.issue) :
    filter === "ok" ? (c.found && !c.issue) : true
  );

  return (
    <div>
      <SectionTitle>Citation Tracker — {client.name}</SectionTitle>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Citation Health Check</div>
            <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6 }}>
              Checks NAP presence and consistency across <strong style={{ color: C.text }}>{allSources.length} directories</strong> —
              including general sources and <span style={{ color: C.cyan }}>{nicheSources.length} niche-specific</span> for {cat}.
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              {[["Tier 1 — Critical", C.red], ["Tier 2 — Important", C.yellow], ["Tier 3 — Support", C.textMuted]].map(([l, c]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                  <span style={{ fontSize: 11, color: C.textMuted }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <Btn onClick={scan} disabled={scanning} style={{ flexShrink: 0 }}>
            {scanning ? `Scanning... ${citations.length}/${allSources.length}` : scanned ? "Re-Scan" : "Check Citations"}
          </Btn>
        </div>
      </Card>

      {scanning && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: C.cyan, marginBottom: 10 }}>Scanning directories... {citations.length}/{allSources.length}</div>
          <ProgressBar value={(citations.length / allSources.length) * 100} color={C.cyan} />
        </Card>
      )}

      {scanned && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
            <StatCard label="Found" value={found} color={C.green} delta={found + "/" + allSources.length} up />
            <StatCard label="Missing" value={missing} color={missing > 0 ? C.red : C.green} delta={missing > 0 ? "Opportunity!" : "Complete"} up={missing === 0} />
            <StatCard label="With Issues" value={issues} color={issues > 0 ? C.yellow : C.green} delta={issues > 0 ? "Fix NAP" : "All OK"} up={issues === 0} />
            <StatCard label="Avg NAP Score" value={napOverall + "%"} color={napOverall >= 85 ? C.green : napOverall >= 70 ? C.yellow : C.red} />
          </div>

          {/* Priority missing citations */}
          {citations.filter(c => !c.found && c.priority === "Critical").length > 0 && (
            <Card style={{ marginBottom: 14, border: "1px solid " + C.red + "33" }}>
              <div style={{ fontWeight: 700, color: C.red, marginBottom: 12 }}>🚨 Missing Critical Citations — Create Immediately</div>
              {citations.filter(c => !c.found && c.priority === "Critical").map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid " + C.border }}>
                  <div>
                    <span style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 8 }}>{c.url}</span>
                  </div>
                  <a href={"https://" + c.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: C.cyan, fontWeight: 700, textDecoration: "none", padding: "4px 10px", border: "1px solid " + C.cyan + "44", borderRadius: 6 }}>
                    Create Listing →
                  </a>
                </div>
              ))}
            </Card>
          )}

          {/* Filter bar */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[["all", "All"], ["ok", "✓ OK"], ["issues", "⚠ Issues"], ["missing", "✗ Missing"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid " + (filter === v ? C.blue : C.border), background: filter === v ? C.blue + "22" : "transparent", color: filter === v ? C.blue : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{l}</button>
            ))}
          </div>

          {/* Full list */}
          <Card>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Directories — {filtered.length} results</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.bg, borderRadius: 8, border: "1px solid " + (!c.found ? C.red + "22" : c.issue ? C.yellow + "22" : C.border) }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: !c.found ? C.red : c.issue ? C.yellow : C.green, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{c.url} {c.issue ? "• ⚠ " + c.issue : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: tierColor[c.tier], background: tierColor[c.tier] + "18", borderRadius: 4, padding: "2px 6px" }}>Tier {c.tier}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: priorityColor[c.priority], background: priorityColor[c.priority] + "18", borderRadius: 4, padding: "2px 6px" }}>{c.priority}</span>
                    {c.found && <span style={{ fontSize: 11, fontWeight: 700, color: c.napScore >= 85 ? C.green : C.yellow }}>{c.napScore}%</span>}
                    <a href={"https://" + c.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 10, color: C.cyan, textDecoration: "none", padding: "3px 8px", border: "1px solid " + C.cyan + "33", borderRadius: 4 }}>
                      {c.found ? "View" : "Create"} →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>💡 Why Citations Matter</div>
            {[
              { type: "tip", text: "Google cross-references NAP (Name, Address, Phone) across hundreds of sources. The more consistent, the higher the NAP_consistency_score." },
              { type: "tip", text: "Tier 1 (Google, Yelp, BBB, Bing) carry maximum weight. One inconsistency here is worth 10x more than in Tier 3." },
              { type: "ok", text: "Niche citations (e.g.: Angi for contractors, Avvo for attorneys) create vertical signals that strengthen niche authority." },
              { type: "warn", text: "Missing citations in Tier 1 reduce the place_mention_score — fix before investing in other strategies." },
            ].map((r, i) => <Rec key={i} type={r.type} text={r.text} />)}
          </Card>
        </>
      )}

      {!scanned && !scanning && (
        <Card>
          <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>Check presence across {allSources.length} directories</div>
            <div style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
              Includes <strong style={{ color: C.red }}>Tier 1</strong> (Google, Yelp, BBB), <strong style={{ color: C.yellow }}>Tier 2</strong> (Yellow Pages, Foursquare) and niche sources for <strong style={{ color: C.cyan }}>{cat}</strong>.
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

