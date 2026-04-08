"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { Card, Badge } from "../shared";
import { callClaude } from "../utils/ai";

// ─── 30-Day Action Plan Based on Rescue Playbook ──────────────
const PLAN_PHASES = [
  {
    phase: 1,
    title: "Diagnosis + Emergency",
    days: "Days 1-3",
    color: "#ff4444",
    actions: [
      { id: "p1_1", text: "Search exact business name on Google (if not showing = suspension)", priority: "critical", impact: "Confirm if profile is active" },
      { id: "p1_2", text: "Check if Google made automatic edits to the profile — revert if incorrect", priority: "critical", impact: "Accepted edits can change category or name" },
      { id: "p1_3", text: "Confirm primary category — restore if it was changed", priority: "critical", impact: "Category is the #1 ranking signal" },
      { id: "p1_4", text: "Remove marketing keywords from business name (if present)", priority: "critical", impact: "Suspension risk from keyword stuffing" },
      { id: "p1_5", text: "Respond to ALL unanswered negative reviews", priority: "high", impact: "Impacts entity_rating_score and conversion" },
      { id: "p1_6", text: "Check NAP: GBP vs Website vs Yelp vs Facebook — note inconsistencies", priority: "high", impact: "Inconsistent NAP weakens the entity" },
    ],
  },
  {
    phase: 2,
    title: "Activity Signals",
    days: "Days 3-7",
    color: "#ff8c00",
    actions: [
      { id: "p2_1", text: "Publish a Google Post with news or an offer", priority: "high", impact: "Activity signal — effect within 24-48h" },
      { id: "p2_2", text: "Add 5-10 new REAL photos (recent work, team, storefront)", priority: "high", impact: "Photos = signal of an active business" },
      { id: "p2_3", text: "Update description with natural keywords from reviews", priority: "medium", impact: "Aligns profile with customer language" },
      { id: "p2_4", text: "Confirm business hours are correct", priority: "medium", impact: "Affects 'open now' filter" },
      { id: "p2_5", text: "Check and fix map pin (exact location)", priority: "medium", impact: "Wrong pin = wrong directions = lost customer" },
      { id: "p2_6", text: "Fill in all available attributes for the category", priority: "low", impact: "Attributes feed filters and AI summaries" },
    ],
  },
  {
    phase: 3,
    title: "Review Counter-Attack",
    days: "Days 7-14",
    color: "#ffaa00",
    actions: [
      { id: "p3_1", text: "Activate review request process: SMS/email after each service", priority: "critical", impact: "Goal: 10-15 reviews in 2 weeks" },
      { id: "p3_2", text: "Prepare simple message: 'Your feedback helps us improve' + direct GBP link", priority: "high", impact: "Direct link makes it easy — higher conversion" },
      { id: "p3_3", text: "Guide customers to mention service + city in review (without scripting)", priority: "medium", impact: "Review with keyword = 5x more NLP value" },
      { id: "p3_4", text: "Timing: request review 1-3 hours after service (fresh experience)", priority: "medium", impact: "Ideal moment of satisfaction" },
      { id: "p3_5", text: "Respond to each new review within 24h (positive and negative)", priority: "high", impact: "Response rate impacts ranking" },
      { id: "p3_6", text: "NEVER offer incentive for reviews (FTC = up to $53K/violation)", priority: "critical", impact: "Mandatory legal compliance" },
    ],
  },
  {
    phase: 4,
    title: "Entity Strengthening",
    days: "Days 7-21",
    color: "#4488ff",
    actions: [
      { id: "p4_1", text: "Check/update Schema.org JSON-LD on website (complete LocalBusiness)", priority: "high", impact: "Schema strengthens citability in AI Overviews" },
      { id: "p4_2", text: "Fix NAP on 4 aggregators: Data Axle, Localeze, Foursquare, Factual", priority: "high", impact: "Propagate to hundreds of directories" },
      { id: "p4_3", text: "Check presence on: Bing Places, Apple Maps, Yelp, Facebook, BBB", priority: "medium", impact: "Diverse citations = strong entity" },
      { id: "p4_4", text: "Consider joining local Chamber of Commerce", priority: "low", impact: "1 link = 10-15 generic directories" },
      { id: "p4_5", text: "Add sameAs to Schema.org (GBP, Facebook, LinkedIn, Yelp)", priority: "medium", impact: "Connects entity signals" },
      { id: "p4_6", text: "Check if website has llms.txt for generative AI visibility", priority: "low", impact: "Future-proofing for GEO" },
    ],
  },
  {
    phase: 5,
    title: "Behavioral Signals",
    days: "Days 14-30",
    color: "#44cc88",
    actions: [
      { id: "p5_1", text: "Maintain frequency of 1-2 Google Posts per week", priority: "high", impact: "Consistency > one-time burst" },
      { id: "p5_2", text: "Upload new photos weekly (signal of active business)", priority: "medium", impact: "Keeps profile freshness" },
      { id: "p5_3", text: "Monitor CTR — if showing but no clicks: improve cover photo and snippet", priority: "medium", impact: "CTR is a behavioral ranking signal" },
      { id: "p5_4", text: "Activate Google ecosystem features: Messages, Booking, Products", priority: "low", impact: "Google favors those who use its ecosystem" },
      { id: "p5_5", text: "Review score weekly — compare with pre-drop baseline", priority: "high", impact: "Measure recovery progress" },
      { id: "p5_6", text: "If no improvement after 30 days: pivot to long-tail + secondary categories", priority: "medium", impact: "Structural Plan B" },
    ],
  },
];

