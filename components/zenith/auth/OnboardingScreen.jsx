"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { C, sc, tagColors } from "../constants/colors";
import { T } from "../constants/translations";
import { CLIENTS } from "../constants/clients";
import { NICHE_WEIGHTS, DEFAULT_WEIGHTS } from "../constants/weights";
import { getNav } from "../constants/nav";
import { ANDERSON_MELO_SYSTEM } from "../constants/anderson-melo";
import { Card, SectionTitle, Badge, ProgressBar, StatCard, Btn, TabBar, ScoreCircle, ScoreDonut, MiniBar, Tag, Rec, Tip, ActionBtn, RefreshBtn, LangToggle } from "../shared";
import { calcScores, calcSemantic, daysSince } from "../utils/scoring";
import { callClaude } from "../utils/ai";
import { generatePDFReport } from "../utils/pdf";

export default function OnboardingScreen({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checklist, setChecklist] = useState({
    gbp_claimed: false, nap_consistent: false, description_done: false,
    photos_added: false, categories_set: false, attributes_done: false,
  });

  const toggleCheck = (key) => setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  const checkCount = Object.values(checklist).filter(Boolean).length;

  const STEPS = [
    // Step 0 — Welcome
    {
      title: `Welcome, ${user.name}! 👋`,
      desc: "Zenith is the most advanced Local SEO platform of 2026 — powered by the Google API Leak, Semantic Engineering, and the AI Mode patent US20240289407A1.",
      content: (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { icon: "🔍", title: "Google API Leak", desc: "location_score, navboost, entity_rating_score and 7 real ranking attributes" },
              { icon: "🧬", title: "Semantic Engineering", desc: "4-layer Ontology: Entity → Action → Problem → Scenario" },
              { icon: "🤖", title: "AI Mode Patent", desc: "Intent fan-out, autonomous chunks, Google synthetic queries" },
              { icon: "📍", title: "Local SEO 2026", desc: "GBP = #1 factor (32%), AI Packs appear in 50%+ of searches" },
            ].map(f => (
              <div key={f.title} style={{ padding: 14, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: C.cyan, marginBottom: 3 }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: `${C.blue}10`, border: `1px solid ${C.blue}33`, borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6 }}>
              <strong style={{ color: C.text }}>Why use Zenith?</strong><br />
              Businesses that optimize their GBP with semantic methodology generate <strong style={{ color: C.green }}>3–5× more organic leads</strong> than competitors using traditional SEO alone.
            </div>
          </div>
        </div>
      )
    },
    // Step 1 — Connect Google
    {
      title: "Connect your Google Business Profile",
      desc: "Link the Gmail associated with your GBP to start auditing. In production, this will automatically load your real profiles.",
      content: (
        <div style={{ marginBottom: 24 }}>
          {!connected ? (
            <div style={{ textAlign: "center" }}>
              <button onClick={async () => {
                setConnecting(true);
                await new Promise(r => setTimeout(r, 1400));
                setConnecting(false);
                setConnected(true);
              }} style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 32px", borderRadius: 10, border: "none", background: "#fff", color: "#333", fontWeight: 700, fontSize: 15, cursor: connecting ? "not-allowed" : "pointer", opacity: connecting ? 0.7 : 1, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                {connecting ? "Connecting to Google..." : "Connect with Google Business"}
              </button>
              <div style={{ marginTop: 14, fontSize: 12, color: C.textMuted }}>
                The app will request read-only permission for your GBP profiles.
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 24, background: `${C.green}12`, borderRadius: 12, border: `1px solid ${C.green}33`, marginBottom: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div style={{ color: C.green, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Google connected successfully!</div>
              <div style={{ color: C.textDim, fontSize: 13 }}>{user.email}</div>
            </div>
          )}
        </div>
      )
    },
    // Step 2 — Setup checklist
    {
      title: "Initial Setup Checklist",
      desc: "Before auditing, confirm the basic status of your GBP profile. This helps calibrate the recommendations.",
      content: (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: C.textMuted }}>Progress</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: checkCount === 6 ? C.green : C.yellow }}>{checkCount}/6 items</span>
          </div>
          <ProgressBar value={(checkCount / 6) * 100} color={checkCount === 6 ? C.green : C.blue} />
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { key: "gbp_claimed", label: "GBP profile claimed and verified", desc: "You have owner access to the profile", icon: "✔" },
              { key: "nap_consistent", label: "NAP consistent (name, address, phone)", desc: "Same format across all directories", icon: "📍" },
              { key: "description_done", label: "Description filled (150+ characters)", desc: "Goal: 700 chars with 4 ontology layers", icon: "📝" },
              { key: "photos_added", label: "At least 5 photos added", desc: "Goal: 20+ with cover, team, and work", icon: "📸" },
              { key: "categories_set", label: "Primary category + 1 secondary defined", desc: "Primary category should be the most specific", icon: "🏷️" },
              { key: "attributes_done", label: "Special attributes filled (5+)", desc: "E.g.: Licensed, Insured, Free Estimates, etc.", icon: "⚡" },
            ].map(item => (
              <div key={item.key} onClick={() => toggleCheck(item.key)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: checklist[item.key] ? `${C.green}10` : C.bg, border: `1px solid ${checklist[item.key] ? C.green + "44" : C.border}`, borderRadius: 10, cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checklist[item.key] ? C.green : C.border}`, background: checklist[item.key] ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                  {checklist[item.key] && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: checklist[item.key] ? C.text : C.textDim }}>{item.icon} {item.label}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          {checkCount < 3 && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: `${C.yellow}10`, borderRadius: 8, border: `1px solid ${C.yellow}33`, fontSize: 12, color: C.textDim }}>
              💡 Don't worry if you haven't completed everything yet — Zenith will identify exactly what's missing and how to fix it.
            </div>
          )}
        </div>
      )
    },
    // Step 3 — Tour rápido
    {
      title: "Quick Tour — What you'll find",
      desc: "The dashboard is organized into 4 areas. Here's what each one does:",
      content: (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "OVERVIEW", color: C.blue, icon: "📊", items: ["Weekly Digest — weekly summary with priorities", "Overview — score, API Leak attrs, recommendations", "⚠ Attention Required — critical items across all profiles", "Impact Simulator — simulate the impact of each action"] },
              { label: "ANALYSIS", color: C.cyan, icon: "🔬", items: ["AI Mode — readiness for Google AI Overviews", "NAP Check — consistency across 12 platforms", "Triangulation — semantic alignment across channels", "Competitors — gap analysis vs competitors"] },
              { label: "PROFILE", color: C.green, icon: "📋", items: ["Description — 4-layer analysis + before/after", "Photos — breakdown by type + recommendations", "Posts — semantic analysis of each post", "Reviews — triangulation + AI-powered Review Responder"] },
              { label: "TOOLS", color: C.purple, icon: "🛠️", items: ["Optimize — generate description and posts with Claude AI", "Citation Tracker — 20 directories per niche", "Review Responder — AI responses + templates", "Presentation — 4 slides for client meeting"] },
            ].map(section => (
              <div key={section.label} style={{ border: `1px solid ${section.color}33`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: `${section.color}15`, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 16 }}>{section.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: section.color }}>{section.label}</span>
                </div>
                <div style={{ padding: "8px 14px 12px" }}>
                  {section.items.map((item, i) => (
                    <div key={i} style={{ fontSize: 12, color: C.textDim, padding: "4px 0", borderBottom: i < section.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      → {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    // Step 4 — Ready
    {
      title: "All set! 🚀",
      desc: "You're configured to audit, optimize, and scale GBP profiles with the Anderson Melo methodology + Google API Leak.",
      content: (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label: "22 Tabs", desc: "Complete analysis and optimization", color: C.blue },
              { label: "10 Profiles", desc: "Pre-loaded USA clients", color: C.cyan },
              { label: "Claude AI", desc: "AI-powered content generation", color: C.purple },
            ].map(f => (
              <div key={f.label} style={{ textAlign: "center", padding: 16, background: C.bg, borderRadius: 10, border: `1px solid ${f.color}33` }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: f.color, marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>{f.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: `${C.green}10`, border: `1px solid ${C.green}33`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, color: C.green, marginBottom: 8, fontSize: 13 }}>💡 Recommended first step</div>
            <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.7 }}>
              Open the <strong style={{ color: C.text }}>Weekly Digest</strong> to see the current score and the top 3 priorities for the week. Then go to <strong style={{ color: C.text }}>⚠ Attention Required</strong> to see the most critical items across all profiles.
            </div>
          </div>
        </div>
      )
    },
  ];

  const cur = STEPS[step];
  const canNext = step !== 1 || connected;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 620 }}>
        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 36 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 32 : 8, height: 8, borderRadius: 4, background: i === step ? C.blue : i < step ? C.cyan : C.border, transition: "all 0.3s", cursor: i < step ? "pointer" : "default" }} onClick={() => i < step && setStep(i)} />
          ))}
          <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 8 }}>{step + 1}/{STEPS.length}</span>
        </div>

        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, padding: "36px 40px" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8 }}>{cur.title}</div>
          <div style={{ color: C.textDim, fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>{cur.desc}</div>
          {cur.content}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {step > 0
              ? <Btn variant="ghost" onClick={() => setStep(step - 1)}>← Back</Btn>
              : <div />}
            <Btn onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : onComplete()} disabled={!canNext}>
              {step === STEPS.length - 1 ? "Enter Dashboard →" : "Continue →"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
