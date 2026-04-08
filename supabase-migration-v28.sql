-- ============================================================
-- GBP Zenith v28 — Schema Migration
-- Run AFTER supabase-setup.sql and supabase-google-tokens.sql
-- Adds tables for: reviews, posts, photos, rescue, events, LSA
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. CLIENT DETAILS — extended profile data from GBP
-- ══════════════════════════════════════════════════════════════
ALTER TABLE clients ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS description_length INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS secondary_categories TEXT[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS attributes INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS hours_filled BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rating REAL DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_cover_photo BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- ══════════════════════════════════════════════════════════════
-- 2. REVIEWS — individual reviews synced from GBP
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  gbp_review_id TEXT,
  author TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  text TEXT DEFAULT '',
  reply TEXT,
  replied_at TIMESTAMPTZ,
  sentiment TEXT CHECK (sentiment IN ('positive','negative','neutral')),
  matched_services TEXT[] DEFAULT '{}',
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reviews_client ON reviews(client_id);
CREATE INDEX idx_reviews_sentiment ON reviews(client_id, sentiment);
CREATE UNIQUE INDEX idx_reviews_gbp_id ON reviews(gbp_review_id) WHERE gbp_review_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════
-- 3. REVIEW STATS — aggregated monthly review metrics
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS review_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- first day of month
  total INTEGER DEFAULT 0,
  average REAL DEFAULT 0,
  with_response INTEGER DEFAULT 0,
  negative_unanswered INTEGER DEFAULT 0,
  positive INTEGER DEFAULT 0,
  negative INTEGER DEFAULT 0,
  neutral INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_review_stats_client_month ON review_stats(client_id, month);

-- ══════════════════════════════════════════════════════════════
-- 4. POSTS — GBP posts synced
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  gbp_post_id TEXT,
  type TEXT DEFAULT 'UPDATE' CHECK (type IN ('UPDATE','EVENT','OFFER','PRODUCT','ALERT')),
  text TEXT DEFAULT '',
  image_url TEXT,
  cta_type TEXT,
  cta_url TEXT,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_posts_client ON posts(client_id);
CREATE INDEX idx_posts_published ON posts(client_id, published_at DESC);

-- ══════════════════════════════════════════════════════════════
-- 5. PHOTOS — GBP photos synced
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  gbp_photo_id TEXT,
  url TEXT NOT NULL,
  category TEXT DEFAULT 'ADDITIONAL' CHECK (category IN ('COVER','LOGO','EXTERIOR','INTERIOR','PRODUCT','TEAM','ADDITIONAL')),
  uploaded_at TIMESTAMPTZ,
  is_owner_uploaded BOOLEAN DEFAULT true,
  width INTEGER,
  height INTEGER,
  exif_lat REAL,
  exif_lng REAL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_photos_client ON photos(client_id);

-- ══════════════════════════════════════════════════════════════
-- 6. RESCUE SESSIONS — rescue mode diagnostic sessions
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS rescue_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  started_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  primary_cause TEXT,
  confidence INTEGER DEFAULT 0,
  ai_diagnosis TEXT,
  ai_plan TEXT,
  diagnosis_data JSONB DEFAULT '{}',
  score_at_start REAL DEFAULT 0,
  score_at_end REAL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_rescue_client ON rescue_sessions(client_id);

-- ══════════════════════════════════════════════════════════════
-- 7. RESCUE ACTIONS — individual actions within a rescue session
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS rescue_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES rescue_sessions(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL,
  action_text TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  impact TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rescue_actions_session ON rescue_actions(session_id);

-- ══════════════════════════════════════════════════════════════
-- 8. EVENTS — unified event feed (autopilot)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'score_drop','score_rise','review_new','review_negative','review_responded',
    'post_published','post_expired','photo_added','photo_removed',
    'auto_edit_detected','category_changed','hours_changed',
    'rescue_started','rescue_completed',
    'competitor_new','competitor_rank_change',
    'nap_inconsistency','verification_lost',
    'system','manual'
  )),
  level TEXT DEFAULT 'info' CHECK (level IN ('critical','high','medium','info','ok')),
  title TEXT NOT NULL,
  detail TEXT,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_agency ON events(agency_id, created_at DESC);
CREATE INDEX idx_events_client ON events(client_id, created_at DESC);
CREATE INDEX idx_events_unread ON events(agency_id, read) WHERE read = false;