export default function ActionPlan30Days({ client, diagnosis }) {
  const [completed, setCompleted] = useState({});
  const [aiPlan, setAiPlan] = useState(null);
  const [aiPlanLoading, setAiPlanLoading] = useState(false);

  async function generateAIPlan() {
    setAiPlanLoading(true);
    const causeSummary = diagnosis?.slice(0, 2).map(d => `${d.title} (${d.confidence}%)`).join(", ") || "Unknown";
    const prompt = `You are a Local SEO expert creating a personalized 30-day recovery plan.

Profile: "${client.name}" (${client.category || "Service"}, ${client.city || "City"})
Score: ${client.score || 0}/100
Reviews: ${client.reviewsData?.total || 0} total, ${client.reviewsData?.last30days || 0}/month
Diagnosed causes: ${causeSummary}

Create a PERSONALIZED 4-week plan specific to this business type and issue:
**Week 1 — Emergency (Days 1-7):** 3-4 specific actions
**Week 2 — Rebuild (Days 8-14):** 3-4 specific actions
**Week 3 — Strengthen (Days 15-21):** 3-4 specific actions
**Week 4 — Accelerate (Days 22-30):** 3-4 specific actions

Each action should be concrete (not generic) and tailored to a ${client.category || "local service"} business. Include expected impact.`;
    const result = await callClaude(prompt, 600);
    setAiPlan(result);
    setAiPlanLoading(false);
  }

  function toggleAction(id) {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const totalActions = PLAN_PHASES.reduce((sum, p) => sum + p.actions.length, 0);
  const completedCount = Object.values(completed).filter(Boolean).length;
  const progress = Math.round((completedCount / totalActions) * 100);

  const priorityConfig = {
    critical: { color: C.red, label: "Critical" },
    high: { color: "#ff8c00", label: "High" },
    medium: { color: C.yellow, label: "Medium" },
    low: { color: C.textMuted, label: "Low" },
  };

  // Determine primary cause from diagnosis
  const primaryCause = diagnosis?.[0]?.title || "Not diagnosed";

  return (
    <div>
      {/* Progress header */}
      <Card style={{ marginBottom: 16, border: "1px solid " + (progress >= 80 ? C.green : progress >= 40 ? C.yellow : C.blue) + "44" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Action Plan — 30 Days</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Diagnosed cause: <span style={{ color: C.yellow, fontWeight: 600 }}>{primaryCause}</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: progress >= 80 ? C.green : progress >= 40 ? C.yellow : C.blue }}>{progress}%</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>{completedCount}/{totalActions} actions</div>
          </div>
        </div>
        <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: progress + "%", height: "100%", background: progress >= 80 ? C.green : progress >= 40 ? C.yellow : C.blue, transition: "width 0.3s", borderRadius: 3 }} />
        </div>
      </Card>

      {/* 7.12 — AI Personalized Plan */}
      <Card style={{ marginBottom: 16, border: "1px solid " + C.purple + "33" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 600, color: C.purple }}>🤖 AI-Personalized Recovery Plan</div>
          <button onClick={generateAIPlan} disabled={aiPlanLoading}
            style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.purple + "44", background: C.purple + "15", color: C.purple, fontSize: 11, fontWeight: 700, cursor: aiPlanLoading ? "wait" : "pointer", opacity: aiPlanLoading ? 0.6 : 1 }}>
            {aiPlanLoading ? "Generating..." : aiPlan ? "Regenerate" : "Generate Custom Plan"}
          </button>
        </div>
        {!aiPlan && !aiPlanLoading && (
          <div style={{ textAlign: "center", padding: "12px 0", color: C.textMuted, fontSize: 12 }}>
            Generate a plan tailored to {client.name || "this business"}'s specific situation using AI
          </div>
        )}
        {aiPlanLoading && (
          <div style={{ textAlign: "center", padding: "12px 0", color: C.purple, fontSize: 12 }}>⏳ Creating personalized recovery plan...</div>
        )}
        {aiPlan && !aiPlanLoading && (
          <div style={{ background: C.purple + "08", border: "1px solid " + C.purple + "22", borderRadius: 8, padding: "14px 16px", fontSize: 12, color: C.textDim, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {typeof aiPlan === "string" ? aiPlan : aiPlan?.content || aiPlan?.text || ""}
          </div>
        )}
      </Card>

      {/* Standard Timeline */}
      {PLAN_PHASES.map(phase => {
        const phaseCompleted = phase.actions.filter(a => completed[a.id]).length;
        const phaseTotal = phase.actions.length;
        const phaseDone = phaseCompleted === phaseTotal;

        return (
          <div key={phase.phase} style={{ position: "relative", paddingLeft: 24, marginBottom: 20 }}>
            {/* Timeline line */}
            <div style={{ position: "absolute", left: 9, top: 24, bottom: phase.phase < 5 ? -20 : 0, width: 2, background: phaseDone ? C.green + "44" : C.border }} />

            {/* Timeline dot */}
            <div style={{ position: "absolute", left: 2, top: 6, width: 16, height: 16, borderRadius: "50%", background: phaseDone ? C.green : phase.color + "22", border: "2px solid " + (phaseDone ? C.green : phase.color), display: "flex", alignItems: "center", justifyContent: "center" }}>
              {phaseDone && <span style={{ fontSize: 9, color: "#fff", fontWeight: 900 }}>✓</span>}
            </div>

            <Card style={{ marginLeft: 8, border: "1px solid " + (phaseDone ? C.green + "33" : C.border) }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Phase {phase.phase} — {phase.title}</span>
                  <span style={{ fontSize: 11, color: phase.color, marginLeft: 8 }}>{phase.days}</span>
                </div>
                <span style={{ fontSize: 11, color: phaseDone ? C.green : C.textMuted, fontWeight: 600 }}>{phaseCompleted}/{phaseTotal}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {phase.actions.map(action => {
                  const done = completed[action.id];
                  const pc = priorityConfig[action.priority];
                  return (
                    <div key={action.id} onClick={() => toggleAction(action.id)}
                      style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: done ? C.green + "08" : C.bg, border: "1px solid " + (done ? C.green + "22" : C.border), borderRadius: 8, cursor: "pointer", transition: "all 0.15s", opacity: done ? 0.7 : 1 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: "2px solid " + (done ? C.green : pc.color), background: done ? C.green + "22" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: done ? C.green : "transparent", flexShrink: 0, marginTop: 1 }}>
                        {done ? "✓" : ""}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5, textDecoration: done ? "line-through" : "none" }}>{action.text}</div>
                        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{action.impact}</div>
                      </div>
                      <Badge label={pc.label} color={pc.color} />
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
