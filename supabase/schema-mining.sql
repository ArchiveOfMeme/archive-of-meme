-- =============================================
-- ARCHIVE OF MEME - MINING SYSTEM SCHEMA
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. TABLA: mining_users (usuarios del sistema de minería)
CREATE TABLE mining_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet VARCHAR(42) UNIQUE NOT NULL,

  -- Puntos
  lifetime_points BIGINT DEFAULT 0,
  season_points BIGINT DEFAULT 0,

  -- Streak
  current_streak INT DEFAULT 0,
  max_streak INT DEFAULT 0,
  last_mining_at TIMESTAMP WITH TIME ZONE,

  -- Cache de NFTs (para no consultar OpenSea cada vez)
  cached_miner_level VARCHAR(10), -- 'Basic', 'Pro', 'Ultra', NULL
  cached_miner_token_id VARCHAR(20),
  cached_meme_count INT DEFAULT 0,
  cached_has_pass BOOLEAN DEFAULT false,
  last_nft_check TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_mining_users_wallet ON mining_users(wallet);
CREATE INDEX idx_mining_users_season_points ON mining_users(season_points DESC);
CREATE INDEX idx_mining_users_lifetime_points ON mining_users(lifetime_points DESC);

-- 2. TABLA: mining_transactions (historial de minería)
CREATE TABLE mining_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES mining_users(id) ON DELETE CASCADE,

  -- Detalles de la transacción
  amount INT NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'mining', 'bonus', 'burn', 'reward'
  description TEXT,

  -- Metadata
  miner_level VARCHAR(10),
  streak_at_time INT,
  bonuses_applied JSONB, -- {"streak": 0.15, "memes": 0.20, "pass": 0.25}

  -- Season tracking
  season_id UUID,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_mining_tx_user ON mining_transactions(user_id);
CREATE INDEX idx_mining_tx_type ON mining_transactions(type);
CREATE INDEX idx_mining_tx_created ON mining_transactions(created_at DESC);

-- 3. TABLA: seasons (temporadas)
CREATE TABLE mining_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear primera temporada (90 días desde hoy)
INSERT INTO mining_seasons (name, starts_at, ends_at, is_active)
VALUES (
  'Season 1',
  NOW(),
  NOW() + INTERVAL '90 days',
  true
);

-- 4. VISTA: Leaderboard
CREATE OR REPLACE VIEW mining_leaderboard AS
SELECT
  wallet,
  season_points,
  lifetime_points,
  current_streak,
  cached_miner_level,
  RANK() OVER (ORDER BY season_points DESC) as rank
FROM mining_users
WHERE season_points > 0
ORDER BY season_points DESC;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE mining_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_seasons ENABLE ROW LEVEL SECURITY;

-- Políticas para mining_users
CREATE POLICY "Mining users viewable by everyone" ON mining_users
  FOR SELECT USING (true);

CREATE POLICY "Mining users insertable" ON mining_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Mining users updatable" ON mining_users
  FOR UPDATE USING (true);

-- Políticas para mining_transactions
CREATE POLICY "Mining transactions viewable by everyone" ON mining_transactions
  FOR SELECT USING (true);

CREATE POLICY "Mining transactions insertable" ON mining_transactions
  FOR INSERT WITH CHECK (true);

-- Políticas para mining_seasons
CREATE POLICY "Seasons viewable by everyone" ON mining_seasons
  FOR SELECT USING (true);

-- =============================================
-- CONSTANTES DEL SISTEMA (como comentario de referencia)
-- =============================================
--
-- MINER_POINTS:
--   Basic: 50
--   Pro: 150
--   Ultra: 400
--
-- COOLDOWN: 4 horas (14400 segundos)
--
-- STREAK_BONUS: +5% por día, máximo +30%
--
-- MEME_BONUS:
--   1-2 memes: +10%
--   3-5 memes: +20%
--   6-10 memes: +35%
--   11-20 memes: +50%
--   21+ memes: +75%
--
-- PASS_BONUS: +25%
--
-- HARD_CAP: +150% máximo de bonus total
--
