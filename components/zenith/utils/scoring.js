import { NICHE_WEIGHTS, DEFAULT_WEIGHTS } from "../constants/weights";

export function daysSince(d) { return Math.floor((new Date() - new Date(d)) / 86400000); }

export function calcScores(d) {
  const w = NICHE_WEIGHTS[d.category] || DEFAULT_WEIGHTS;

  const desc = d.descriptionLength >= 700 ? 100 : d.descriptionLength >= 400 ? 65 : d.descriptionLength >= 150 ? 40 : 15;
  const photoQty = d.photos.total >= 20 ? 100 : d.photos.total >= 10 ? 70 : d.photos.total >= 5 ? 45 : 20;
  const _photoAgeDays = d.photos?.lastUpload ? daysSince(d.photos.lastUpload) : 999;
  const photoAge = _photoAgeDays < 30 ? 100 : _photoAgeDays < 90 ? 65 : 35;
  const photo = Math.round((photoQty + photoAge) / 2);
  const lp = d.posts?.[0]?.date ? daysSince(d.posts[0].date) : 999;
  const post = lp <= 7 ? 100 : lp <= 14 ? 80 : lp <= 30 ? 55 : lp <= 60 ? 25 : 5;
  const review = Math.min(Math.round((d.reviews.average / 5) * 35 + (Math.min(d.reviews.total, 100) / 100) * 30 + (d.reviews.total > 0 ? (d.reviews.withResponse / d.reviews.total) * 20 : 0) + (d.reviews.last30days >= 3 ? 15 : d.reviews.last30days >= 1 ? 7 : 0)), 100);
  const basic = Math.round((d.hours.filled ? 22 : 0) + (d.phone ? 22 : 0) + (d.website ? 22 : 0) + (d.secondaryCategories.length > 0 ? 17 : 0) + (d.attributes >= 8 ? 17 : d.attributes >= 5 ? 10 : 5));

  const overall = Math.round(desc * w.desc + photo * w.photo + post * w.post + review * w.review + basic * w.basic);

  return { desc, photo, post, review, basic, overall, weights: w };
}

// Simulate scores with overrides — used by ImpactSimulator
export function calcScoresSim(d, overrides = {}) {
  const merged = {
    ...d,
    descriptionLength: overrides.descriptionLength ?? d.descriptionLength,
    photos: { ...d.photos, total: overrides.photosTotal ?? d.photos?.total, lastUpload: overrides.photosLastUpload ?? d.photos?.lastUpload },
    posts: overrides.posts ?? d.posts,
    reviews: { ...d.reviews, total: overrides.reviewsTotal ?? d.reviews?.total, withResponse: overrides.reviewsWithResponse ?? d.reviews?.withResponse, last30days: overrides.reviewsLast30 ?? d.reviews?.last30days },
    attributes: overrides.attributes ?? d.attributes,
    secondaryCategories: overrides.secondaryCategories ?? d.secondaryCategories,
  };
  return calcScores(merged);
}

export function calcSemantic(d) {
  const desc = (d.description || "").toLowerCase();
  let score = 0; const findings = [];
  const eP = ["licensed","contractor","builder","company","specialist","certified"].some(t => desc.includes(t));
  const aP = ["specialize","install","build","remodel","repair","renovate","replace","restore","design"].some(t => desc.includes(t));
  const pP = ["damage","outdated","leak","worn","storm","old","broken","need","upgrade","aging","cramped"].some(t => desc.includes(t));
  const sP = ["residential","homeowner","home","commercial","property","emergency","family"].some(t => desc.includes(t));
  let layers = [eP, aP, pP, sP].filter(Boolean).length;
  if (layers === 4) { score += 25; findings.push({ t: "pass", m: `4/4 ontology layers present — ready for AI Mode!` }); }
  else { score += layers * 5; findings.push({ t: layers >= 2 ? "warn" : "critical", m: `${layers}/4 layers. Missing: ${!eP ? "Entity, " : ""}${!aP ? "Action, " : ""}${!pP ? "Problem, " : ""}${!sP ? "Scenario" : ""}` }); }
  const gT = ["connecticut","ct","danbury","westchester","ny","nashua","nh","boston","ma","orlando","fl","county"];
  const gF = gT.filter(t => desc.includes(t));
  if (gF.length >= 2) { score += 20; findings.push({ t: "pass", m: `${gF.length} geographic signals — territorial presence` }); }
  else if (gF.length >= 1) { score += 10; findings.push({ t: "warn", m: "Add more location terms" }); }
  else { findings.push({ t: "critical", m: "ZERO geographic terms — critical for location_score" }); }
  const cT = ["insured","licensed","guaranteed","warranty","bonded","certified","workers comp","liability"];
  const cF = cT.filter(t => desc.includes(t));
  if (cF.length >= 2) { score += 15; findings.push({ t: "pass", m: `${cF.length} credibility signals` }); }
  else { score += cF.length * 5; findings.push({ t: cF.length > 0 ? "warn" : "critical", m: "Add: licensed, insured, bonded, warranty, Google Guaranteed" }); }
  const sents = (d.description || "").split(/[.!?]+/).filter(s => s.trim().length > 25);
  const actT = ["specialize","install","build","remodel","repair","renovate","help","optimize","provide"];
  const chunks = sents.filter(s => { const l = s.toLowerCase(); return gT.some(g => l.includes(g)) && actT.some(a => l.includes(a)); });
  if (chunks.length >= 2) { score += 20; findings.push({ t: "pass", m: `${chunks.length} standalone chunks for AI Mode` }); }
  else { score += chunks.length * 8; findings.push({ t: chunks.length > 0 ? "warn" : "critical", m: "Create standalone sentences with service + location" }); }
  const allReviews = (d.reviews.samples || []).map(r => r.text.toLowerCase()).join(" ");
  const svcTerms = (d.services || []).map(s => s.toLowerCase().split(/\s+/)).flat();
  const triMatch = svcTerms.filter(t => t.length > 3 && allReviews.includes(t));
  const triUnique = [...new Set(triMatch)];
  if (triUnique.length >= 4) { score += 20; findings.push({ t: "pass", m: `Strong triangulation: ${triUnique.length} service terms confirmed in reviews` }); }
  else if (triUnique.length >= 2) { score += 10; findings.push({ t: "warn", m: `Moderate triangulation: ${triUnique.length} terms. Encourage customers to mention services` }); }
  else { score += 3; findings.push({ t: "critical", m: "Weak triangulation: reviews do not confirm the services in the description" }); }
  return { score: Math.min(score, 100), findings, layers, chunks: chunks.length, geoTerms: gF.length, triTerms: triUnique.length };
}

