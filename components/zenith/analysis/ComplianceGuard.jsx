"use client";
import { useState, useMemo } from "react";
import { C, sc } from "../constants/colors";
import { Card, Badge, ScoreCircle, Rec, Tip } from "../shared";

// ─── Compliance Rules Engine ──────────────────────────────────
// Based on Google Business Profile Guidelines (2024-2026)

const KEYWORD_STUFFING_PATTERNS = [
  /\b(best|top|#1|number one|cheapest|affordable|near me|in \w+)\b/gi,
  /\b(24\/7|open now|call now|free estimate)\b/gi,
];

const VIRTUAL_ADDRESS_INDICATORS = [
  "ups store", "ups mailbox", "po box", "p.o. box", "mailbox", "virtual office",
  "regus", "wework", "coworking", "shared office", "mail forwarding",
  "suite", "ste", "unit", "pmb", "box"
];

const PROHIBITED_NAME_TERMS = [
  "open 24", "24/7", "call now", "free", "best", "top rated", "#1",
  "cheapest", "affordable", "near me", "serving", "licensed", "insured",
  "certified", "professional", "expert", "quality", "guaranteed"
];

function analyzeCompliance(client) {
  const findings = [];
  const name = (client.businessName || client.name || "").toLowerCase();
  const desc = (client.description || "").toLowerCase();
  const address = (client.address || "").toLowerCase();
  const services = (client.services || []);
  const categories = [client.category, ...(client.secondaryCategories || [])].map(c => (c || "").toLowerCase());
  const reviews = client.reviewsData?.samples || client.reviews?.samples || [];
  const reviewTotal = client.reviewsData?.total || 0;
  const last30 = client.reviewsData?.last30days || 0;

  // ═══ 1. Business Name Compliance ═══
  // Google prohibits keywords, location, marketing phrases in business name
  const nameViolations = [];
  PROHIBITED_NAME_TERMS.forEach(term => {
    if (name.includes(term)) nameViolations.push(term);
  });

  // Check if name contains city/state (allowed only if it's the legal business name)
  const cityInName = client.city && name.includes((client.city || "").toLowerCase());

  if (nameViolations.length > 0) {
    findings.push({
      category: "name",
      level: "critical",
      title: "Prohibited keywords in business name",
      detail: `Terms detected: "${nameViolations.join('", "')}". Google may suspend the profile for keyword stuffing in the name.`,
      action: "Remove marketing terms from the name. Use only the legal/DBA registered name.",
      reference: "Google Guidelines: Business name must reflect the real-world name of the business.",
      penalty: 25,
    });
  }

  if (cityInName && nameViolations.length === 0) {
    findings.push({
      category: "name",
      level: "info",
      title: "Name contains city name",
      detail: `"${client.city}" found in name. OK if it is part of the legal/DBA name.`,
      action: "Verify that the name registered with the Secretary of State includes the city.",
      reference: "Google allows geo terms only if part of the legal name.",
      penalty: 0,
    });
  }

  // ═══ 2. Address / Location Compliance ═══
  const virtualIndicators = VIRTUAL_ADDRESS_INDICATORS.filter(v => address.includes(v));
  if (virtualIndicators.length > 0) {
    findings.push({
      category: "address",
      level: "high",
      title: "Possible virtual address detected",
      detail: `Indicators: "${virtualIndicators.join('", "')}". Google prohibits virtual offices, UPS Store, and PO Boxes as GBP address.`,
      action: "Use a real physical address. For SABs (Service Area Businesses), hide address and define service area.",
      reference: "Google Guidelines: Virtual offices and mailboxes are not eligible.",
      penalty: 30,
    });
  }

  if (!client.address || client.address.trim().length < 10) {
    findings.push({
      category: "address",
      level: "medium",
      title: "Incomplete or missing address",
      detail: "Address too short or empty. Profile may be flagged as incomplete.",
      action: "Fill in complete address with number, street, city, state, and ZIP code.",
      reference: "Complete address improves entity confidence.",
      penalty: 10,
    });
  }

  // ═══ 3. Category Compliance ═══
  // Check if primary category makes sense with services listed
  const categoryServiceOverlap = services.some(s =>
    categories.some(c => {
      const sWords = s.toLowerCase().split(/\s+/);
      const cWords = c.split(/\s+/);
      return sWords.some(sw => sw.length > 3 && cWords.some(cw => cw.includes(sw) || sw.includes(cw)));
    })
  );

  if (!categoryServiceOverlap && services.length > 0) {
    findings.push({
      category: "categories",
      level: "medium",
      title: "Primary category may not align with services",
      detail: `Category "${client.category}" has no direct overlap with the listed services. May weaken relevance.`,
      action: "Review whether the primary category is the most specific for the core business.",
      reference: "Primary category is the strongest ranking signal for local search.",
      penalty: 10,
    });
  }

  if ((client.secondaryCategories || []).length === 0) {
    findings.push({
      category: "categories",
      level: "low",
      title: "No secondary categories",
      detail: "No secondary categories defined. Missed opportunity to rank for more searches.",
      action: "Add 2-5 relevant secondary categories.",
      reference: "Secondary categories expand search visibility.",
      penalty: 5,
    });
  }

  if ((client.secondaryCategories || []).length > 8) {
    findings.push({
      category: "categories",
      level: "medium",
      title: "Too many secondary categories",
      detail: `${client.secondaryCategories.length} categories — category spam signal. Google may penalize.`,
      action: "Keep only the 3-5 most relevant categories.",
      reference: "Too many categories dilute relevance signals.",
      penalty: 10,
    });
  }

  // ═══ 4. Review Patterns ═══
  // Abnormal review velocity
  if (reviewTotal > 20 && last30 > reviewTotal * 0.35) {
    findings.push({
      category: "reviews",
      level: "critical",
      title: "Abnormal review velocity",
      detail: `${last30} reviews in the last 30 days = ${Math.round(last30 / reviewTotal * 100)}% of total. Pattern consistent with purchased reviews.`,
      action: "Investigate whether reviews are organic. Purchased reviews result in removal and possible suspension.",
      reference: "Google uses AI to detect fake review velocity patterns.",
      penalty: 25,
    });
  }

  // Reviews with repetitive language
  if (reviews.length >= 3) {
    const reviewTexts = reviews.map(r => (r.text || "").toLowerCase());
    const wordSets = reviewTexts.map(t => new Set(t.split(/\s+/).filter(w => w.length > 3)));
    let similarPairs = 0;
    for (let i = 0; i < wordSets.length; i++) {
      for (let j = i + 1; j < wordSets.length; j++) {
        const intersection = [...wordSets[i]].filter(w => wordSets[j].has(w));
        const union = new Set([...wordSets[i], ...wordSets[j]]);
        if (union.size > 0 && intersection.length / union.size > 0.5) similarPairs++;
      }
    }
    if (similarPairs > 0) {
      findings.push({
        category: "reviews",
        level: "high",
        title: "Reviews with repetitive language",
        detail: `${similarPairs} pair(s) of reviews with >50% words in common. Pattern of fabricated reviews.`,
        action: "Verify that reviews are from real customers. Report suspicious reviews via GBP.",
        reference: "Repetitive language across reviews is a fake review signal.",
        penalty: 15,
      });
    }
  }

  // Negative reviews unanswered
  const negUnanswered = client.reviewsData?.negativeUnanswered || 0;
  if (negUnanswered > 0) {
    findings.push({
      category: "reviews",
      level: "medium",
      title: `${negUnanswered} negative review(s) without response`,
      detail: "Negative reviews without a response affect entity_rating_score and customer perception.",
      action: "Respond to all negative reviews with a professional tone within 24h.",
      reference: "Response rate impacts both SEO and conversion.",
      penalty: 8,
    });
  }

  // ═══ 5. Service Area Plausibility ═══
  // If very many services but no reviews confirming them
  if (services.length > 10) {
    findings.push({
      category: "services",
      level: "low",
      title: "Too many services listed",
      detail: `${services.length} services — may appear as "jack of all trades". Google values specialization.`,
      action: "Keep core services and remove generic ones. Quality > quantity.",
      reference: "Focused service lists improve category relevance.",
      penalty: 5,
    });
  }

  // ═══ 6. Description Compliance ═══
  if (desc.length > 0) {
    // Check for URLs in description (prohibited)
    if (/https?:\/\/|www\./i.test(desc)) {
      findings.push({
        category: "description",
        level: "high",
        title: "URL detected in description",
        detail: "Google prohibits URLs in the GBP description. May cause the description to be rejected.",
        action: "Remove all URLs from the description. Use the Website field for links.",
        reference: "Google Guidelines: URLs not allowed in business description.",
        penalty: 15,
      });
    }
    // Check for phone in description
    if (/\(\d{3}\)\s?\d{3}[-.]?\d{4}|\d{3}[-.]?\d{3}[-.]?\d{4}/.test(client.description || "")) {
      findings.push({
        category: "description",
        level: "medium",
        title: "Phone number in description",
        detail: "Google discourages phone numbers in the description. Use the Phone field.",
        action: "Remove phone number from description.",
        reference: "Phone numbers should be in the dedicated field.",
        penalty: 5,
      });
    }
    // Check for ALL CAPS
    const upperRatio = (client.description || "").replace(/[^a-zA-Z]/g, "").split("").filter(c => c === c.toUpperCase()).length / Math.max((client.description || "").replace(/[^a-zA-Z]/g, "").length, 1);
    if (upperRatio > 0.5 && (client.description || "").length > 50) {
      findings.push({
        category: "description",
        level: "low",
        title: "Excessive ALL CAPS in description",
        detail: `${Math.round(upperRatio * 100)}% of text in uppercase. Looks like spam.`,
        action: "Rewrite in normal case. Only acronyms and proper nouns in uppercase.",
        reference: "ALL CAPS descriptions look spammy and may be penalized.",
        penalty: 5,
      });
    }
  }

  // ═══ 7. Profile Completeness (affects compliance trust) ═══
  if (!client.website) {
    findings.push({
      category: "completeness",
      level: "low",
      title: "Website not filled in",
      detail: "No website = loss of NAP signal and conversion. Google needs to validate the entity.",
      action: "Add official website URL.",
      reference: "Website strengthens entity validation.",
      penalty: 5,
    });
  }

  if (!client.verified) {
    findings.push({
      category: "completeness",
      level: "critical",
      title: "Profile NOT verified",
      detail: "Unverified profile has severely limited visibility on Maps and Search.",
      action: "Verify the profile via postcard, phone, or video IMMEDIATELY.",
      reference: "Verification is required for full GBP visibility.",
      penalty: 30,
    });
  }

  if (!(client.hours?.filled)) {
    findings.push({
      category: "completeness",
      level: "medium",
      title: "Business hours not filled in",
      detail: "Profiles without hours lose prominence in searches with visit intent.",
      action: "Fill in complete business hours, including holidays.",
      reference: "Hours affect 'open now' filter and ranking.",
      penalty: 8,
    });
  }

  if ((client.attributes || 0) < 5) {
    findings.push({
      category: "completeness",
      level: "low",
      title: "Few attributes filled in",
      detail: `Only ${client.attributes || 0} attributes. Goal: 8+. Attributes power search filters.`,
      action: "Fill in all available attributes for the category.",
      reference: "Attributes power search filters and AI summaries.",
      penalty: 5,
    });
  }

  // ═══ Calculate Compliance Score ═══
  const totalPenalty = findings.reduce((sum, f) => sum + f.penalty, 0);
  const complianceScore = Math.max(0, Math.min(100, 100 - totalPenalty));

  const criticalCount = findings.filter(f => f.level === "critical").length;
  const highCount = findings.filter(f => f.level === "high").length;
  const mediumCount = findings.filter(f => f.level === "medium").length;
  const lowCount = findings.filter(f => f.level === "low").length;
  const infoCount = findings.filter(f => f.level === "info").length;

  const status = complianceScore >= 85 ? "healthy" : complianceScore >= 60 ? "warning" : "danger";

  return {
    score: complianceScore,
    status,
    findings,
    counts: { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount, info: infoCount },
    totalFindings: findings.length,
  };
}

// ─── Component ─────────────────────────────────────────────
export default function ComplianceGuard({ client, onNavigate, t }) {
  const [activeSection, setActiveSection] = useState("overview");
  const analysis = useMemo(() => analyzeCompliance(client), [client]);

  const statusConfig = {
    healthy: { color: C.green, label: "Healthy", icon: "✓", desc: "Profile compliant with Google's guidelines." },
    warning: { color: C.yellow, label: "Attention", icon: "!", desc: "Some points need correction to avoid penalties." },
    danger: { color: C.red, label: "Risk", icon: "✕", desc: "Critical violations detected. Risk of suspension." },
  };
  const st = statusConfig[analysis.status];

  const levelConfig = {
    critical: { color: C.red, label: "Critical", icon: "🔴" },
    high: { color: "#ff8c00", label: "High", icon: "🟠" },
    medium: { color: C.yellow, label: "Medium", icon: "🟡" },
    low: { color: C.textMuted, label: "Low", icon: "⚪" },
    info: { color: C.cyan, label: "Info", icon: "ℹ️" },
  };

  const categoryConfig = {
    name: { label: "Business Name", icon: "◈" },
    address: { label: "Address", icon: "◉" },
    categories: { label: "Categories", icon: "◫" },
    reviews: { label: "Reviews", icon: "⭐" },
    services: { label: "Services", icon: "◇" },
    description: { label: "Description", icon: "◎" },
    completeness: { label: "Completeness", icon: "◑" },
  };

  const sections = [
    { id: "overview", label: "Overview", icon: "◎" },
    { id: "findings", label: `Findings (${analysis.totalFindings})`, icon: "!" },
    { id: "rules", label: "Google Rules", icon: "◆" },
  ];

  // Group findings by category
  const byCategory = {};
  analysis.findings.forEach(f => {
    if (!byCategory[f.category]) byCategory[f.category] = [];
    byCategory[f.category].push(f);
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Compliance Guard — {client.name}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Compliance analysis with Google Business Profile guidelines</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onNavigate && onNavigate("compliance")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.orange + "44", background: C.orange + "15", color: C.orange, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>◌ Spam Detector</button>
          <button onClick={() => onNavigate && onNavigate("nap")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.blue + "44", background: C.blue + "15", color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>◍ NAP Suite</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.bgCard, borderRadius: 10, padding: 4, border: "1px solid " + C.border }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={{ flex: 1, padding: "8px 12px", borderRadius: 7, border: "none", background: activeSection === s.id ? st.color + "22" : "transparent", color: activeSection === s.id ? st.color : C.textMuted, fontSize: 12, fontWeight: activeSection === s.id ? 700 : 400, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <span style={{ fontSize: 11 }}>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {activeSection === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
            {/* Score card */}
            <Card style={{ textAlign: "center", border: "1px solid " + st.color + "44" }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Compliance Health Score</div>
              <ScoreCircle score={analysis.score} size={110} />
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "inline-block", background: st.color + "22", color: st.color, borderRadius: 8, padding: "4px 14px", fontSize: 13, fontWeight: 700, border: "1px solid " + st.color + "44" }}>
                  {st.icon} {st.label}
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: C.textMuted }}>{st.desc}</div>
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { l: "Critical", v: analysis.counts.critical, c: analysis.counts.critical > 0 ? C.red : C.green },
                  { l: "High", v: analysis.counts.high, c: analysis.counts.high > 0 ? "#ff8c00" : C.green },
                  { l: "Medium", v: analysis.counts.medium, c: analysis.counts.medium > 0 ? C.yellow : C.green },
                  { l: "Low", v: analysis.counts.low + analysis.counts.info, c: C.textMuted },
                ].map(m => (
                  <div key={m.l} style={{ background: C.bg, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: m.c }}>{m.v}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{m.l}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Category breakdown */}
            <Card>
              <div style={{ fontWeight: 600, marginBottom: 14 }}>Status by Area</div>
              {Object.entries(categoryConfig).map(([cat, cfg]) => {
                const catFindings = byCategory[cat] || [];
                const worst = catFindings.find(f => f.level === "critical") ? "critical"
                  : catFindings.find(f => f.level === "high") ? "high"
                  : catFindings.find(f => f.level === "medium") ? "medium"
                  : catFindings.length > 0 ? "low" : "pass";
                const wColor = worst === "pass" ? C.green : (levelConfig[worst]?.color || C.green);
                const wLabel = worst === "pass" ? "OK" : (levelConfig[worst]?.label || "OK");
                return (
                  <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid " + C.border }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13 }}>{cfg.icon}</span>
                      <span style={{ fontSize: 12, color: C.text }}>{cfg.label}</span>
                      {catFindings.length > 0 && <span style={{ fontSize: 10, color: C.textMuted }}>({catFindings.length})</span>}
                    </div>
                    <Badge label={wLabel} color={wColor} />
                  </div>
                );
              })}
            </Card>
          </div>

          {/* Priority actions */}
          {analysis.findings.filter(f => f.level === "critical" || f.level === "high").length > 0 && (
            <Card style={{ marginBottom: 16, border: "1px solid " + C.red + "33" }}>
              <div style={{ fontWeight: 600, marginBottom: 14, color: C.red }}>⚡ Priority Actions</div>
              {analysis.findings.filter(f => f.level === "critical" || f.level === "high").map((f, i) => (
                <div key={i} style={{ padding: "12px 14px", background: (levelConfig[f.level]?.color || C.red) + "08", border: "1px solid " + (levelConfig[f.level]?.color || C.red) + "22", borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{f.title}</span>
                    <Badge label={levelConfig[f.level]?.label || f.level} color={levelConfig[f.level]?.color || C.red} />
                  </div>
                  <div style={{ fontSize: 12, color: C.textDim, marginBottom: 6 }}>{f.detail}</div>
                  <div style={{ fontSize: 11, color: C.cyan, fontWeight: 600 }}>→ {f.action}</div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      {/* ═══ FINDINGS ═══ */}
      {activeSection === "findings" && (
        <div>
          {analysis.totalFindings === 0 ? (
            <Card>
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.green }}>Profile 100% compliant!</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>No violations detected. Keep monitoring.</div>
              </div>
            </Card>
          ) : (
            Object.entries(byCategory).map(([cat, catFindings]) => (
              <Card key={cat} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 14 }}>{categoryConfig[cat]?.icon || "◎"}</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{categoryConfig[cat]?.label || cat}</span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>— {catFindings.length} finding(s)</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {catFindings.map((f, i) => (
                    <div key={i} style={{ padding: "14px 16px", background: C.bg, borderRadius: 10, border: "1px solid " + (levelConfig[f.level]?.color || C.border) + "33" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11 }}>{levelConfig[f.level]?.icon || "◎"}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{f.title}</span>
                        </div>
                        <Badge label={levelConfig[f.level]?.label || f.level} color={levelConfig[f.level]?.color || C.textMuted} />
                      </div>
                      <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6, marginBottom: 6 }}>{f.detail}</div>
                      <div style={{ fontSize: 11, color: C.cyan, fontWeight: 600, marginBottom: 4 }}>→ {f.action}</div>
                      <div style={{ fontSize: 10, color: C.textMuted, fontStyle: "italic" }}>{f.reference}</div>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ═══ GOOGLE RULES REFERENCE ═══ */}
      {activeSection === "rules" && (
        <div>
          {[
            { title: "Business Name", rules: [
              "Use only the real business name, as it appears on signage, business cards, and legal documents.",
              "DO NOT add: keywords, location, hours, promotions, or any marketing text.",
              "Exception: if the city is part of the registered legal/DBA name.",
            ]},
            { title: "Address", rules: [
              "Must be a physical location where the business operates or serves customers.",
              "PO Boxes, UPS Store, virtual offices, and coworking spaces are NOT allowed.",
              "SABs (Service Area Businesses) must hide the address and define service area.",
            ]},
            { title: "Categories", rules: [
              "Primary category must be the MOST SPECIFIC for the core business.",
              "Secondary categories must represent services actually offered, not aspirational.",
              "Avoid overly generic or irrelevant categories — dilutes relevance.",
            ]},
            { title: "Reviews", rules: [
              "PROHIBITED: buying reviews, offering incentives for reviews, review gating (filtering negatives).",
              "Google uses AI to detect patterns: abnormal velocity, repetitive language, GPS clustering.",
              "Respond to negative reviews professionally within 24h.",
            ]},
            { title: "Description", rules: [
              "Maximum 750 characters. No URLs, phone numbers, or promotions.",
              "Describe the business, services, and differentiators in natural language.",
              "Avoid ALL CAPS, excessive emojis, or keyword stuffing.",
            ]},
            { title: "Photos & Media", rules: [
              "Only REAL photos of the business, team, and work performed.",
              "PROHIBITED: stock photos, images with text/watermarks, screenshots.",
              "Geotagged photos with correct coordinates strengthen the profile.",
            ]},
          ].map((section, i) => (
            <Card key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14, color: C.text }}>{section.title}</div>
              {section.rules.map((rule, j) => (
                <div key={j} style={{ display: "flex", gap: 8, marginBottom: 8, padding: "6px 0" }}>
                  <span style={{ color: rule.startsWith("DO NOT") || rule.startsWith("PROHIBITED") ? C.red : rule.startsWith("Exception") || rule.startsWith("Maximum") ? C.yellow : C.cyan, fontSize: 11, flexShrink: 0 }}>
                    {rule.startsWith("DO NOT") || rule.startsWith("PROHIBITED") ? "✕" : rule.startsWith("Exception") || rule.startsWith("Maximum") ? "!" : "✓"}
                  </span>
                  <span style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>{rule}</span>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Export analysis function for use in scoring/dashboard
export { analyzeCompliance };
