"use client";
import { useState, useMemo } from "react";
import { C, sc } from "../constants/colors";
import { Card, Badge, ScoreCircle, Rec, Tip } from "../shared";
import { AIAnalysisPanel } from "../ai";
import { useLang } from "../contexts/LangContext";

// ─── NLP helpers ───────────────────────────────────────────
function extractKeywords(text) {
  const stop = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","is","was","were","are","been","be","have","has","had","do","does","did","will","would","shall","should","may","might","must","can","could","i","we","you","he","she","it","they","me","him","her","us","them","my","your","his","its","our","their","this","that","these","those","what","which","who","whom","where","when","how","not","no","so","very","just","also","than","then","now","here","there","all","each","every","both","few","more","most","some","any","other","about","up","out","into","over","after","before","between","under","again","once","as","if","because","until","while","during","through","above","below","too","only","own","same","such","don","didn","doesn","won","wouldn","couldn","haven","hasn","hadn","isn","aren","wasn","weren","ve","re","ll","like","really","got","get","goes","going","went","go","come","came","back","make","made","take","took","know","knew","see","saw","think","thought","look","looked","want","wanted","give","gave","use","used","find","found","tell","told","ask","asked","seem","seemed","let","said","say","much","many","well","even","still","long","great","good","new","first","last","little","right","big","old","high","small","next","early","young","important","always","never","often","sometimes","thing","things","time","times","way","work","been","done","able","need","ll","lot","keep"]);
  return text.toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stop.has(w));
}

function extractPhrases(text) {
  // Extract 2-3 word phrases (bigrams/trigrams) from review text
  const words = text.toLowerCase().replace(/[^a-z\s-]/g, " ").split(/\s+/).filter(w => w.length > 2);
  const phrases = [];
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(words[i] + " " + words[i + 1]);
    if (i < words.length - 2) phrases.push(words[i] + " " + words[i + 1] + " " + words[i + 2]);
  }
  return phrases;
}

function countFrequency(items) {
  const freq = {};
  items.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]);
}

function categorizeSentiment(text) {
  const positive = ["great","excellent","amazing","wonderful","fantastic","outstanding","best","awesome","incredible","perfect","professional","friendly","clean","fast","quick","responsive","helpful","recommend","love","impressed","thorough","knowledgeable","courteous","punctual","reliable","trustworthy","honest","skilled","talented","beautiful","exceptional","superb","pleasant","efficient","careful","attentive","reasonable","affordable","quality","expertise","satisfaction","delighted"];
  const negative = ["bad","terrible","awful","horrible","worst","rude","slow","dirty","expensive","overpriced","unprofessional","late","broken","damaged","wrong","mistake","problem","issue","complaint","disappointed","frustrated","avoid","waste","scam","lied","overcharged","careless","sloppy","incompetent","ignored","unresponsive","delay","poor","mediocre","subpar"];
  const lower = text.toLowerCase();
  const pos = positive.filter(w => lower.includes(w));
  const neg = negative.filter(w => lower.includes(w));
  if (neg.length > pos.length) return "negative";
  if (pos.length > 0) return "positive";
  return "neutral";
}

