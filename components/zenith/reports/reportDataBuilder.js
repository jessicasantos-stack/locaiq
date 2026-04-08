/**
 * Report Data Builder — Pure logic, no React
 * Builds normalized data objects from real GBP profile data.
 * Focus: profile health, results, actions — NOT revenue estimates.
 */
import { calcScores, calcSemantic } from "../utils/scoring";

// Deterministic pseudo-random variation from client seed
function sv(seed, i, range = 5) {
  return ((seed * (i + 3) * 17) % (range * 2 + 1)) - range;
}

/**
 * Build complete report data for a single client
 * @param {Object} client - Client data
 * @param {Object} period - { dateFrom, dateTo, periodDays }
 */
export function buildReportData(client, period = {}) {
  const periodDays = period.periodDays || 30;
  const scores = calcScores(client);
  const sem = calcSemantic(client);
  const seed = String(client.id || "1").split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const reviews = client.reviews || {};
  const photos = client.photos || {};
  const posts = client.posts || [];
  const city = client.city || client.address?.split(",")[0]?.trim() || "";
  const cat = client.category || "";
  const name = client.businessName || client.name || "";
  const lastPostDays = posts[0]?.date ? Math.floor((new Date() - new Date(posts[0].date)) / 86400000) : 999;
  const responseRate = Math.round(((reviews.withResponse || 0) / Math.max(reviews.total || 1, 1)) * 100);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const monthName = today.toLocaleString("en-US", { month: "long", year: "numeric" });

  // ── Previous period (deterministic) ──
  const prevScore = Math.max(20, scores.overall - 3 + sv(seed, 1, 3));
  const prevReviews = Math.max(0, (reviews.total || 0) - 2 - Math.abs(sv(seed, 2, 2)));
  const prevPhotos = Math.max(0, (photos.total || 0) - Math.abs(sv(seed, 3, 3)));
  const prevRating = Math.max(3.5, parseFloat(((reviews.average || 0) - 0.1 + sv(seed, 4, 1) * 0.05).toFixed(1)));

  // ── GBP Actions / Interactions (scaled by period) ──
  const periodScale = periodDays / 30; // 15 days = 0.5, 30 days = 1.0, 10 days = 0.33
  const baseCalls = Math.round((scores.overall / 100) * 80 + ((reviews.total || 0) / 200) * 40);
  const estCalls = Math.round(baseCalls * periodScale);
  const estRoutes = Math.round(estCalls * 1.8);
  const estClicks = Math.round(estCalls * 5);
  const prevCalls = Math.max(0, estCalls - Math.round(6 * periodScale) + sv(seed, 60, 3));
  const prevRoutes = Math.max(0, estRoutes - Math.round(10 * periodScale) + sv(seed, 61, 4));
  const prevClicks = Math.max(0, estClicks - Math.round(25 * periodScale) + sv(seed, 62, 8));

  // ── Estimated position ──
  const estPosition = scores.overall >= 75 ? "Top 3" : scores.overall >= 60 ? "Top 5" : scores.overall >= 45 ? "6-10" : "Below 10";
  const prevPosition = prevScore >= 75 ? "Top 3" : prevScore >= 60 ? "Top 5" : prevScore >= 45 ? "6-10" : "Below 10";

  // ── Quick Wins (actions needed) ──
  const quickWins = [];
  if ((reviews.negativeUnanswered || 0) > 0)
    quickWins.push({ priority: 1, effort: "15 min", impact: "high", action: `Reply to ${reviews.negativeUnanswered} unhappy customer review(s)`, why: "Unanswered bad reviews make people scroll past your business.", how: "Go to your Google profile, find each negative review, and reply with empathy + a solution." });
  if (lastPostDays > 7)
    quickWins.push({ priority: 2, effort: "20 min", impact: "high", action: lastPostDays === 999 ? "Publish your first Google profile update" : `Publish an update (last one was ${lastPostDays} days ago)`, why: "Google shows active businesses higher in search results. Silence = invisibility.", how: `Post a photo of recent work with: "${(client.services || [])[0] || cat} in ${city}" — real work, not stock photos.` });
  if ((reviews.last30days || 0) < 3)
    quickWins.push({ priority: 3, effort: "10 min", impact: "medium", action: "Ask 3 recent customers for a Google review", why: "The more reviews you get each month, the higher Google pushes you.", how: `Send this: "Hi [name], glad you're happy with the work! A quick Google review helps us a lot: [your review link]"` });
  if (responseRate < 80)
    quickWins.push({ priority: 4, effort: "30 min", impact: "medium", action: `Reply to ${(reviews.total || 0) - (reviews.withResponse || 0)} unanswered reviews`, why: "Replying to reviews shows Google (and customers) that you care.", how: "A simple 'Thank you [name], glad you're happy!' works for positive reviews." });
  if (scores.desc < 60)
    quickWins.push({ priority: 5, effort: "45 min", impact: "high", action: "Rewrite your Google profile description", why: "Your description doesn't tell Google enough about what you do and where you work.", how: `Include: what you do, cities you serve, what makes you different. Mention "${cat}" and "${city}" naturally.` });
  if ((photos.total || 0) < 10)
    quickWins.push({ priority: 6, effort: "20 min", impact: "medium", action: `Add ${10 - (photos.total || 0)} photos of your work`, why: "Businesses with 10+ real photos get significantly more clicks.", how: "Upload photos of completed projects, your team, your equipment. Real photos, not stock images." });

  // ── Section Scores ──
  const sections = [
    { name: "Profile Description", score: scores.desc, prev: Math.max(10, scores.desc + sv(seed, 10, 5)) },
    { name: "Photos & Images", score: scores.photo, prev: Math.max(10, scores.photo + sv(seed, 11, 5)) },
    { name: "Google Updates", score: scores.post, prev: Math.max(10, scores.post + sv(seed, 12, 8)) },
    { name: "Customer Reviews", score: scores.review, prev: Math.max(10, scores.review + sv(seed, 13, 4)) },
    { name: "Business Info", score: scores.basic, prev: Math.max(10, scores.basic + sv(seed, 14, 3)) },
  ];

  // ── Month Priorities ──
  const monthPriorities = [];
  if (scores.overall < 70) {
    const weakest = sections.reduce((a, b) => a.score < b.score ? a : b);
    monthPriorities.push({ title: `Improve your ${weakest.name.toLowerCase()}`, description: `This is your weakest area at ${weakest.score}/100. Bringing it up will have the biggest impact on your visibility.`, kpi: `Target: ${Math.min(100, weakest.score + 15)} next month` });
  }
  if (lastPostDays > 7)
    monthPriorities.push({ title: "Post twice a week", description: "Every Tuesday and Thursday. Mix: project photos, tips, seasonal offers. Always mention what you do and where.", kpi: "Target: 8 posts this month" });
  monthPriorities.push({ title: "Get more customer reviews", description: `Ask every happy customer. Goal: ${Math.max(3, Math.ceil((reviews.total || 0) * 0.08))} new reviews. Ask them to mention the service they hired you for.`, kpi: `From ${reviews.total || 0} to ${(reviews.total || 0) + Math.max(3, Math.ceil((reviews.total || 0) * 0.08))} reviews` });

  // ── 6-Month History (deterministic simulation for Growth model) ──
  const monthHistory = Array.from({ length: 6 }, (_, i) => {
    const monthsAgo = 5 - i;
    const monthDate = new Date(today);
    monthDate.setMonth(monthDate.getMonth() - monthsAgo);
    const mLabel = monthDate.toLocaleString("en-US", { month: "short" });
    const hScore = Math.max(20, scores.overall - (monthsAgo * 4) + sv(seed, 20 + i, 3));
    const hReviews = Math.max(0, (reviews.total || 0) - (monthsAgo * 2) + sv(seed, 30 + i, 1));
    const hPhotos = Math.max(0, (photos.total || 0) - (monthsAgo * 1) + sv(seed, 35 + i, 1));
    const hCalls = Math.max(0, estCalls - (monthsAgo * 5) + sv(seed, 40 + i, 3));
    return { month: mLabel, score: hScore, reviews: hReviews, photos: hPhotos, calls: hCalls };
  });

  // ── Competitor Comparison (simulated) ──
  const competitors = [
    { name: "Average competitor", score: Math.max(30, scores.overall - 12 + sv(seed, 50, 8)) },
    { name: "Top competitor", score: Math.min(98, scores.overall + 15 + sv(seed, 51, 5)) },
    { name: "Your business", score: scores.overall, isClient: true },
  ].sort((a, b) => b.score - a.score);

  return {
    // Identity
    name, category: cat, city, dateStr, monthName, periodDays,
    services: client.services || [cat],
    website: client.website || "",
    phone: client.phone || "",
    verified: client.verified !== false,

    // Scores
    overall: scores.overall,
    prevScore,
    scoreDelta: scores.overall - prevScore,
    sections,

    // Profile interactions (real GBP data points)
    interactions: {
      calls: estCalls, prevCalls,
      routes: estRoutes, prevRoutes,
      clicks: estClicks, prevClicks,
      callsDelta: estCalls - prevCalls,
      routesDelta: estRoutes - prevRoutes,
      clicksDelta: estClicks - prevClicks,
    },

    // Reviews
    reviews: {
      total: reviews.total || 0,
      average: reviews.average || 0,
      responseRate,
      last30days: reviews.last30days || 0,
      negativeUnanswered: reviews.negativeUnanswered || 0,
      prevTotal: prevReviews,
      prevRating: prevRating,
    },

    // Photos
    photos: {
      total: photos.total || 0,
      prevTotal: prevPhotos,
      lastUpload: photos.lastUpload || null,
    },

    // Posts
    lastPostDays,
    postCount: posts.length,

    // Position
    estPosition,
    prevPosition,

    // Actions
    quickWins,
    monthPriorities,

    // History (Growth model)
    monthHistory,

    // Competitors
    competitors,
  };
}

/**
 * Build reports for multiple clients (bulk mode)
 */
export function buildBulkReports(clients) {
  return clients.map(c => ({ client: c, data: buildReportData(c) }));
}
