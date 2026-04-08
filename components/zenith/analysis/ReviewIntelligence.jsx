"use client";
import { useState, useMemo } from "react";
import { C, sc } from "../constants/colors";
import { Card, Badge, ScoreCircle, Rec } from "../shared";
import { callClaude } from "../utils/ai";

// ─── NLP Engine for Review Intelligence ──────────────────────
const STOP_WORDS = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","is","was","were","are","been","be","have","has","had","do","does","did","will","would","shall","should","may","might","must","can","could","i","we","you","he","she","it","they","me","him","her","us","them","my","your","his","its","our","their","this","that","these","those","what","which","who","whom","where","when","how","not","no","so","very","just","also","than","then","now","here","there","all","each","every","both","few","more","most","some","any","other","about","up","out","into","over","after","before","between","under","again","once","as","if","because","until","while","during","through","above","below","too","only","own","same","such","like","really","got","get","goes","going","went","go","come","came","back","make","made","take","took","know","knew","see","saw","think","thought","look","looked","want","wanted","give","gave","use","used","find","found","tell","told","ask","asked","seem","seemed","let","said","say","much","many","well","even","still","long","great","good","new","first","last","little","right","big","old","high","small","next","early","young","important","always","never","often","sometimes","thing","things","time","times","way","work","been","done","able","need","lot","keep","would","could","should"]);

const POSITIVE_WORDS = ["great","excellent","amazing","wonderful","fantastic","outstanding","best","awesome","incredible","perfect","professional","friendly","clean","fast","quick","responsive","helpful","recommend","love","impressed","thorough","knowledgeable","courteous","punctual","reliable","trustworthy","honest","skilled","talented","beautiful","exceptional","superb","pleasant","efficient","careful","attentive","reasonable","affordable","quality","expertise","satisfaction","delighted","gentle","supportive"];
const NEGATIVE_WORDS = ["bad","terrible","awful","horrible","worst","rude","slow","dirty","expensive","overpriced","unprofessional","late","broken","damaged","wrong","mistake","problem","issue","complaint","disappointed","frustrated","avoid","waste","scam","lied","overcharged","careless","sloppy","incompetent","ignored","unresponsive","delay","poor","mediocre","subpar","mess"];

