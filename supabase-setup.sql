-- ============================================================
-- GBP Zenith — Supabase Setup SQL
-- Cole este SQL inteiro no SQL Editor do Supabase e clique RUN
-- ============================================================

-- 1. Agencies (uma por usuario)
CREATE TABLE agencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  brand_name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','starter','agency','scale','enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX agencies_user_id_idx ON agencies(user_id);

-- 2. Clients (negocios/GBPs gerenciados pela agencia)
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  gbp_place_id TEXT,
  business_name TEXT NOT NULL DEFAULT '',
  category TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  city TEXT,
  verified BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  nap_master JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX clients_place_id_idx ON clients(gbp_place_id) WHERE gbp_place_id IS NOT NULL;
CREATE INDEX clients_agency_id_idx ON clients(agency_id);

-- 3. Score History (snapshots diarios de score por client)
CREATE TABLE score_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_score REAL DEFAULT 0,
  desc_score REAL DEFAULT 0,
  review_score REAL DEFAULT 0,
  photo_score REAL DEFAULT 0,
  post_score REAL DEFAULT 0,
  basic_score REAL DEFAULT 0,
  ai_mode_score REAL DEFAULT 0,
  reviews_total INTEGER DEFAULT 0,
  reviews_avg REAL DEFAULT 0,
  photos_total INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  is_real BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX score_history_client_date_idx ON score_history(client_id, snapshot_date);

-- 4. NAP Changes (log de alteracoes NAP aprovadas/rejeitadas)
CREATE TABLE nap_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  field TEXT NOT NULL,
  old_value TEXT DEFAULT '',
  new_value TEXT DEFAULT '',
  status TEXT DEFAULT 'approved' CHECK (status IN ('approved','rejected')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX nap_changes_client_id_idx ON nap_changes(client_id);

-- 5. RLS (Row Level Security) — cada usuario so ve seus dados
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE nap_changes ENABLE ROW LEVEL SECURITY;

-- Policies: agencies
CREATE POLICY "Users manage own agency"
  ON agencies FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies: clients (via agency ownership)
CREATE POLICY "Users manage own clients"
  ON clients FOR ALL
  USING (agency_id IN (SELECT id FROM agencies WHERE user_id = auth.uid()))
  WITH CHECK (agency_id IN (SELECT id FROM agencies WHERE user_id = auth.uid()));

-- Policies: score_history (via client → agency ownership)
CREATE POLICY "Users view own scores"
  ON score_history FOR ALL
  USING (client_id IN (
    SELECT c.id FROM clients c
    JOIN agencies a ON a.id = c.agency_id
    WHERE a.user_id = auth.uid()
  ))
  WITH CHECK (client_id IN (
    SELECT c.id FROM clients c
    JOIN agencies a ON a.id = c.agency_id
    WHERE a.user_id = auth.uid()
  ));

-- Policies: nap_changes
CREATE POLICY "Users view own nap changes"
  ON nap_changes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
