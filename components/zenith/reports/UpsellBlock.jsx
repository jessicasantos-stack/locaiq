"use client";
import { C } from "../constants/colors";

const DEFAULT_PLANS = [
  { name: "Essential", price: "$497/mo", features: ["Google profile optimization", "Monthly report", "Review monitoring", "Basic posting (2x/month)"], highlighted: false },
  { name: "Growth", price: "$997/mo", features: ["Everything in Essential", "Weekly posting (2x/week)", "Review response strategy", "Competitor monitoring", "Quarterly growth report", "Landing pages (2 cities)"], highlighted: true },
  { name: "Domination", price: "$1,997/mo", features: ["Everything in Growth", "Daily posting", "10-city territory expansion", "Content generation (AI)", "Priority support", "Monthly strategy call"], highlighted: false },
];

function narrateUpgradeResults(data) {
  const score = data.overall;
  if (score >= 80) return "Your profile is already strong. With a Growth plan, we can expand your territory to more cities and dominate your market.";
  if (score >= 60) return "You're competitive, but leaving results on the table. A dedicated strategy can push you into the top 3 and significantly increase your calls and visibility.";
  return "There's a huge opportunity to grow. Businesses like yours that invest in a structured plan typically see their profile score double and their calls increase dramatically within 90 days.";
}

export default function UpsellBlock({ data, agencyConfig }) {
  const plans = agencyConfig?.plans || DEFAULT_PLANS;
  const agencyName = agencyConfig?.agencyName || "";
  const ctaText = agencyConfig?.ctaText || "Ready to grow? Let's talk about what's possible.";

  // Project profile improvements instead of revenue
  const projectedScore3m = Math.min(100, data.overall + 15);
  const projectedScore6m = Math.min(100, data.overall + 25);
  const projectedReviews3m = data.reviews.total + 12;
  const projectedReviews6m = data.reviews.total + 30;

  return (
    <div style={{ borderRadius: 14, overflow: "hidden" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Where We Can Take Your Business</div>
      <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.7, marginBottom: 20 }}>
        {narrateUpgradeResults(data)}
      </div>

      {/* Projected profile improvements */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Score Now", value: data.overall, unit: "/100", color: data.overall >= 70 ? C.yellow : C.red },
          { label: "Score in 3 Mo", value: projectedScore3m, unit: "/100", color: C.green },
          { label: "Reviews Now", value: data.reviews.total, unit: "", color: C.blue },
          { label: "Reviews in 6 Mo", value: projectedReviews6m, unit: "+", color: C.green },
        ].map(p => (
          <div key={p.label} style={{ background: C.bg, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{p.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: p.color }}>{p.value}{p.unit === "+" ? "+" : ""}</div>
            {p.unit === "/100" && <div style={{ fontSize: 9, color: C.textMuted }}>{p.unit}</div>}
          </div>
        ))}
      </div>

      {/* Plans */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${plans.length},1fr)`, gap: 10, marginBottom: 20 }}>
        {plans.map(plan => (
          <div key={plan.name} style={{
            background: plan.highlighted ? `${C.green}10` : C.bgCard,
            border: `1px solid ${plan.highlighted ? C.green + "55" : C.border}`,
            borderRadius: 12, padding: "18px 16px",
            position: "relative", overflow: "hidden",
          }}>
            {plan.highlighted && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${C.green},${C.cyan})` }} />}
            <div style={{ fontSize: 10, color: plan.highlighted ? C.green : C.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
              {plan.highlighted ? "Recommended" : plan.name}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 4 }}>{plan.name}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: plan.highlighted ? C.green : C.cyan, marginBottom: 12 }}>{plan.price}</div>
            {plan.features.map((f, i) => (
              <div key={i} style={{ fontSize: 11, color: C.textDim, padding: "3px 0", display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ color: plan.highlighted ? C.green : C.cyan, flexShrink: 0 }}>+</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ background: `linear-gradient(135deg,${C.blue}18,${C.cyan}0d)`, border: `1px solid ${C.blue}33`, borderRadius: 12, padding: "20px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{ctaText}</div>
        {agencyName && <div style={{ fontSize: 12, color: C.textMuted }}>— {agencyName}</div>}
      </div>
    </div>
  );
}
