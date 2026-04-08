-- ══════════════════════════════════════════════════════════════
-- Google OAuth Tokens — armazena credenciais GBP API por usuário
-- Rodar no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS google_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,           -- Unix timestamp
  scope TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT google_tokens_user_unique UNIQUE (user_id)
);

-- RLS: cada usuário só vê seus próprios tokens
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tokens"
  ON google_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens"
  ON google_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON google_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens"
  ON google_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass (para API routes server-side)
CREATE POLICY "Service role full access"
  ON google_tokens FOR ALL
  USING (auth.role() = 'service_role');

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_google_tokens_user ON google_tokens(user_id);
