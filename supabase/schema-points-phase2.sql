-- =====================================================
-- ARCHIVE POINTS - Phase 2: Referrals & Rewards
-- =====================================================
-- Ejecutar este SQL en Supabase SQL Editor
-- DESPUÉS de haber ejecutado schema-points.sql
-- =====================================================

-- =====================================================
-- 1. TABLA REFERRALS
-- =====================================================
-- Trackea relaciones de referidos y puntos ganados

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación
  referrer_id UUID NOT NULL REFERENCES point_users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES point_users(id) ON DELETE CASCADE,

  -- Tracking de puntos
  points_earned INTEGER DEFAULT 0,  -- Total ganado por el referidor de este referido

  -- Estado y expiración
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,  -- 30 días después del registro

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Evitar duplicados
  UNIQUE(referrer_id, referred_id)
);

-- Índices para referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_active ON referrals(is_active, expires_at);

-- =====================================================
-- 2. TABLA REWARDS
-- =====================================================
-- Rewards canjeados por usuarios (burns)

CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuario
  user_id UUID NOT NULL REFERENCES point_users(id) ON DELETE CASCADE,

  -- Tipo de reward
  type VARCHAR(50) NOT NULL,
  -- Tipos válidos:
  -- 'streak_protection' - Protege el streak por 1 día (2,000 pts)
  -- 'boost_2x'          - Duplica puntos por 24h (5,000 pts)
  -- 'early_access'      - Whitelist para próximo NFT (10,000 pts)
  -- 'nft_pass'          - Pass de comunidad gratis (50,000 pts)
  -- 'badge_season'      - Badge exclusivo de temporada (25,000 pts)
  -- 'og_role'           - Status OG permanente (100,000 pts)
  -- 'raffle_entry'      - Entrada para sorteo (5,000 pts)

  -- Costo y temporada
  cost INTEGER NOT NULL,
  season_id INTEGER REFERENCES seasons(id),

  -- Estado del reward
  used BOOLEAN DEFAULT FALSE,           -- Si ya fue usado/aplicado
  used_at TIMESTAMP WITH TIME ZONE,     -- Cuándo se usó
  expires_at TIMESTAMP WITH TIME ZONE,  -- Cuándo expira (si aplica)

  -- Metadata adicional (ej: detalles del sorteo)
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para rewards
CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(type);
CREATE INDEX IF NOT EXISTS idx_rewards_used ON rewards(used);
CREATE INDEX IF NOT EXISTS idx_rewards_expires ON rewards(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- 3. TABLA REWARD_DEFINITIONS
-- =====================================================
-- Definición de rewards disponibles y sus costos

CREATE TABLE IF NOT EXISTS reward_definitions (
  id VARCHAR(50) PRIMARY KEY,  -- 'streak_protection', 'boost_2x', etc.

  -- Info básica
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Costo
  cost INTEGER NOT NULL,

  -- Límites
  limit_per_user_per_week INTEGER,     -- NULL = sin límite semanal
  limit_per_user_per_season INTEGER,   -- NULL = sin límite por temporada
  limit_total_per_season INTEGER,      -- NULL = sin límite global

  -- Configuración
  duration_hours INTEGER,  -- Duración del efecto (ej: 24h para boost_2x)
  is_active BOOLEAN DEFAULT TRUE,

  -- Orden de display
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. INSERTAR REWARDS PREDEFINIDOS
-- =====================================================

INSERT INTO reward_definitions (id, name, description, cost, limit_per_user_per_week, limit_per_user_per_season, limit_total_per_season, duration_hours, display_order)
VALUES
  ('streak_protection', 'Streak Protection', 'Salva tu streak si fallas un día de check-in', 2000, 1, NULL, NULL, 24, 1),
  ('boost_2x', 'Boost x2', 'Duplica todos los puntos ganados durante 24 horas', 5000, 2, NULL, NULL, 24, 2),
  ('early_access', 'Early Access', 'Whitelist garantizada para el próximo drop de NFT', 10000, NULL, 1, 50, NULL, 3),
  ('raffle_entry', 'Raffle Entry', 'Una entrada para el sorteo semanal de NFT', 5000, NULL, NULL, NULL, NULL, 4),
  ('badge_season', 'Season Badge', 'Badge NFT exclusivo de esta temporada', 25000, NULL, 1, NULL, NULL, 5),
  ('nft_pass', 'NFT Pass Gratis', 'Pass de comunidad sin costo', 50000, NULL, 1, 5, NULL, 6),
  ('og_role', 'OG Role', 'Status OG permanente con beneficios exclusivos', 100000, NULL, 1, 100, NULL, 7)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cost = EXCLUDED.cost,
  limit_per_user_per_week = EXCLUDED.limit_per_user_per_week,
  limit_per_user_per_season = EXCLUDED.limit_per_user_per_season,
  limit_total_per_season = EXCLUDED.limit_total_per_season,
  duration_hours = EXCLUDED.duration_hours,
  display_order = EXCLUDED.display_order;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_definitions ENABLE ROW LEVEL SECURITY;

-- Políticas para referrals
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (true);

CREATE POLICY "Service can insert referrals" ON referrals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update referrals" ON referrals
  FOR UPDATE USING (true);

-- Políticas para rewards
CREATE POLICY "Users can view own rewards" ON rewards
  FOR SELECT USING (true);

CREATE POLICY "Service can insert rewards" ON rewards
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update rewards" ON rewards
  FOR UPDATE USING (true);

-- Políticas para reward_definitions
CREATE POLICY "Anyone can view reward definitions" ON reward_definitions
  FOR SELECT USING (true);

CREATE POLICY "Service can manage reward definitions" ON reward_definitions
  FOR ALL USING (true);

-- =====================================================
-- 6. VISTAS ÚTILES
-- =====================================================

-- Vista de referidos activos por usuario
CREATE OR REPLACE VIEW user_referrals_view AS
SELECT
  r.referrer_id,
  r.referred_id,
  r.points_earned,
  r.is_active,
  r.expires_at,
  r.created_at,
  pu.wallet as referred_wallet,
  pu.season_points as referred_season_points,
  CASE
    WHEN r.expires_at < NOW() THEN false
    ELSE r.is_active
  END as currently_active
FROM referrals r
JOIN point_users pu ON pu.id = r.referred_id;

-- Vista de rewards disponibles con uso actual
CREATE OR REPLACE VIEW available_rewards_view AS
SELECT
  rd.*,
  COALESCE(used_this_week.count, 0) as used_this_week,
  COALESCE(used_this_season.count, 0) as used_this_season,
  COALESCE(total_claimed.count, 0) as total_claimed_this_season
FROM reward_definitions rd
LEFT JOIN LATERAL (
  SELECT COUNT(*) as count
  FROM rewards r
  WHERE r.type = rd.id
    AND r.created_at > NOW() - INTERVAL '7 days'
) used_this_week ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) as count
  FROM rewards r
  JOIN seasons s ON s.id = r.season_id AND s.is_active = true
  WHERE r.type = rd.id
) used_this_season ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) as count
  FROM rewards r
  JOIN seasons s ON s.id = r.season_id AND s.is_active = true
  WHERE r.type = rd.id
) total_claimed ON true
WHERE rd.is_active = true
ORDER BY rd.display_order;

-- =====================================================
-- 7. FUNCIÓN PARA EXPIRAR REFERRALS AUTOMÁTICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION expire_old_referrals()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE referrals
  SET is_active = false
  WHERE is_active = true
    AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. FUNCIÓN PARA VERIFICAR STREAK PROTECTION
-- =====================================================

CREATE OR REPLACE FUNCTION has_active_streak_protection(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM rewards
    WHERE user_id = p_user_id
      AND type = 'streak_protection'
      AND used = false
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. FUNCIÓN PARA VERIFICAR BOOST 2X ACTIVO
-- =====================================================

CREATE OR REPLACE FUNCTION has_active_boost_2x(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM rewards
    WHERE user_id = p_user_id
      AND type = 'boost_2x'
      AND used = true
      AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DEL SCHEMA FASE 2
-- =====================================================
