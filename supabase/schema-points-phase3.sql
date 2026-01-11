-- =====================================================
-- ARCHIVE POINTS - Phase 3: Competition
-- =====================================================
-- Ejecutar este SQL en Supabase SQL Editor
-- DESPUÉS de haber ejecutado schema-points.sql y schema-points-phase2.sql
-- =====================================================

-- =====================================================
-- 1. TABLA LEADERBOARD_SNAPSHOTS
-- =====================================================
-- Guarda el estado final del leaderboard al terminar cada temporada

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencia a temporada y usuario
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES point_users(id) ON DELETE CASCADE,

  -- Posición y puntos al momento del snapshot
  rank INTEGER NOT NULL,
  season_points INTEGER NOT NULL,
  lifetime_points INTEGER NOT NULL,

  -- Premio otorgado
  prize_type VARCHAR(50),  -- 'nft', 'points', 'badge', etc.
  prize_amount INTEGER,    -- Cantidad de puntos o valor del premio
  prize_claimed BOOLEAN DEFAULT FALSE,
  prize_claimed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata adicional
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un usuario solo puede tener un snapshot por temporada
  UNIQUE(season_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_snapshots_season ON leaderboard_snapshots(season_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user ON leaderboard_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_rank ON leaderboard_snapshots(season_id, rank);

-- =====================================================
-- 2. TABLA SEASON_PRIZES
-- =====================================================
-- Define los premios por posición para cada temporada

CREATE TABLE IF NOT EXISTS season_prizes (
  id SERIAL PRIMARY KEY,

  -- Rango de posiciones (ej: 1-1 para #1, 2-5 para #2-5)
  rank_from INTEGER NOT NULL,
  rank_to INTEGER NOT NULL,

  -- Premio
  prize_type VARCHAR(50) NOT NULL,  -- 'points', 'nft', 'badge'
  prize_amount INTEGER NOT NULL,
  prize_description TEXT,

  -- Orden de display
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar premios por defecto según el plan
INSERT INTO season_prizes (rank_from, rank_to, prize_type, prize_amount, prize_description, display_order)
VALUES
  (1, 1, 'nft_and_points', 5000, 'NFT gratis + 5,000 pts', 1),
  (2, 5, 'points', 3000, '3,000 pts', 2),
  (6, 20, 'points', 1000, '1,000 pts', 3),
  (21, 100, 'badge', 0, 'Badge "Top 100 Season"', 4)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. AÑADIR CAMPOS A SEASONS
-- =====================================================

-- Añadir campo para marcar si la temporada fue procesada
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT FALSE;
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS total_participants INTEGER DEFAULT 0;
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS total_points_distributed INTEGER DEFAULT 0;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_prizes ENABLE ROW LEVEL SECURITY;

-- Políticas para leaderboard_snapshots
CREATE POLICY "Anyone can view snapshots" ON leaderboard_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Service can manage snapshots" ON leaderboard_snapshots
  FOR ALL USING (true);

-- Políticas para season_prizes
CREATE POLICY "Anyone can view prizes" ON season_prizes
  FOR SELECT USING (true);

CREATE POLICY "Service can manage prizes" ON season_prizes
  FOR ALL USING (true);

-- =====================================================
-- 5. FUNCIÓN: FINALIZAR TEMPORADA
-- =====================================================

CREATE OR REPLACE FUNCTION finalize_season(p_season_id INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_season RECORD;
  v_user RECORD;
  v_prize RECORD;
  v_rank INTEGER := 0;
  v_total_participants INTEGER := 0;
  v_total_points INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Verificar que la temporada existe y está activa
  SELECT * INTO v_season FROM seasons WHERE id = p_season_id;

  IF v_season IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Season not found');
  END IF;

  IF v_season.is_finalized THEN
    RETURN jsonb_build_object('success', false, 'error', 'Season already finalized');
  END IF;

  -- Crear snapshots para todos los usuarios con puntos
  FOR v_user IN
    SELECT id, wallet, season_points, lifetime_points
    FROM point_users
    WHERE season_points > 0
    ORDER BY season_points DESC
  LOOP
    v_rank := v_rank + 1;
    v_total_participants := v_total_participants + 1;

    -- Buscar premio correspondiente
    SELECT * INTO v_prize
    FROM season_prizes
    WHERE v_rank >= rank_from AND v_rank <= rank_to
    LIMIT 1;

    -- Insertar snapshot
    INSERT INTO leaderboard_snapshots (
      season_id, user_id, rank, season_points, lifetime_points,
      prize_type, prize_amount
    ) VALUES (
      p_season_id, v_user.id, v_rank, v_user.season_points, v_user.lifetime_points,
      v_prize.prize_type, v_prize.prize_amount
    );

    -- Si hay premio de puntos, otorgarlo
    IF v_prize IS NOT NULL AND v_prize.prize_type IN ('points', 'nft_and_points') THEN
      UPDATE point_users
      SET
        lifetime_points = lifetime_points + v_prize.prize_amount,
        season_points = season_points + v_prize.prize_amount
      WHERE id = v_user.id;

      v_total_points := v_total_points + v_prize.prize_amount;

      -- Registrar transacción
      INSERT INTO point_transactions (user_id, amount, type, description, season_id, metadata)
      VALUES (
        v_user.id,
        v_prize.prize_amount,
        'season_prize',
        'Season ' || p_season_id || ' - Rank #' || v_rank,
        p_season_id,
        jsonb_build_object('rank', v_rank, 'prize_type', v_prize.prize_type)
      );
    END IF;
  END LOOP;

  -- Marcar temporada como finalizada
  UPDATE seasons SET
    is_finalized = true,
    is_active = false,
    finalized_at = NOW(),
    total_participants = v_total_participants,
    total_points_distributed = v_total_points
  WHERE id = p_season_id;

  -- Resetear season_points de todos los usuarios
  UPDATE point_users SET season_points = 0;

  RETURN jsonb_build_object(
    'success', true,
    'season_id', p_season_id,
    'total_participants', v_total_participants,
    'total_points_distributed', v_total_points
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. FUNCIÓN: CREAR NUEVA TEMPORADA
-- =====================================================

CREATE OR REPLACE FUNCTION create_new_season(p_duration_days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
  v_last_season RECORD;
  v_new_season_number INTEGER;
  v_new_season RECORD;
BEGIN
  -- Obtener última temporada
  SELECT * INTO v_last_season
  FROM seasons
  ORDER BY id DESC
  LIMIT 1;

  -- Calcular número de nueva temporada
  IF v_last_season IS NULL THEN
    v_new_season_number := 1;
  ELSE
    v_new_season_number := v_last_season.id + 1;
  END IF;

  -- Crear nueva temporada
  INSERT INTO seasons (name, starts_at, ends_at, is_active)
  VALUES (
    'Season ' || v_new_season_number,
    NOW(),
    NOW() + (p_duration_days || ' days')::INTERVAL,
    true
  )
  RETURNING * INTO v_new_season;

  RETURN jsonb_build_object(
    'success', true,
    'season', jsonb_build_object(
      'id', v_new_season.id,
      'name', v_new_season.name,
      'starts_at', v_new_season.starts_at,
      'ends_at', v_new_season.ends_at
    )
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. FUNCIÓN: OBTENER HISTORIAL DE TEMPORADAS
-- =====================================================

CREATE OR REPLACE FUNCTION get_season_history(p_limit INTEGER DEFAULT 10)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(season_data ORDER BY id DESC)
  INTO v_result
  FROM (
    SELECT
      s.id,
      s.name,
      s.starts_at,
      s.ends_at,
      s.is_active,
      s.is_finalized,
      s.total_participants,
      s.total_points_distributed,
      (
        SELECT jsonb_agg(jsonb_build_object(
          'rank', ls.rank,
          'wallet', pu.wallet,
          'season_points', ls.season_points,
          'prize_type', ls.prize_type,
          'prize_amount', ls.prize_amount
        ) ORDER BY ls.rank)
        FROM leaderboard_snapshots ls
        JOIN point_users pu ON pu.id = ls.user_id
        WHERE ls.season_id = s.id AND ls.rank <= 10
      ) as top_10
    FROM seasons s
    WHERE s.is_finalized = true
    ORDER BY s.id DESC
    LIMIT p_limit
  ) as season_data;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. FUNCIÓN: OBTENER MI HISTORIAL EN TEMPORADAS
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_season_history(p_wallet VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Obtener ID del usuario
  SELECT id INTO v_user_id FROM point_users WHERE wallet = LOWER(p_wallet);

  IF v_user_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'season_id', s.id,
    'season_name', s.name,
    'rank', ls.rank,
    'season_points', ls.season_points,
    'prize_type', ls.prize_type,
    'prize_amount', ls.prize_amount,
    'total_participants', s.total_participants
  ) ORDER BY s.id DESC)
  INTO v_result
  FROM leaderboard_snapshots ls
  JOIN seasons s ON s.id = ls.season_id
  WHERE ls.user_id = v_user_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DEL SCHEMA FASE 3
-- =====================================================
