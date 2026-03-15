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