// ─── Main analysis engine ──────────────────────────────────
function analyzeSemanticGaps(client) {
  const reviews = client.reviewsData?.samples || client.reviews?.samples || [];
  const services = (client.services || []).map(s => s.toLowerCase());
  const categories = [client.category, ...(client.secondaryCategories || [])].map(c => (c || "").toLowerCase());
  const desc = (client.description || "").toLowerCase();
  const allReviewText = reviews.map(r => r.text).join(". ");

  // 1. Extract what customers mention
  const reviewKeywords = extractKeywords(allReviewText);
  const reviewPhrases = extractPhrases(allReviewText);
  const keywordFreq = countFrequency(reviewKeywords);
  const phraseFreq = countFrequency(reviewPhrases).filter(([, count]) => count >= 2);

  // 2. Identify service-related terms from reviews
  const serviceTerms = new Set();
  const serviceRelated = ["install","repair","remodel","replace","build","clean","paint","fix","design","inspect","maintain","restore","remove","upgrade","renovate","plumb","wire","trim","frame","side","roof","floor","tile","cabinet","kitchen","bathroom","deck","fence","window","door","hvac","electrical","dental","teeth","whitening","implant","crown","filling","extraction","orthodont","invisalign","braces","cleaning","checkup","exam","xray","emergency","commercial","residential","landscap","tree","lawn","gutter","drywall","insulation","carpentry","concrete","masonry","waterproof","mold","pest","termite","ac","heating","cooling","furnace","duct","water heater","sewer","drain","pipe","faucet","toilet","sink","shower","tub","basement","attic","garage","patio","porch","siding","stucco","vinyl","hardwood","laminate","carpet","countertop","granite","marble","quartz"];
  reviewKeywords.forEach(w => { if (serviceRelated.some(s => w.includes(s) || s.includes(w))) serviceTerms.add(w); });
  reviewPhrases.forEach(([phrase]) => { if (serviceRelated.some(s => phrase.includes(s))) serviceTerms.add(phrase); });

  // 3. Find gaps — things customers mention that aren't in the profile
  const gaps = [];
  const strengths = [];
  const profileText = (desc + " " + services.join(" ") + " " + categories.join(" ")).toLowerCase();

  // Check top review keywords against profile
  keywordFreq.slice(0, 40).forEach(([word, count]) => {
    if (count < 2) return;
    const isServiceWord = serviceRelated.some(s => word.includes(s) || s.includes(word));
    if (!isServiceWord) return;
    const inProfile = profileText.includes(word);
    if (!inProfile) {
      gaps.push({ term: word, mentions: count, type: "keyword", source: "reviews" });
    } else {
      strengths.push({ term: word, mentions: count, type: "keyword" });
    }
  });

  // Check review phrases against profile
  phraseFreq.slice(0, 20).forEach(([phrase, count]) => {
    const hasService = serviceRelated.some(s => phrase.includes(s));
    if (!hasService) return;
    const inProfile = profileText.includes(phrase);
    if (!inProfile && !gaps.some(g => phrase.includes(g.term))) {
      gaps.push({ term: phrase, mentions: count, type: "phrase", source: "reviews" });
    }
  });

  // 4. Check services list vs what reviews actually confirm
  const confirmedServices = [];
  const unconfirmedServices = [];
  services.forEach(svc => {
    const svcWords = svc.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const mentioned = svcWords.some(w => allReviewText.toLowerCase().includes(w));
    if (mentioned) confirmedServices.push(svc);
    else unconfirmedServices.push(svc);
  });

  // 5. Sentiment per review
  const reviewAnalysis = reviews.map(r => ({
    ...r,
    sentiment: categorizeSentiment(r.text),
    keywords: extractKeywords(r.text).slice(0, 8),
  }));

  // 6. Calculate Semantic Alignment Score
  const totalServiceTerms = new Set([...services.map(s => s.toLowerCase().split(/\s+/)).flat().filter(w => w.length > 3)]);
  const confirmedRatio = totalServiceTerms.size > 0 ? confirmedServices.length / services.length : 0;
  const gapPenalty = Math.min(gaps.length * 5, 30);
  const reviewRichness = Math.min(reviews.length * 8, 25);
  const confirmBonus = Math.round(confirmedRatio * 30);
  const descCoverage = services.filter(s => desc.includes(s.toLowerCase().split(/\s+/)[0])).length;
  const descBonus = Math.min(Math.round((descCoverage / Math.max(services.length, 1)) * 15), 15);

  const score = Math.max(0, Math.min(100, reviewRichness + confirmBonus + descBonus + 15 - gapPenalty));

  // 7. Generate recommendations
  const recommendations = [];
  if (gaps.length > 0) {
    recommendations.push({
      priority: "high",
      action: "add_services",
      title: "Add services mentioned in reviews",
      detail: `Customers mention: ${gaps.slice(0, 5).map(g => `"${g.term}"`).join(", ")}. Add as services in GBP.`,
      impact: "Align profile services with what customers actually search for",
    });
  }
  if (gaps.some(g => !categories.some(c => c.includes(g.term)))) {
    recommendations.push({
      priority: "medium",
      action: "review_categories",
      title: "Review secondary categories",
      detail: "Frequent terms in reviews may indicate categories missing from the profile.",
      impact: "Correct categories improve relevance for specific searches",
    });
  }
  if (unconfirmedServices.length > 2) {
    recommendations.push({
      priority: "medium",
      action: "validate_services",
      title: "Services listed without confirmation in reviews",
      detail: `${unconfirmedServices.length} services in the profile are never mentioned in reviews: ${unconfirmedServices.slice(0, 3).map(s => `"${s}"`).join(", ")}`,
      impact: "Guide customers to mention these services or remove if not offered",
    });
  }
  if (desc.length < 400) {
    recommendations.push({
      priority: "high",
      action: "expand_description",
      title: "Expand description with terms from reviews",
      detail: `Description has only ${desc.length} characters. Use terms customers already use in reviews.`,
      impact: "Rich description aligns the profile with the real language of customers",
    });
  }
  const posReviews = reviewAnalysis.filter(r => r.sentiment === "positive");
  if (posReviews.length > 0) {
    const topPosKeywords = countFrequency(posReviews.flatMap(r => r.keywords)).slice(0, 5);
    if (topPosKeywords.length > 0) {
      recommendations.push({
        priority: "low",
        action: "leverage_strengths",
        title: "Use strengths in description and posts",
        detail: `Customers praise: ${topPosKeywords.map(([w]) => `"${w}"`).join(", ")}. Use these terms in marketing.`,
        impact: "Reinforcing what already works increases conversion",
      });
    }
  }

  return {
    score,
    gaps,
    strengths,
    confirmedServices,
    unconfirmedServices,
    reviewAnalysis,
    keywordFreq: keywordFreq.slice(0, 20),
    phraseFreq: phraseFreq.slice(0, 10),
    recommendations,
    stats: { totalReviews: reviews.length, totalServices: services.length, gapCount: gaps.length, confirmedRatio: Math.round(confirmedRatio * 100) },
  };
}