function extractKeywords(text) {
  return text.toLowerCase().replace(/[^a-z\s-]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function getSentiment(text) {
  const lower = text.toLowerCase();
  const pos = POSITIVE_WORDS.filter(w => lower.includes(w));
  const neg = NEGATIVE_WORDS.filter(w => lower.includes(w));
  const score = pos.length - neg.length * 1.5; // negatives weigh more
  return {
    label: score > 0.5 ? "positive" : score < -0.5 ? "negative" : "neutral",
    positive: pos,
    negative: neg,
    score: Math.max(-1, Math.min(1, score / Math.max(pos.length + neg.length, 1))),
  };
}

function analyzeReviewIntelligence(client) {
  const reviews = client.reviewsData?.samples || client.reviews?.samples || [];
  const services = (client.services || []).map(s => s.toLowerCase());

  if (reviews.length === 0) {
    return { hasData: false, reviews: [], serviceScores: [], keywords: [], strengths: [], problems: [], trend: "neutral", overallSentiment: 0 };
  }

  // Analyze each review
  const analyzed = reviews.map(r => {
    const sentiment = getSentiment(r.text || "");
    const keywords = extractKeywords(r.text || "");

    // Match review to services
    const matchedServices = services.filter(svc => {
      const svcWords = svc.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      return svcWords.some(w => (r.text || "").toLowerCase().includes(w));
    });

    return { ...r, sentiment, keywords, matchedServices };
  });

  // Sentiment per service
  const serviceMap = {};
  services.forEach(svc => { serviceMap[svc] = { positive: 0, negative: 0, neutral: 0, total: 0, mentions: 0 }; });
  analyzed.forEach(r => {
    r.matchedServices.forEach(svc => {
      if (serviceMap[svc]) {
        serviceMap[svc][r.sentiment.label]++;
        serviceMap[svc].total++;
        serviceMap[svc].mentions++;
      }
    });
  });
  const serviceScores = Object.entries(serviceMap)
    .filter(([, data]) => data.total > 0)
    .map(([name, data]) => ({
      name,
      score: data.total > 0 ? Math.round(((data.positive * 5 + data.neutral * 3 + data.negative * 1) / data.total / 5) * 100) / 100 : 0,
      rating: data.total > 0 ? Math.round(((data.positive * 5 + data.neutral * 3 + data.negative * 1) / data.total) * 10) / 10 : 0,
      ...data,
    }))
    .sort((a, b) => b.rating - a.rating);

  // Keyword cloud
  const allKeywords = analyzed.flatMap(r => r.keywords);
  const freq = {};
  allKeywords.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word, count]) => {
      const inPositive = analyzed.filter(r => r.sentiment.label === "positive" && r.keywords.includes(word)).length;
      const inNegative = analyzed.filter(r => r.sentiment.label === "negative" && r.keywords.includes(word)).length;
      return { word, count, sentiment: inPositive > inNegative ? "positive" : inNegative > inPositive ? "negative" : "neutral" };
    });

  // Strengths (recurring positive themes)
  const strengths = [];
  const positiveReviews = analyzed.filter(r => r.sentiment.label === "positive");
  const posKeywords = {};
  positiveReviews.forEach(r => r.sentiment.positive.forEach(w => { posKeywords[w] = (posKeywords[w] || 0) + 1; }));
  Object.entries(posKeywords).sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([word, count]) => {
    strengths.push({ theme: word, count, reviews: positiveReviews.filter(r => r.sentiment.positive.includes(word)).map(r => r.author) });
  });

  // Problems (recurring negative themes)
  const problems = [];
  const negativeReviews = analyzed.filter(r => r.sentiment.label === "negative");
  const negKeywords = {};
  negativeReviews.forEach(r => r.sentiment.negative.forEach(w => { negKeywords[w] = (negKeywords[w] || 0) + 1; }));
  Object.entries(negKeywords).sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([word, count]) => {
    problems.push({ theme: word, count, reviews: negativeReviews.filter(r => r.sentiment.negative.includes(word)).map(r => r.author) });
  });

  // Overall sentiment
  const posCount = analyzed.filter(r => r.sentiment.label === "positive").length;
  const negCount = analyzed.filter(r => r.sentiment.label === "negative").length;
  const overallSentiment = reviews.length > 0 ? Math.round((posCount / reviews.length) * 100) : 0;

  // Trend (simple — compare first half vs second half if enough reviews)
  let trend = "neutral";
  if (analyzed.length >= 4) {
    const mid = Math.floor(analyzed.length / 2);
    const firstHalf = analyzed.slice(0, mid);
    const secondHalf = analyzed.slice(mid);
    const firstPos = firstHalf.filter(r => r.sentiment.label === "positive").length / firstHalf.length;
    const secondPos = secondHalf.filter(r => r.sentiment.label === "positive").length / secondHalf.length;
    if (secondPos > firstPos + 0.15) trend = "improving";
    else if (secondPos < firstPos - 0.15) trend = "declining";
  }

  return {
    hasData: true,
    reviews: analyzed,
    serviceScores,
    keywords,
    strengths,
    problems,
    trend,
    overallSentiment,
    stats: { total: reviews.length, positive: posCount, negative: negCount, neutral: reviews.length - posCount - negCount },
  };
}

