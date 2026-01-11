-- =====================================================
-- ARCHIVE POINTS - Database Schema
-- =====================================================
-- Ejecutar este SQL en Supabase SQL Editor
-- =====================================================

-- 1. Tabla de temporadas
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de usuarios de puntos
CREATE TABLE IF NOT EXISTS point_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet VARCHAR(42) UNIQUE NOT NULL,

  -- Puntos
  lifetime_points INTEGER DEFAULT 0,
  season_points INTEGER DEFAULT 0,
  burned_points INTEGER DEFAULT 0,

  -- Streak
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  last_checkin TIMESTAMP WITH TIME ZONE,

  -- Boost
  last_boost TIMESTAMP WITH TIME ZONE,
  boosts_today INTEGER DEFAULT 0,
  last_boost_reset DATE,

  -- Referidos
  referral_code VARCHAR(10) UNIQUE,
  referred_by UUID REFERENCES point_users(id),
  referred_at TIMESTAMP WITH TIME ZONE,

  -- NFT status (cached)
  nft_count INTEGER DEFAULT 0,
  has_pass BOOLEAN DEFAULT FALSE,
  last_nft_check TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de transacciones de puntos
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES point_users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  season_id INTEGER REFERENCES seasons(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tipos de transacciones:
-- 'checkin' - Check-in diario
-- 'boost' - Boost tap
-- 'streak_bonus' - Bonus por streak
-- 'nft_bonus' - Bonus por NFTs
-- 'referral_bonus' - Bonus por referir
-- 'referral_earned' - Puntos de referido
-- 'burn' - Puntos quemados
-- 'reward' - Premio de leaderboard

-- 4. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_point_users_wallet ON point_users(wallet);
CREATE INDEX IF NOT EXISTS idx_point_users_season_points ON point_users(season_points DESC);
CREATE INDEX IF NOT EXISTS idx_point_users_lifetime_points ON point_users(lifetime_points DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_season ON point_transactions(season_id);

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger para updated_at en point_users
DROP TRIGGER IF EXISTS update_point_users_updated_at ON point_users;
CREATE TRIGGER update_point_users_updated_at
  BEFORE UPDATE ON point_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Función para generar código de referido único
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(10) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(10) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 8. Row Level Security (RLS)
ALTER TABLE point_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Políticas para point_users
CREATE POLICY "Users can view all users" ON point_users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own record" ON point_users
  FOR UPDATE USING (true);

CREATE POLICY "Service can insert users" ON point_users
  FOR INSERT WITH CHECK (true);

-- Políticas para point_transactions
CREATE POLICY "Users can view all transactions" ON point_transactions
  FOR SELECT USING (true);

CREATE POLICY "Service can insert transactions" ON point_transactions
  FOR INSERT WITH CHECK (true);

-- Políticas para seasons
CREATE POLICY "Anyone can view seasons" ON seasons
  FOR SELECT USING (true);

CREATE POLICY "Service can manage seasons" ON seasons
  FOR ALL USING (true);

-- 9. Crear primera temporada (Season 1)
INSERT INTO seasons (name, starts_at, ends_at, is_active)
VALUES (
  'Season 1',
  NOW(),
  NOW() + INTERVAL '30 days',
  true
)
ON CONFLICT DO NOTHING;

-- 10. Vista para leaderboard
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT
  id,
  wallet,
  season_points,
  lifetime_points,
  current_streak,
  nft_count,
  has_pass,
  RANK() OVER (ORDER BY season_points DESC) as rank
FROM point_users
WHERE season_points > 0
ORDER BY season_points DESC;

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================