// ─── Semantic Alignment Score (Fase 1 — NLP Gap Analysis) ──────
// Compares what customers say in reviews vs what's in the GBP profile
export function calcSemanticAlignment(d) {
  const reviews = d.reviews?.samples || [];
  const services = (d.services || []).map(s => s.toLowerCase());
  const categories = [d.category, ...(d.secondaryCategories || [])].map(c => (c || "").toLowerCase());
  const desc = (d.description || "").toLowerCase();
  const allReviewText = reviews.map(r => r.text || "").join(". ");

  if (reviews.length === 0) return { score: 0, gaps: 0, confirmed: 0, confirmedRatio: 0, unconfirmed: 0 };

  // Stop words for keyword extraction
  const stop = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","is","was","were","are","been","be","have","has","had","do","does","did","will","would","shall","should","may","might","must","can","could","i","we","you","he","she","it","they","me","him","her","us","them","my","your","his","its","our","their","this","that","these","those","what","which","who","whom","where","when","how","not","no","so","very","just","also","than","then","now","here","there","all","each","every","both","few","more","most","some","any","other","about","up","out","into","over","after","before","between","under","again","once","as","if","because","until","while","during","through","above","below","too","only","own","same","such","like","really","got","get","goes","going","went","go","come","came","back","make","made","take","took","know","knew","see","saw","think","thought","look","looked","want","wanted","give","gave","use","used","find","found","tell","told","ask","asked","seem","seemed","let","said","say","much","many","well","even","still","long","great","good","new","first","last","little","right","big","old","high","small","next","early","young","important","always","never","often","sometimes","thing","things","time","times","way","work","been","done","able","need","lot","keep"]);

  const serviceRelated = ["install","repair","remodel","replace","build","clean","paint","fix","design","inspect","maintain","restore","remove","upgrade","renovate","plumb","wire","trim","frame","side","roof","floor","tile","cabinet","kitchen","bathroom","deck","fence","window","door","hvac","electrical","dental","teeth","whitening","implant","crown","filling","extraction","orthodont","invisalign","braces","cleaning","checkup","exam","xray","emergency","commercial","residential","landscap","tree","lawn","gutter","drywall","insulation","carpentry","concrete","masonry","waterproof","mold","pest","termite","ac","heating","cooling","furnace","duct","water heater","sewer","drain","pipe","faucet","toilet","sink","shower","tub","basement","attic","garage","patio","porch","siding","stucco","vinyl","hardwood","laminate","carpet","countertop","granite","marble","quartz"];

  // Extract keywords
  const words = allReviewText.toLowerCase().replace(/[^a-z\s-]/g, " ").split(/\s+/).filter(w => w.length > 2 && !stop.has(w));
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const keywordFreq = Object.entries(freq).sort((a, b) => b[1] - a[1]);

  // Find gaps
  const profileText = (desc + " " + services.join(" ") + " " + categories.join(" ")).toLowerCase();
  let gapCount = 0;
  keywordFreq.slice(0, 40).forEach(([word, count]) => {
    if (count < 2) return;
    if (!serviceRelated.some(s => word.includes(s) || s.includes(word))) return;
    if (!profileText.includes(word)) gapCount++;
  });

  // Confirmed services (allow short terms like "AC", "IT" if they're standalone service words)
  const confirmed = services.filter(svc => {
    const svcWords = svc.toLowerCase().split(/\s+/).filter(w => w.length > 2 || ["ac","it"].includes(w.toLowerCase()));
    return svcWords.some(w => {
      const re = new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
      return re.test(allReviewText);
    });
  });
  const confirmedRatio = services.length > 0 ? confirmed.length / services.length : 0;

  // Score calculation (mirrors SemanticGapAnalyzer)
  const gapPenalty = Math.min(gapCount * 5, 30);
  const reviewRichness = Math.min(reviews.length * 8, 25);
  const confirmBonus = Math.round(confirmedRatio * 30);
  const descCoverage = services.filter(s => desc.includes(s.toLowerCase().split(/\s+/)[0])).length;
  const descBonus = Math.min(Math.round((descCoverage / Math.max(services.length, 1)) * 15), 15);
  const score = Math.max(0, Math.min(100, reviewRichness + confirmBonus + descBonus + 15 - gapPenalty));

  return { score, gaps: gapCount, confirmed: confirmed.length, confirmedRatio: Math.round(confirmedRatio * 100), unconfirmed: services.length - confirmed.length };
}
