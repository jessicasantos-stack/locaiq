/**
 * Report Narrative — Translates profile data into business-owner language
 * Focus: profile health, visibility, results — NOT revenue.
 * RULE: Zero jargon. No NAP, GEO, NLP, SERP, CTR, entity_rating_score, navboost.
 */

export function narrateScore(score) {
  if (score >= 85) return "Your Google profile is in excellent shape. You're ahead of most competitors in your area — keep up the momentum.";
  if (score >= 70) return "Your Google profile is solid. You're visible and competitive, but there's still room to grow.";
  if (score >= 50) return "Your Google profile is average. You're showing up sometimes, but competitors with stronger profiles are getting the attention you could be getting.";
  if (score >= 35) return "Your Google profile needs attention. Right now, customers searching for your services are finding your competitors first.";
  return "Your Google profile needs urgent work. You're practically invisible in local search. The good news: a few focused actions can change this fast.";
}

export function narrateScoreDelta(delta) {
  if (delta > 5) return `Your profile improved ${delta} points this month — great progress.`;
  if (delta > 0) return `Your profile went up ${delta} points. Steady improvement.`;
  if (delta === 0) return "Your profile score held steady this month.";
  if (delta > -5) return `Your profile dipped ${Math.abs(delta)} points. Nothing alarming, but let's reverse that.`;
  return `Your profile dropped ${Math.abs(delta)} points. We need to take action to recover.`;
}

export function narratePosition(position, prevPosition) {
  const improved = prevPosition && position !== prevPosition;
  if (position === "Top 3") return `You're showing in the top 3 results on Google Maps.${improved ? " That's an improvement from last month!" : ""} This is where most people click. Protect this position.`;
  if (position === "Top 5") return `You're in the top 5 on Google Maps. Close to the top — a few improvements can push you into the top 3 where most clicks happen.`;
  if (position === "6-10") return "You're showing on Google Maps, but below the fold. Most people never scroll this far. Our goal is to push you higher.";
  return "You're not showing up consistently in Google Maps results. People searching for your services are finding your competitors instead. This is fixable.";
}

export function narrateInteractions(interactions) {
  const { calls, routes, clicks, callsDelta, routesDelta, clicksDelta } = interactions;
  const total = calls + routes + clicks;
  const parts = [`This month, ${total} people interacted with your Google profile.`];
  if (callsDelta > 0) parts.push(`Phone calls are up (+${callsDelta}).`);
  else if (callsDelta < 0) parts.push(`Phone calls are down (${callsDelta}).`);
  if (routesDelta > 0) parts.push(`Direction requests are up (+${routesDelta}).`);
  if (clicksDelta > 0) parts.push(`Website clicks are up (+${clicksDelta}).`);
  return parts.join(" ");
}

export function narrateReviews(reviews) {
  const { total, average, responseRate, last30days, negativeUnanswered } = reviews;
  const parts = [];
  parts.push(`You have ${total} reviews with a ${average}-star average.`);
  if (average >= 4.5) parts.push("That's a strong rating that builds trust.");
  else if (average >= 4.0) parts.push("Good, but a few more 5-star reviews would make a noticeable difference.");
  else parts.push("This rating could be costing you customers. People often skip businesses below 4.5 stars.");

  if (responseRate >= 90) parts.push("You're replying to almost every review — customers love that.");
  else if (responseRate >= 70) parts.push(`You've replied to ${responseRate}% of reviews. Try to reply to every single one.`);
  else parts.push(`Only ${responseRate}% of your reviews have a reply. Every unanswered review is a missed chance to build trust.`);

  if (negativeUnanswered > 0) parts.push(`Urgent: ${negativeUnanswered} negative review(s) without a reply. This is the #1 thing to fix right now.`);
  if (last30days >= 3) parts.push(`${last30days} new reviews this month — good momentum.`);
  else parts.push("You need more reviews coming in each month. Ask every happy customer.");

  return parts.join(" ");
}

export function narratePhotos(photos) {
  const { total, prevTotal } = photos;
  const delta = total - prevTotal;
  if (total >= 20 && delta > 0) return `${total} photos on your profile (+${delta} this month). Great visual presence.`;
  if (total >= 20) return `${total} photos on your profile. Strong visual coverage — keep adding fresh work photos.`;
  if (total >= 10) return `${total} photos. Decent, but profiles with 20+ photos get significantly more attention. Keep adding.`;
  return `Only ${total} photos. This is hurting your visibility. Businesses with more real photos get more clicks and calls.`;
}

export function narrateSection(section) {
  const { name, score } = section;
  const label = name.toLowerCase();
  if (score >= 80) return `Your ${label} is strong. Keep doing what you're doing.`;
  if (score >= 60) return `Your ${label} is decent but could be better. Small improvements here = more visibility.`;
  if (score >= 40) return `Your ${label} needs work. This is holding you back from ranking higher.`;
  return `Your ${label} is a weak spot. Fixing this will have the biggest impact on getting more customers.`;
}

export function narrateWhatWeDid(quickWins) {
  if (!quickWins || quickWins.length === 0) return "Your profile was already in great shape. We focused on maintaining your position and monitoring competitors.";
  const count = quickWins.length;
  return `We identified ${count} action${count > 1 ? "s" : ""} to improve your Google visibility. Here's what needs to happen:`;
}

export function narrateNextMonth(priorities) {
  if (!priorities || priorities.length === 0) return "Keep up the current strategy. Your profile is performing well.";
  return `Next month, we're focusing on ${priorities.length} key area${priorities.length > 1 ? "s" : ""} to keep your profile growing.`;
}

export function narrateMonthSummary(data) {
  const parts = [];
  parts.push(narrateScoreDelta(data.scoreDelta));
  const total = data.interactions.calls + data.interactions.routes + data.interactions.clicks;
  if (total > 0) parts.push(`${total} people interacted with your profile this month.`);
  if (data.reviews.last30days > 0) parts.push(`You got ${data.reviews.last30days} new review${data.reviews.last30days > 1 ? "s" : ""}.`);
  if (data.quickWins.length > 0) parts.push(`We have ${data.quickWins.length} action${data.quickWins.length > 1 ? "s" : ""} to improve next month.`);
  return parts.join(" ");
}

export function narrateGrowthJourney(monthHistory) {
  const first = monthHistory[0];
  const last = monthHistory[monthHistory.length - 1];
  const scoreDelta = last.score - first.score;
  const reviewsDelta = last.reviews - first.reviews;
  const parts = [];
  if (scoreDelta > 0) parts.push(`Your profile score went from ${first.score} to ${last.score} over 6 months — that's ${scoreDelta} points of improvement.`);
  else parts.push(`Your profile score went from ${first.score} to ${last.score} over 6 months.`);
  if (reviewsDelta > 0) parts.push(`You gained ${reviewsDelta} new reviews in this period.`);
  return parts.join(" ");
}
