import { createClient } from "@supabase/supabase-js";

// Client-side Supabase (usa anon key — seguro para o browser)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Tipos das tabelas
export type Agency = {
  id: string;
  user_id: string;
  name: string;
  logo_url?: string;
  primary_color: string;
  brand_name?: string;
  plan: "starter" | "agency" | "scale" | "enterprise" | "free";
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
};

export type Client = {
  id: string;
  agency_id: string;
  gbp_place_id?: string;
  business_name: string;
  category?: string;
  address?: string;
  phone?: string;
  website?: string;
  city?: string;
  verified?: boolean;
  tags?: string[];
  nap_master?: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type ScoreSnapshot = {
  id: string;
  client_id: string;
  snapshot_date: string;
  overall_score: number;
  desc_score: number;
  review_score: number;
  photo_score: number;
  post_score: number;
  basic_score: number;
  ai_mode_score: number;
  reviews_total: number;
  reviews_avg: number;
  photos_total: number;
  posts_count: number;
  is_real: boolean;
  created_at: string;
};