// ─── Component ─────────────────────────────────────────────
export default function ReviewIntelligence({ client, onNavigate, t }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const analysis = useMemo(() => analyzeReviewIntelligence(client), [client]);

  const sentimentColor = { positive: C.green, negative: C.red, neutral: C.textMuted };
  const trendConfig = { improving: { color: C.green, icon: "↗", label: "Improving" }, declining: { color: C.red, icon: "↘", label: "Declining" }, neutral: { color: C.textMuted, icon: "→", label: "Stable" } };
  const tr = trendConfig[analysis.trend];

  const [responseIdx, setResponseIdx] = useState(null);
  const [responseResult, setResponseResult] = useState({});
  const [responseLoading, setResponseLoading] = useState({});

  const sections = [
    { id: "overview", label: "Overview", icon: "◎" },
    { id: "services", label: "By Service", icon: "◇" },
    { id: "keywords", label: "Keywords", icon: "◆" },
    { id: "strengths", label: "Strengths", icon: "+" },
    { id: "problems", label: "Problems", icon: "!" },
    { id: "responses", label: "Response Gen", icon: "💬" },
    { id: "voicereport", label: "Voice of Customer", icon: "◈" },
  ];

  async function generateVoiceReport() {
    setAiLoading(true);
    const reviewTexts = (client.reviewsData?.samples || []).map(r => `${r.author}: "${r.text}"`).join("\n");
    const prompt = `You are a Local SEO consultant. Analyze the reviews below for "${client.name}" (${client.category}, ${client.city}).

Reviews:
${reviewTexts}

Generate a "Voice of the Customer" report with these sections:
1. **Executive Summary** (2-3 sentences on overall sentiment)
2. **What customers love** (3-5 most mentioned strengths)
3. **What needs improvement** (2-3 weaknesses or opportunities)
4. **Recommendations for the agency** (3 concrete actions based on reviews)
5. **Key phrases for marketing** (3-5 real customer quotes that can be used in posts/description)

Be direct, no fluff. Focus on actionable insights.`;

    const result = await callClaude(prompt, 800);
    setAiReport(result);
    setAiLoading(false);
  }

  if (!analysis.hasData) {
    return (
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>Review Intelligence — {client.name}</div>
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.yellow }}>No reviews available</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>Connect the GBP profile to import reviews and generate intelligence.</div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Review Intelligence — {client.name}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Turning reviews into actionable intelligence</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setActiveSection("responses")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.purple + "44", background: C.purple + "15", color: C.purple, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>💬 Response Gen</button>
          <button onClick={() => onNavigate && onNavigate("semantic")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.blue + "44", background: C.blue + "15", color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>◐ Semantic Gap</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.bgCard, borderRadius: 10, padding: 4, border: "1px solid " + C.border }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={{ flex: 1, padding: "8px 8px", borderRadius: 7, border: "none", background: activeSection === s.id ? C.blue + "22" : "transparent", color: activeSection === s.id ? C.blue : C.textMuted, fontSize: 11, fontWeight: activeSection === s.id ? 700 : 400, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <span style={{ fontSize: 10 }}>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {activeSection === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { l: "Reviews Analyzed", v: analysis.stats.total, c: C.cyan },
              { l: "Positive", v: analysis.stats.positive, c: C.green },
              { l: "Negative", v: analysis.stats.negative, c: C.red },
              { l: "Overall Sentiment", v: analysis.overallSentiment + "%", c: analysis.overallSentiment >= 70 ? C.green : analysis.overallSentiment >= 40 ? C.yellow : C.red },
            ].map(m => (
              <Card key={m.l} style={{ textAlign: "center", padding: "16px 10px" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: m.c }}>{m.v}</div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{m.l}</div>
              </Card>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Trend */}
            <Card>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Sentiment Trend</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: tr.color + "10", border: "1px solid " + tr.color + "33", borderRadius: 10 }}>
                <div style={{ fontSize: 32, color: tr.color }}>{tr.icon}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: tr.color }}>{tr.label}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                    {analysis.trend === "improving" ? "Recent reviews are more positive than older ones" :
                     analysis.trend === "declining" ? "Sentiment is worsening in recent reviews" :
                     "Consistent sentiment over time"}
                  </div>
                </div>
              </div>
            </Card>

            {/* Sentiment breakdown */}
            <Card>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Sentiment Distribution</div>
              <div style={{ display: "flex", gap: 4, height: 24, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
                {analysis.stats.positive > 0 && <div style={{ flex: analysis.stats.positive, background: C.green, transition: "flex 0.3s" }} />}
                {analysis.stats.neutral > 0 && <div style={{ flex: analysis.stats.neutral, background: C.textMuted, transition: "flex 0.3s" }} />}
                {analysis.stats.negative > 0 && <div style={{ flex: analysis.stats.negative, background: C.red, transition: "flex 0.3s" }} />}
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { l: "Positive", v: analysis.stats.positive, c: C.green },
                  { l: "Neutral", v: analysis.stats.neutral, c: C.textMuted },
                  { l: "Negative", v: analysis.stats.negative, c: C.red },
                ].map(m => (
                  <div key={m.l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.c }} />
                    <span style={{ fontSize: 11, color: C.textDim }}>{m.l}: <strong style={{ color: m.c }}>{m.v}</strong></span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Top strengths & problems quick view */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card style={{ border: "1px solid " + C.green + "33" }}>
              <div style={{ fontWeight: 600, marginBottom: 10, color: C.green }}>+ Strengths</div>
              {analysis.strengths.length === 0 ? (
                <div style={{ fontSize: 12, color: C.textMuted }}>Not enough data to identify strengths.</div>
              ) : (
                analysis.strengths.slice(0, 5).map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < 4 ? "1px solid " + C.border : "none" }}>
                    <span style={{ fontSize: 12, color: C.text, textTransform: "capitalize" }}>{s.theme}</span>
                    <Badge label={s.count + "x"} color={C.green} />
                  </div>
                ))
              )}
            </Card>

            <Card style={{ border: "1px solid " + C.red + "33" }}>
              <div style={{ fontWeight: 600, marginBottom: 10, color: C.red }}>! Recurring Problems</div>
              {analysis.problems.length === 0 ? (
                <div style={{ fontSize: 12, color: C.textMuted, padding: "12px 0" }}>
                  <span style={{ color: C.green }}>✓</span> No recurring problems detected in reviews.
                </div>
              ) : (
                analysis.problems.slice(0, 5).map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < 4 ? "1px solid " + C.border : "none" }}>
                    <span style={{ fontSize: 12, color: C.text, textTransform: "capitalize" }}>{p.theme}</span>
                    <Badge label={p.count + "x"} color={C.red} />
                  </div>
                ))
              )}
            </Card>
          </div>
        </>
      )}

      {/* ═══ PER SERVICE ═══ */}
      {activeSection === "services" && (
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Sentiment by Service</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Rating calculated from reviews that mention each service</div>

          {analysis.serviceScores.length === 0 ? (
            <div style={{ background: C.yellow + "10", border: "1px solid " + C.yellow + "33", borderRadius: 10, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: C.yellow }}>No service mentioned in the available reviews.</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Guide customers to mention the service performed in the review.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {analysis.serviceScores.map((svc, i) => {
                const barColor = svc.rating >= 4 ? C.green : svc.rating >= 3 ? C.yellow : C.red;
                return (
                  <div key={i} style={{ padding: "12px 16px", background: C.bg, borderRadius: 10, border: "1px solid " + C.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textTransform: "capitalize" }}>{svc.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: barColor }}>{svc.rating.toFixed(1)}</span>
                        <span style={{ fontSize: 10, color: C.textMuted }}>({svc.total} reviews)</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, height: 6, borderRadius: 3, overflow: "hidden" }}>
                      {svc.positive > 0 && <div style={{ flex: svc.positive, background: C.green }} />}
                      {svc.neutral > 0 && <div style={{ flex: svc.neutral, background: C.textMuted }} />}
                      {svc.negative > 0 && <div style={{ flex: svc.negative, background: C.red }} />}
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                      <span style={{ fontSize: 10, color: C.green }}>{svc.positive} pos</span>
                      <span style={{ fontSize: 10, color: C.textMuted }}>{svc.neutral} neutral</span>
                      <span style={{ fontSize: 10, color: C.red }}>{svc.negative} neg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ═══ KEYWORDS ═══ */}
      {activeSection === "keywords" && (
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Review Keyword Cloud</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Most mentioned words by customers, colored by sentiment</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", padding: "20px 0" }}>
            {analysis.keywords.map((kw, i) => {
              const size = Math.max(11, Math.min(22, 10 + kw.count * 3));
              const color = sentimentColor[kw.sentiment];
              return (
                <span key={i} style={{
                  fontSize: size,
                  fontWeight: kw.count >= 3 ? 700 : 400,
                  color: color,
                  padding: "4px 10px",
                  background: color + "10",
                  border: "1px solid " + color + "22",
                  borderRadius: 6,
                  cursor: "default",
                  transition: "all 0.15s",
                }}>
                  {kw.word} <sup style={{ fontSize: 9, color: C.textMuted }}>{kw.count}</sup>
                </span>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16, paddingTop: 12, borderTop: "1px solid " + C.border }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
              <span style={{ fontSize: 11, color: C.textMuted }}>Positive</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.textMuted }} />
              <span style={{ fontSize: 11, color: C.textMuted }}>Neutral</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red }} />
              <span style={{ fontSize: 11, color: C.textMuted }}>Negative</span>
            </div>
          </div>
        </Card>
      )}

      {/* ═══ STRENGTHS ═══ */}
      {activeSection === "strengths" && (
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 4, color: C.green }}>+ Strengths Detected</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Recurring praises that should be used in marketing and the GBP description</div>

          {analysis.strengths.length === 0 ? (
            <div style={{ background: C.yellow + "10", border: "1px solid " + C.yellow + "33", borderRadius: 10, padding: 20, textAlign: "center", color: C.yellow, fontSize: 13 }}>
              Insufficient data. More reviews needed to detect strength patterns.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {analysis.strengths.map((s, i) => (
                <div key={i} style={{ padding: "14px 16px", background: C.green + "08", border: "1px solid " + C.green + "22", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.green, textTransform: "capitalize" }}>{s.theme}</span>
                    <Badge label={s.count + " mentions"} color={C.green} />
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>
                    Mentioned by: {s.reviews.join(", ")}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: C.cyan, fontWeight: 600 }}>
                    → Use "{s.theme}" in the GBP description, posts, and review responses
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ═══ PROBLEMS ═══ */}
      {activeSection === "problems" && (
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 4, color: C.red }}>! Recurring Problems</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Repeated complaints indicate operational action priority</div>

          {analysis.problems.length === 0 ? (
            <div style={{ background: C.green + "10", border: "1px solid " + C.green + "33", borderRadius: 10, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>No recurring problems!</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Reviews are predominantly positive. Keep monitoring.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {analysis.problems.map((p, i) => (
                <div key={i} style={{ padding: "14px 16px", background: C.red + "08", border: "1px solid " + C.red + "22", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.red, textTransform: "capitalize" }}>{p.theme}</span>
                    <Badge label={p.count + " mentions"} color={C.red} />
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>
                    Mentioned by: {p.reviews.join(", ")}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: C.yellow, fontWeight: 600 }}>
                    → Action: resolving this issue may eliminate future negative reviews
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ═══ RESPONSE GENERATOR (8.7) ═══ */}
      {activeSection === "responses" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>💬 AI Response Generator</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Generate professional, SEO-optimized responses using review sentiment, mentioned services, and business strengths</div>

            {analysis.reviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: C.textMuted }}>No reviews to respond to.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {analysis.reviews.map((rev, idx) => {
                  const sc2 = sentimentColor[rev.sentiment.label];
                  const isLoading = responseLoading[idx];
                  const result = responseResult[idx];

                  const generateResponse = async () => {
                    setResponseLoading(prev => ({ ...prev, [idx]: true }));
                    const strengthsList = analysis.strengths.slice(0, 3).map(s => s.theme).join(", ");
                    const servicesList = rev.matchedServices.length > 0 ? rev.matchedServices.join(", ") : client.services?.slice(0, 3).join(", ") || client.category;
                    const prompt = `You are responding to a Google review for "${client.name}" (${client.category}, ${client.city}).

Review by ${rev.author}: "${rev.text}"
Sentiment: ${rev.sentiment.label}
Services mentioned: ${servicesList}
Business strengths from other reviews: ${strengthsList || "quality, professionalism"}

Write a professional response (3-5 sentences) that:
1. Thanks the reviewer by name
2. ${rev.sentiment.label === "negative" ? "Acknowledges the issue with empathy, offers to resolve offline" : "Reinforces the positive experience they mentioned"}
3. Naturally includes 1-2 service keywords for SEO (e.g., "${servicesList}")
4. ${rev.sentiment.label === "negative" ? "Provides a contact method for resolution" : "Ends with a forward-looking statement"}

Tone: professional, warm, NOT robotic. Do NOT copy-paste templates. Each response must feel unique.`;
                    const resp = await callClaude(prompt, 300);
                    setResponseResult(prev => ({ ...prev, [idx]: resp }));
                    setResponseLoading(prev => ({ ...prev, [idx]: false }));
                  };

                  return (
                    <div key={idx} style={{ background: C.bg, border: "1px solid " + sc2 + "22", borderRadius: 10, overflow: "hidden" }}>
                      {/* Review header */}
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid " + C.border + "44" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{rev.author}</span>
                            <Badge label={rev.sentiment.label} color={sc2} />
                            {rev.matchedServices.length > 0 && (
                              <span style={{ fontSize: 10, color: C.cyan }}>→ {rev.matchedServices.join(", ")}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: C.textDim, fontStyle: "italic", lineHeight: 1.5 }}>"{rev.text}"</div>
                      </div>

                      {/* Response area */}
                      <div style={{ padding: "10px 16px" }}>
                        {!result && !isLoading && (
                          <button onClick={generateResponse} style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid " + C.purple + "44", background: C.purple + "12", color: C.purple, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            🤖 Generate Response
                          </button>
                        )}
                        {isLoading && (
                          <div style={{ fontSize: 12, color: C.purple, padding: "8px 0" }}>⏳ Generating semantic response...</div>
                        )}
                        {result && !isLoading && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, marginBottom: 6, letterSpacing: 0.5 }}>SUGGESTED RESPONSE</div>
                            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7, padding: "10px 14px", background: C.purple + "08", border: "1px solid " + C.purple + "22", borderRadius: 8, whiteSpace: "pre-wrap" }}>
                              {typeof result === "string" ? result : result?.content || result?.text || ""}
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                              <button onClick={() => { navigator.clipboard.writeText(typeof result === "string" ? result : result?.content || result?.text || ""); }} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: C.cyan, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📋 Copy</button>
                              <button onClick={generateResponse} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: C.textMuted, fontSize: 11, cursor: "pointer" }}>↻ Regenerate</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Context info */}
          <Card style={{ border: "1px solid " + C.blue + "22" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, marginBottom: 8 }}>SEMANTIC CONTEXT USED</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 12 }}>
              <div>
                <div style={{ color: C.textMuted, marginBottom: 4 }}>Strengths detected</div>
                {analysis.strengths.slice(0, 4).map((s, i) => (
                  <div key={i} style={{ color: C.green, fontSize: 11 }}>+ {s.theme} ({s.count}x)</div>
                ))}
                {analysis.strengths.length === 0 && <div style={{ color: C.textMuted, fontSize: 11 }}>—</div>}
              </div>
              <div>
                <div style={{ color: C.textMuted, marginBottom: 4 }}>Problems detected</div>
                {analysis.problems.slice(0, 4).map((p, i) => (
                  <div key={i} style={{ color: C.red, fontSize: 11 }}>! {p.theme} ({p.count}x)</div>
                ))}
                {analysis.problems.length === 0 && <div style={{ color: C.green, fontSize: 11 }}>✓ None</div>}
              </div>
              <div>
                <div style={{ color: C.textMuted, marginBottom: 4 }}>Services for SEO</div>
                {(client.services || []).slice(0, 4).map((s, i) => (
                  <div key={i} style={{ color: C.cyan, fontSize: 11 }}>◇ {s}</div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ═══ VOICE OF CUSTOMER REPORT ═══ */}
      {activeSection === "voicereport" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 600 }}>Voice of Customer Report</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>AI-generated executive summary to present to the business owner</div>
            </div>
            <button onClick={generateVoiceReport} disabled={aiLoading}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid " + C.purple + "44", background: C.purple + "15", color: C.purple, fontSize: 12, fontWeight: 700, cursor: aiLoading ? "wait" : "pointer", opacity: aiLoading ? 0.6 : 1 }}>
              {aiLoading ? "Generating..." : aiReport ? "Regenerate" : "◆ Generate with AI"}
            </button>
          </div>

          {!aiReport && !aiLoading && (
            <div style={{ background: C.bg, borderRadius: 10, padding: 30, textAlign: "center", border: "1px dashed " + C.border }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>◆</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>Click "Generate with AI" to create a complete report</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Uses Claude API to analyze all reviews and generate actionable insights</div>
            </div>
          )}

          {aiLoading && (
            <div style={{ background: C.bg, borderRadius: 10, padding: 30, textAlign: "center", border: "1px solid " + C.purple + "33" }}>
              <div style={{ fontSize: 14, color: C.purple, fontWeight: 600 }}>Analyzing reviews with AI...</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>Extracting insights, strengths, problems, and recommendations</div>
            </div>
          )}

          {aiReport && !aiLoading && (
            <div style={{ background: C.bg, borderRadius: 10, padding: "20px 24px", border: "1px solid " + C.purple + "33", fontSize: 13, color: C.textDim, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {typeof aiReport === "string" ? aiReport : aiReport?.content || aiReport?.text || JSON.stringify(aiReport)}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export { analyzeReviewIntelligence };