// ─── Component ─────────────────────────────────────────────
export default function SemanticGapAnalyzer({ client, onNavigate, t }) {
  const [activeSection, setActiveSection] = useState("overview");
  const analysis = useMemo(() => analyzeSemanticGaps(client), [client]);

  const scoreColor = sc(analysis.score);
  const scoreLabel = analysis.score >= 80 ? "Excellent" : analysis.score >= 60 ? "Good" : analysis.score >= 40 ? "Moderate" : "Critical";

  const priorityColor = { high: C.red, medium: C.yellow, low: C.green };
  const priorityLabel = { high: "High", medium: "Medium", low: "Low" };
  const sentimentColor = { positive: C.green, negative: C.red, neutral: C.textMuted };
  const sentimentIcon = { positive: "+", negative: "-", neutral: "~" };

  const sections = [
    { id: "overview", label: "Overview", icon: "◎" },
    { id: "gaps", label: `Gaps (${analysis.gaps.length})`, icon: "!" },
    { id: "confirmed", label: "Confirmed", icon: "✓" },
    { id: "reviews", label: "Reviews NLP", icon: "◆" },
    { id: "actions", label: "Actions", icon: "→" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Semantic Gap Analyzer — {client.name}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>What customers say vs what the profile shows</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onNavigate && onNavigate("semantic")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.purple + "44", background: C.purple + "15", color: C.purple, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>◆ AI Mode</button>
          <button onClick={() => onNavigate && onNavigate("optimize")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.blue + "44", background: C.blue + "15", color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✨ Optimize with AI</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.bgCard, borderRadius: 10, padding: 4, border: "1px solid " + C.border }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={{ flex: 1, padding: "8px 12px", borderRadius: 7, border: "none", background: activeSection === s.id ? C.blue + "22" : "transparent", color: activeSection === s.id ? C.blue : C.textMuted, fontSize: 12, fontWeight: activeSection === s.id ? 700 : 400, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <span style={{ fontSize: 11 }}>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {activeSection === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
            {/* Score card */}
            <Card style={{ textAlign: "center", border: "1px solid " + scoreColor + "44" }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Semantic Alignment Score</div>
              <ScoreCircle score={analysis.score} size={110} />
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "inline-block", background: scoreColor + "22", color: scoreColor, borderRadius: 8, padding: "4px 14px", fontSize: 13, fontWeight: 700, border: "1px solid " + scoreColor + "44" }}>{scoreLabel}</div>
              </div>
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { l: "Gaps", v: analysis.stats.gapCount, c: analysis.stats.gapCount === 0 ? C.green : analysis.stats.gapCount <= 3 ? C.yellow : C.red },
                  { l: "Confirmed", v: analysis.stats.confirmedRatio + "%", c: analysis.stats.confirmedRatio >= 70 ? C.green : analysis.stats.confirmedRatio >= 40 ? C.yellow : C.red },
                  { l: "Reviews", v: analysis.stats.totalReviews, c: analysis.stats.totalReviews >= 10 ? C.green : C.yellow },
                  { l: "Services", v: analysis.stats.totalServices, c: C.cyan },
                ].map(m => (
                  <div key={m.l} style={{ background: C.bg, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: m.c }}>{m.v}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{m.l}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Keywords from reviews */}
            <Card>
              <div style={{ fontWeight: 600, marginBottom: 14 }}>Top Review Keywords</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {analysis.keywordFreq.slice(0, 15).map(([word, count]) => {
                  const inProfile = (client.description || "").toLowerCase().includes(word) || (client.services || []).some(s => s.toLowerCase().includes(word));
                  return (
                    <div key={word} style={{ display: "flex", alignItems: "center", gap: 4, background: inProfile ? C.green + "15" : C.red + "15", border: "1px solid " + (inProfile ? C.green : C.red) + "33", borderRadius: 6, padding: "4px 10px" }}>
                      <span style={{ fontSize: 12, color: inProfile ? C.green : C.red, fontWeight: 600 }}>{word}</span>
                      <span style={{ fontSize: 10, color: C.textMuted }}>x{count}</span>
                    </div>
                  );
                })}
              </div>

              {analysis.phraseFreq.length > 0 && (
                <>
                  <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Recurring Phrases</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {analysis.phraseFreq.slice(0, 6).map(([phrase, count]) => (
                      <div key={phrase} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: C.bg, borderRadius: 6 }}>
                        <span style={{ fontSize: 12, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>"{phrase}"</span>
                        <span style={{ fontSize: 10, color: C.cyan, fontWeight: 700 }}>{count}x</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Quick summary */}
          <Card style={{ marginBottom: 16, border: "1px solid " + C.border }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Quick Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div style={{ background: C.green + "10", border: "1px solid " + C.green + "33", borderRadius: 10, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.green }}>{analysis.confirmedServices.length}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Services confirmed by reviews</div>
              </div>
              <div style={{ background: C.red + "10", border: "1px solid " + C.red + "33", borderRadius: 10, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.red }}>{analysis.gaps.length}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Gaps — mentioned but not in profile</div>
              </div>
              <div style={{ background: C.yellow + "10", border: "1px solid " + C.yellow + "33", borderRadius: 10, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.yellow }}>{analysis.unconfirmedServices.length}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Services without mention in reviews</div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ═══ GAPS ═══ */}
      {activeSection === "gaps" && (
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Semantic Gaps Detected</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Terms customers mention in reviews but are NOT in the GBP profile</div>

          {analysis.gaps.length === 0 ? (
            <div style={{ background: C.green + "10", border: "1px solid " + C.green + "33", borderRadius: 10, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>No gaps detected!</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>The profile is aligned with what customers say.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {analysis.gaps.map((gap, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.red + "08", border: "1px solid " + C.red + "22", borderRadius: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: C.red + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: C.red, fontSize: 14, flexShrink: 0 }}>!</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>"{gap.term}"</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Mentioned {gap.mentions}x in reviews — {gap.type === "phrase" ? "phrase" : "keyword"}</div>
                  </div>
                  <Badge label="Gap" color={C.red} />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ═══ CONFIRMED ═══ */}
      {activeSection === "confirmed" && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Services Confirmed in Reviews</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Profile services that customers actually mention — strong triangulation</div>
            {analysis.confirmedServices.length === 0 ? (
              <div style={{ background: C.red + "10", border: "1px solid " + C.red + "33", borderRadius: 10, padding: 16, textAlign: "center", color: C.red, fontSize: 13 }}>
                No services confirmed in reviews. Guide customers to mention the services performed.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {analysis.confirmedServices.map(svc => (
                  <div key={svc} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: C.green + "12", border: "1px solid " + C.green + "33", borderRadius: 8 }}>
                    <span style={{ color: C.green, fontWeight: 700 }}>✓</span>
                    <span style={{ fontSize: 12, color: C.text }}>{svc}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Services WITHOUT Confirmation</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Listed in profile but never mentioned in reviews — weak triangulation</div>
            {analysis.unconfirmedServices.length === 0 ? (
              <div style={{ background: C.green + "10", border: "1px solid " + C.green + "33", borderRadius: 10, padding: 16, textAlign: "center", color: C.green, fontSize: 13 }}>
                All services are confirmed by reviews!
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {analysis.unconfirmedServices.map(svc => (
                  <div key={svc} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: C.yellow + "12", border: "1px solid " + C.yellow + "33", borderRadius: 8 }}>
                    <span style={{ color: C.yellow, fontWeight: 700 }}>?</span>
                    <span style={{ fontSize: 12, color: C.text }}>{svc}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* ═══ REVIEWS NLP ═══ */}
      {activeSection === "reviews" && (
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Analise NLP das Reviews</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Sentimento e keywords extraidos de cada review</div>

          {analysis.reviewAnalysis.length === 0 ? (
            <div style={{ background: C.yellow + "10", border: "1px solid " + C.yellow + "33", borderRadius: 10, padding: 16, textAlign: "center", color: C.yellow, fontSize: 13 }}>
              Sem reviews disponiveis para analise. Conecte o perfil para importar reviews.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {analysis.reviewAnalysis.map((r, i) => (
                <div key={i} style={{ padding: "14px 16px", background: C.bg, borderRadius: 10, border: "1px solid " + sentimentColor[r.sentiment] + "33" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: sentimentColor[r.sentiment] + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: sentimentColor[r.sentiment] }}>{sentimentIcon[r.sentiment]}</div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.author}</span>
                    </div>
                    <Badge label={r.sentiment === "positive" ? "Positivo" : r.sentiment === "negative" ? "Negativo" : "Neutro"} color={sentimentColor[r.sentiment]} />
                  </div>
                  <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6, marginBottom: 8 }}>"{r.text}"</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {r.keywords.map(kw => (
                      <span key={kw} style={{ fontSize: 10, padding: "2px 8px", background: C.cyan + "15", border: "1px solid " + C.cyan + "22", borderRadius: 4, color: C.cyan }}>{kw}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ═══ ACTIONS ═══ */}
      {activeSection === "actions" && (
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Acoes Recomendadas</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Baseadas nos gaps e padroes detectados nas reviews</div>

          {analysis.recommendations.length === 0 ? (
            <div style={{ background: C.green + "10", border: "1px solid " + C.green + "33", borderRadius: 10, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>Perfil bem alinhado!</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Continue monitorando novas reviews para manter o alinhamento.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {analysis.recommendations.map((rec, i) => (
                <div key={i} style={{ padding: "14px 16px", background: C.bg, borderRadius: 10, border: "1px solid " + priorityColor[rec.priority] + "33" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{rec.title}</span>
                    <Badge label={"Prioridade " + priorityLabel[rec.priority]} color={priorityColor[rec.priority]} />
                  </div>
                  <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6, marginBottom: 6 }}>{rec.detail}</div>
                  <div style={{ fontSize: 11, color: C.cyan, fontWeight: 600 }}>Impacto: {rec.impact}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ═══ AI DEEP ANALYSIS ═══ */}
      {client.scoresData && client.semanticData && (
        <AIAnalysisPanel
          data={{
            ...client,
            businessName: client.businessName || client.name,
            reviews: client.reviewsData || client.reviews || {},
            photos: client.photos || {},
          }}
          scores={client.scoresData}
          semantic={client.semanticData}
          analysisType="semanticgap"
        />
      )}
    </div>
  );
}
