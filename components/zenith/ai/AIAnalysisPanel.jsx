"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { callClaude } from "../utils/ai";

export default function AIAnalysisPanel({ data, scores, semantic, analysisType }) {
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const prompts = {
    overview: `Provide a comprehensive GBP audit summary for:\nBusiness: ${data.businessName} (${data.category}) in ${data.address}\nScores: Description ${scores.desc}, Photos ${scores.photo}, Posts ${scores.post}, Reviews ${scores.review}, Info ${scores.basic}, Semantic ${semantic.score}\nOverall: ${scores.overall}/100\nReviews: ${data.reviews.total} (${data.reviews.average}★), ${data.reviews.withResponse} responded\nPhotos: ${data.photos.total}, last upload ${data.photos.lastUpload}\nProvide: 1. Executive summary (2-3 sentences) 2. Biggest strength 3. Biggest weakness 4. Top 5 priority actions ranked by impact 5. Estimated time to reach 80+ score. Under 350 words.`,
    aimode: `Analyze this GBP for AI Mode readiness:\nBusiness: ${data.businessName} (${data.category}) in ${data.address}\nDescription: ${data.description}\nServices: ${(data.services||[]).join(", ")}\nReviews: ${(data.reviews?.samples||[]).map(r=>r.text).join(" | ")}\nSemantic scores: ${semantic.layers}/4 layers, ${semantic.chunks} chunks, ${semantic.geoTerms} geo terms, ${semantic.triTerms} triangulation\nProvide: 1. AI Mode readiness assessment 2. Top 3 critical fixes 3. Specific chunks to add 4. How to leverage reviews 5. Entity strength assessment. Under 400 words.`,
    reviews: `Analyze the review profile:\nBusiness: ${data.businessName} (${data.category}) in ${data.address}\nTotal: ${data.reviews.total}, Average: ${data.reviews.average}★, Responded: ${data.reviews.withResponse}/${data.reviews.total}, Last 30 days: ${data.reviews.last30days}, Negative unanswered: ${data.reviews.negativeUnanswered}\nSample reviews: ${(data.reviews?.samples||[]).map(r=>r.author+": "+r.text).join(" | ")}\nProvide: 1. Review velocity assessment 2. Sentiment analysis 3. Service keywords in reviews 4. Response strategy 5. Review request template. Under 350 words.`,
    photos: `Analyze photo strategy:\nBusiness: ${data.businessName} (${data.category})\nTotal: ${data.photos.total}, Team: ${data.photos.hasTeam}, Cover: ${data.photos.hasCoverPhoto}, Last upload: ${data.photos.lastUpload}\nWork: ${data.photos.work||0}, Interior: ${data.photos.interior||0}, Exterior: ${data.photos.exterior||0}, Team: ${data.photos.team||0}\nProvide: 1. Quantity assessment 2. Mix analysis 3. Specific photos to add 4. Geo-tagging recommendations 5. Video strategy. Under 300 words.`,
    semanticgap: `Perform a Semantic Gap Analysis for this GBP profile:\nBusiness: ${data.businessName} (${data.category}) in ${data.address}\nDescription: ${data.description}\nServices listed: ${(data.services||[]).join(", ")}\nCategories: ${data.category}, ${(data.secondaryCategories||[]).join(", ")}\nReviews: ${(data.reviews?.samples||[]).map(r=>r.author+": "+r.text).join(" | ")}\nSemantic Alignment Score: ${semantic.score}/100\n\nAnalyze the GAP between what customers say in reviews vs what the profile shows. Provide:\n1. TOP GAPS: Services/qualities customers praise in reviews that are NOT listed in the profile (services, categories, or description). Be specific — quote the review text.\n2. HIDDEN STRENGTHS: What customers consistently praise that should be highlighted more prominently.\n3. TRIANGULATION: Which listed services are confirmed by reviews (strong signal) and which have zero mention (weak signal).\n4. ACTIONABLE FIXES: Specific changes to make — new services to add, categories to consider, description phrases to include. Prioritize by impact.\n5. REVIEW COACHING: Suggest what to ask future customers to mention in reviews to strengthen weak service signals.\nBe direct, specific, and actionable. No fluff. Under 500 words.`,
  };
  const runAnalysis = async () => {
    setLoading(true);
    const result = await callClaude(prompts[analysisType] || prompts.overview, 600);
    setAiResult(result);
    setLoading(false);
    setHasRun(true);
  };
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.cyan}22`, borderRadius: 12, padding: 20, marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.cyan }}>AI Deep Analysis</div>
            <div style={{ fontSize: 10, color: C.muted }}>Claude · Anderson Melo Framework</div>
          </div>
        </div>
        <button onClick={runAnalysis} disabled={loading} style={{ background: loading ? C.muted : `linear-gradient(135deg, ${C.blue}, ${C.cyan})`, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "⏳ Analyzing..." : hasRun ? "🔄 Re-analyze" : "🤖 Run AI Analysis"}
        </button>
      </div>
      {loading && <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: C.cyan }}>Analyzing with semantic framework...</div>}
      {aiResult && !loading && (
        <div>
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, maxHeight: 350, overflowY: "auto" }}>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiResult}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => navigator.clipboard?.writeText(aiResult)} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 11, color: C.muted, cursor: "pointer" }}>📋 Copy</button>
          </div>
        </div>
      )}
      {!aiResult && !loading && <div style={{ padding: 16, textAlign: "center", color: C.muted, fontSize: 12 }}>Click "Run AI Analysis" for personalized insights powered by Claude AI.</div>}
    </div>
  );
}
