import { supabase } from "./supabase";
import type { Client, ScoreSnapshot } from "./supabase";

// ── Agency ────────────────────────────────────────────────────
export async function getOrCreateAgency(userId: string, name: string) {
  // Try to get existing
  const { data: existing } = await supabase
    .from("agencies")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existing) return existing;

  // Create new
  const { data, error } = await supabase
    .from("agencies")
    .insert({ user_id: userId, name, plan: "free" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Clients ───────────────────────────────────────────────────
export async function getClients(agencyId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("agency_id", agencyId)
    .order("business_name");

  if (error) throw error;
  return data || [];
}

export async function upsertClient(agencyId: string, client: Partial<Client>) {
  const { data, error } = await supabase
    .from("clients")
    .upsert(
      { ...client, agency_id: agencyId, updated_at: new Date().toISOString() },
      { onConflict: "gbp_place_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Score History ─────────────────────────────────────────────
export async function saveScoreSnapshot(
  clientId: string,
  scores: {
    overall: number; desc: number; review: number;
    photo: number; post: number; basic: number; aiMode?: number;
    reviewsTotal?: number; reviewsAvg?: number;
    photosTotal?: number; postsCount?: number;
  }
) {
  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase.from("score_history").upsert(
    {
      client_id: clientId,
      snapshot_date: today,
      overall_score: scores.overall,
      desc_score: scores.desc,
      review_score: scores.review,
      photo_score: scores.photo,
      post_score: scores.post,
      basic_score: scores.basic,
      ai_mode_score: scores.aiMode || 0,
      reviews_total: scores.reviewsTotal || 0,
      reviews_avg: scores.reviewsAvg || 0,
      photos_total: scores.photosTotal || 0,
      posts_count: scores.postsCount || 0,
      is_real: true,
    },
    { onConflict: "client_id,snapshot_date" }
  );

  if (error) throw error;
}

export async function getScoreHistory(clientId: string): Promise<ScoreSnapshot[]> {
  const { data, error } = await supabase
    .from("score_history")
    .select("*")
    .eq("client_id", clientId)
    .order("snapshot_date", { ascending: true })
    .limit(12);

  if (error) throw error;
  return data || [];
}

// ── NAP Change Log ────────────────────────────────────────────
export async function logNAPChange(
  clientId: string,
  userId: string,
  field: string,
  oldValue: string,
  newValue: string,
  status: "approved" | "rejected",
  reason?: string
) {
  const { error } = await supabase.from("nap_changes").insert({
    client_id: clientId,
    user_id: userId,
    field,
    old_value: oldValue,
    new_value: newValue,
    status,
    reason,
  });

  if (error) throw error;
}

export async function getNAPChanges(clientId: string) {
  const { data, error } = await supabase
    .from("nap_changes")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

// ── Reviews ──────────────────────────────────────────────────
export async function getReviews(clientId: string, limit = 50) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("client_id", clientId)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function saveReviewReply(reviewId: string, reply: string) {
  const { error } = await supabase
    .from("reviews")
    .update({ reply, replied_at: new Date().toISOString() })
    .eq("id", reviewId);
  if (error) throw error;
}

// ── Posts ─────────────────────────────────────────────────────
export async function getPosts(clientId: string, limit = 20) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("client_id", clientId)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ── Photos ────────────────────────────────────────────────────
export async function getPhotos(clientId: string) {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("client_id", clientId)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// ── Events (Autopilot Feed) ──────────────────────────────────
export async function getEvents(agencyId: string, limit = 50) {
  const { data, error } = await supabase
    .from("events")
    .select("*, clients(business_name, city)")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function createEvent(
  agencyId: string,
  clientId: string | null,
  type: string,
  level: string,
  title: string,
  detail?: string,
  metadata?: Record<string, unknown>
) {
  const { error } = await supabase.from("events").insert({
    agency_id: agencyId,
    client_id: clientId,
    type, level, title, detail,
    metadata: metadata || {},
  });
  if (error) throw error;
}

export async function markEventsRead(agencyId: string) {
  const { error } = await supabase
    .from("events")
    .update({ read: true })
    .eq("agency_id", agencyId)
    .eq("read", false);
  if (error) throw error;
}

// ── Rescue Sessions ──────────────────────────────────────────
export async function createRescueSession(clientId: string, userId: string, scoreAtStart: number) {
  const { data, error } = await supabase
    .from("rescue_sessions")
    .insert({ client_id: clientId, started_by: userId, score_at_start: scoreAtStart })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeRescueSession(sessionId: string, scoreAtEnd: number) {
  const { error } = await supabase
    .from("rescue_sessions")
    .update({ status: "completed", score_at_end: scoreAtEnd, completed_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}

// ── AI Responses (audit trail) ───────────────────────────────
export async function saveAIResponse(
  clientId: string,
  userId: string,
  responseText: string,
  reviewId?: string,
  promptContext?: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("ai_responses")
    .insert({ client_id: clientId, generated_by: userId, response_text: responseText, review_id: reviewId, prompt_context: promptContext || {} })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Competitors ──────────────────────────────────────────────
export async function getCompetitors(clientId: string) {
  const { data, error } = await supabase
    .from("competitors")
    .select("*")
    .eq("client_id", clientId)
    .order("distance_miles");
  if (error) throw error;
  return data || [];
}

// ── GEO Score ────────────────────────────────────────────────
export async function saveGEOScore(clientId: string, scores: Record<string, number>, verdict: string) {
  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("geo_score_history").upsert({
    client_id: clientId,
    snapshot_date: today,
    overall_score: scores.overall || 0,
    ontology_score: scores.ontology || 0,
    chunks_score: scores.chunks || 0,
    authority_score: scores.authority || 0,
    triangulation_score: scores.triangulation || 0,
    geo_score: scores.geo || 0,
    alignment_score: scores.alignment || 0,
    structured_score: scores.structured || 0,
    verdict,
  }, { onConflict: "client_id,snapshot_date" });
  if (error) throw error;
}

// ── LSA ──────────────────────────────────────────────────────
export async function getLSAData(clientId: string, weeks = 8) {
  const { data, error } = await supabase
    .from("lsa_data")
    .select("*")
    .eq("client_id", clientId)
    .order("week_start", { ascending: false })
    .limit(weeks);
  if (error) throw error;
  return data || [];
}