-- ══════════════════════════════════════════════════════════════
-- 9. LSA DATA — Local Services Ads tracking
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS lsa_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  budget REAL DEFAULT 0,
  spent REAL DEFAULT 0,
  leads INTEGER DEFAULT 0,
  answered INTEGER DEFAULT 0,
  booked INTEGER DEFAULT 0,
  badge_type TEXT CHECK (badge_type IN ('guaranteed','screened')),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_lsa_client_week ON lsa_data(client_id, week_start);

-- ══════════════════════════════════════════════════════════════
-- 10. AI RESPONSES — generated review responses (audit trail)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ai_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES auth.users(id),
  prompt_context JSONB DEFAULT '{}',
  response_text TEXT NOT NULL,
  was_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_responses_client ON ai_responses(client_id);

-- ══════════════════════════════════════════════════════════════
-- 11. COMPETITOR SNAPSHOTS — tracked competitors
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  gbp_place_id TEXT,
  name TEXT NOT NULL,
  category TEXT,
  distance_miles REAL,
  rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  photo_count INTEGER DEFAULT 0,
  is_lsa_active BOOLEAN DEFAULT false,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_competitors_client ON competitors(client_id);

-- ══════════════════════════════════════════════════════════════
-- 12. GEO SCORE HISTORY — AI citability snapshots
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS geo_score_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_score REAL DEFAULT 0,
  ontology_score REAL DEFAULT 0,
  chunks_score REAL DEFAULT 0,
  authority_score REAL DEFAULT 0,
  triangulation_score REAL DEFAULT 0,
  geo_score REAL DEFAULT 0,
  alignment_score REAL DEFAULT 0,
  structured_score REAL DEFAULT 0,
  verdict TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_geo_score_client_date ON geo_score_history(client_id, snapshot_date);

-- ══════════════════════════════════════════════════════════════
-- RLS POLICIES — for all new tables
-- ══════════════════════════════════════════════════════════════

-- Helper: check if user owns the client via agency
CREATE OR REPLACE FUNCTION user_owns_client(cid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM clients c
    JOIN agencies a ON a.id = c.agency_id
    WHERE c.id = cid AND a.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reviews" ON reviews FOR ALL
  USING (user_owns_client(client_id)) WITH CHECK (user_owns_client(client_id));

-- Review Stats
ALTER TABLE review_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own review stats" ON review_stats FOR ALL
  USING (user_owns_client(client_id)) WITH CHECK (user_owns_client(client_id));

-- Posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own posts" ON posts FOR ALL
  USING (user_owns_client(client_id)) WITH CHECK (user_owns_client(client_id));

-- Photos
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own photos" ON photos FOR ALL
  USING (user_owns_client(client_id)) WITH CHECK (user_owns_client(client_id));

-- Rescue Sessions
ALTER TABLE rescue_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rescue sessions" ON rescue_sessions FOR ALL
  USING (user_owns_client(client_id)) WITH CHECK (user_owns_client(client_id));

-- Rescue Actions
ALTER TABLE rescue_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rescue actions" ON rescue_actions FOR ALL
  USING (session_id IN (SELECT id FROM rescue_sessions WHERE user_owns_client(client_id)))
  WITH CHECK (session_id IN (SELECT id FROM rescue_sessions WHERE user_owns_client(client_id)));

-- Events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own events" ON events FOR ALL
  USING (agency_id IN (SELECT id FROM agencies WHERE user_id = auth.uid()))
  WITH CHECK (agency_id IN (SELECT id FROM agencies WHERE user_id = auth.uid()));

-- LSA Data
ALTER TABLE lsa_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own LSA data" ON lsa_data FOR ALL
  USING (user_owns_client(client_id)) WITH CHECK (user_owns_client(client_id));

-- AI Responses
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own AI responses" ON ai_responses FOR ALL
  USING (user_owns_client(client_id)) WITH CHECK (user_owns_client(client_id));

-- Competitors
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own competitors" ON competitors FOR ALL
  USING (user_owns_client(client_id)) WITH CHECK (user_owns_client(client_id));

-- GEO Score History
ALTER TABLE geo_score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own GEO scores" ON geo_score_history FOR ALL
  USING (user_owns_client(client_id)) WITH CHECK (user_owns_client(client_id));

-- ══════════════════════════════════════════════════════════════
-- SERVICE ROLE policies (for API routes / cron jobs)
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "Service role full access reviews" ON reviews FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access review_stats" ON review_stats FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access posts" ON posts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access photos" ON photos FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access rescue_sessions" ON rescue_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access rescue_actions" ON rescue_actions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access events" ON events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access lsa_data" ON lsa_data FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access ai_responses" ON ai_responses FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access competitors" ON competitors FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access geo_score_history" ON geo_score_history FOR ALL USING (auth.role() = 'service_role');
