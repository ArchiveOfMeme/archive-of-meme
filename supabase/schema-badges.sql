-- =====================================================
-- ARCHIVE OF MEME - BADGES SYSTEM SCHEMA
-- =====================================================
-- Ejecutar este SQL en Supabase SQL Editor
-- DESPUÉS de haber ejecutado schema-mining.sql
-- =====================================================

-- =====================================================
-- 1. AÑADIR CAMPO total_mines A mining_users
-- =====================================================

ALTER TABLE mining_users
ADD COLUMN IF NOT EXISTS total_mines INTEGER DEFAULT 0;

-- Migrar datos existentes: contar minadas históricas
UPDATE mining_users mu
SET total_mines = (
  SELECT COUNT(*)
  FROM mining_transactions mt
  WHERE mt.user_id = mu.id
    AND mt.type = 'mining'
);

-- =====================================================
-- 2. TABLA badge_definitions
-- =====================================================
-- Define todos los badges disponibles en el sistema

CREATE TABLE IF NOT EXISTS badge_definitions (
  id VARCHAR(50) PRIMARY KEY,

  -- Info básica
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10) NOT NULL,  -- Emoji

  -- Categoría
  category VARCHAR(30) NOT NULL,
  -- Categorías: 'mining', 'collection', 'community', 'engagement', 'competition', 'special'

  -- Requisitos (almacenados como JSON para flexibilidad)
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER,
  -- Tipos:
  --   'lifetime_points_gte' -> lifetime_points >= value
  --   'current_streak_gte' -> current_streak >= value
  --   'total_mines_gte' -> total_mines >= value
  --   'meme_count_gte' -> cached_meme_count >= value
  --   'meme_count_all' -> tiene todos los memes
  --   'has_pass' -> tiene OG Pass
  --   'registered_before' -> registrado antes de fecha (value = timestamp)
  --   'referrals_gte' -> referidos activos >= value
  --   'comments_gte' -> comentarios >= value
  --   'votes_gte' -> votos >= value
  --   'season_rank_lte' -> terminó temporada en rank <= value
  --   'lottery_winner' -> ganó lotería

  -- Visual
  color_from VARCHAR(30),  -- Gradient start
  color_to VARCHAR(30),    -- Gradient end

  -- Configuración
  is_nft BOOLEAN DEFAULT FALSE,  -- Si se mintea como NFT
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABLA user_badges
-- =====================================================
-- Badges ganados por usuarios (persistentes)

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación
  user_id UUID NOT NULL REFERENCES mining_users(id) ON DELETE CASCADE,
  badge_id VARCHAR(50) NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,

  -- Metadata del momento en que se ganó
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  earned_value INTEGER,  -- Valor al momento de ganar (ej: streak de 30 días)

  -- Para badges de temporada
  season_id UUID REFERENCES mining_seasons(id),

  -- Evitar duplicados
  UNIQUE(user_id, badge_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

-- =====================================================
-- 4. INSERTAR BADGE DEFINITIONS - FASE 1
-- =====================================================

-- MINERÍA
INSERT INTO badge_definitions (id, name, description, icon, category, requirement_type, requirement_value, color_from, color_to, display_order)
VALUES
  ('miner_novato', 'Novato', 'Primera minería completada', '⛏️', 'mining', 'lifetime_points_gte', 1, 'gray-500', 'gray-600', 1),
  ('miner_activo', 'Activo', '50 minadas completadas', '⛏️', 'mining', 'total_mines_gte', 50, 'blue-500', 'blue-600', 2),
  ('miner_dedicado', 'Dedicado', 'Racha de 7 días', '🔥', 'mining', 'current_streak_gte', 7, 'orange-500', 'red-500', 3),
  ('miner_veterano', 'Veterano', 'Racha de 30 días', '🔥', 'mining', 'current_streak_gte', 30, 'orange-600', 'red-600', 4),
  ('miner_legendario', 'Legendario', 'Racha de 100 días', '🔥', 'mining', 'current_streak_gte', 100, 'yellow-500', 'orange-500', 5),
  ('miner_maestro', 'Maestro', '1000 minadas completadas', '💎', 'mining', 'total_mines_gte', 1000, 'purple-500', 'pink-500', 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value;

-- COLECCIÓN
INSERT INTO badge_definitions (id, name, description, icon, category, requirement_type, requirement_value, color_from, color_to, display_order)
VALUES
  ('collector_1', 'Coleccionista', '1 Meme NFT', '🖼️', 'collection', 'meme_count_gte', 1, 'pink-400', 'purple-400', 10),
  ('collector_5', 'Entusiasta', '5 Meme NFTs', '🖼️', 'collection', 'meme_count_gte', 5, 'pink-500', 'purple-500', 11),
  ('collector_10', 'Aficionado', '10 Meme NFTs', '🖼️', 'collection', 'meme_count_gte', 10, 'pink-600', 'purple-600', 12),
  ('collector_20', 'Experto', '20 Meme NFTs', '🖼️', 'collection', 'meme_count_gte', 20, 'fuchsia-500', 'purple-600', 13),
  ('archivista', 'Archivista', 'Todos los Meme NFTs', '🏛️', 'collection', 'meme_count_all', NULL, 'amber-400', 'yellow-500', 14)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value;

-- ESPECIALES
INSERT INTO badge_definitions (id, name, description, icon, category, requirement_type, requirement_value, color_from, color_to, display_order)
VALUES
  ('og', 'OG', 'Miembro fundador', '👑', 'special', 'has_pass', NULL, 'yellow-500', 'orange-500', 50),
  ('early_adopter', 'Early Adopter', 'Registrado en el primer mes', '🌟', 'special', 'registered_before', NULL, 'cyan-400', 'blue-500', 51),
  ('millonario', 'Millonario', '1,000,000 puntos lifetime', '💰', 'special', 'lifetime_points_gte', 1000000, 'green-400', 'emerald-500', 52)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value;

-- =====================================================
-- 5. INSERTAR BADGE DEFINITIONS - FASE 2 (Preparadas)
-- =====================================================

-- COMUNIDAD (requieren sistema de referidos)
INSERT INTO badge_definitions (id, name, description, icon, category, requirement_type, requirement_value, color_from, color_to, is_active, display_order)
VALUES
  ('referrer_1', 'Reclutador', '1 referido activo', '👥', 'community', 'referrals_gte', 1, 'teal-400', 'cyan-500', false, 20),
  ('referrer_5', 'Networker', '5 referidos activos', '👥', 'community', 'referrals_gte', 5, 'teal-500', 'cyan-600', false, 21),
  ('referrer_10', 'Embajador', '10 referidos activos', '👥', 'community', 'referrals_gte', 10, 'teal-600', 'cyan-700', false, 22),
  ('referrer_25', 'Líder', '25 referidos activos', '👥', 'community', 'referrals_gte', 25, 'emerald-500', 'teal-600', false, 23),
  ('referrer_50', 'Fundador', '50+ referidos activos', '🏆', 'community', 'referrals_gte', 50, 'emerald-600', 'teal-700', false, 24)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ENGAGEMENT (requieren contadores de comentarios/votos)
INSERT INTO badge_definitions (id, name, description, icon, category, requirement_type, requirement_value, color_from, color_to, is_active, display_order)
VALUES
  ('commenter_50', 'Comentarista', '50 comentarios', '💬', 'engagement', 'comments_gte', 50, 'sky-400', 'blue-500', false, 30),
  ('commenter_200', 'Crítico', '200 comentarios', '💬', 'engagement', 'comments_gte', 200, 'sky-500', 'blue-600', false, 31),
  ('voter_100', 'Votante', '100 votos', '👍', 'engagement', 'votes_gte', 100, 'indigo-400', 'violet-500', false, 32),
  ('voter_500', 'Juez', '500 votos', '⚖️', 'engagement', 'votes_gte', 500, 'indigo-500', 'violet-600', false, 33),
  ('influencer', 'Influencer', '1000 interacciones', '⭐', 'engagement', 'interactions_gte', 1000, 'rose-500', 'pink-600', false, 34)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- COMPETICIÓN (requieren proceso de fin de temporada)
INSERT INTO badge_definitions (id, name, description, icon, category, requirement_type, requirement_value, color_from, color_to, is_active, display_order)
VALUES
  ('top_100', 'Top 100', 'Terminar en top 100', '🏅', 'competition', 'season_rank_lte', 100, 'amber-400', 'yellow-500', false, 40),
  ('top_50', 'Top 50', 'Terminar en top 50', '🏅', 'competition', 'season_rank_lte', 50, 'amber-500', 'orange-500', false, 41),
  ('top_10', 'Top 10', 'Terminar en top 10', '🥉', 'competition', 'season_rank_lte', 10, 'orange-500', 'red-500', false, 42),
  ('podio', 'Podio', 'Terminar en top 3', '🥈', 'competition', 'season_rank_lte', 3, 'slate-300', 'slate-400', false, 43),
  ('campeon', 'Campeón', 'Terminar #1 de temporada', '🥇', 'competition', 'season_rank_lte', 1, 'yellow-400', 'amber-500', false, 44),
  ('multicampeon', 'Multicampeón', '#1 en 3+ temporadas', '👑', 'competition', 'championships_gte', 3, 'yellow-500', 'orange-600', false, 45)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ESPECIALES (requieren sistemas adicionales)
INSERT INTO badge_definitions (id, name, description, icon, category, requirement_type, requirement_value, color_from, color_to, is_active, display_order)
VALUES
  ('afortunado', 'Afortunado', 'Ganador de lotería', '🍀', 'special', 'lottery_winner', NULL, 'green-400', 'emerald-500', false, 53),
  ('bug_hunter', 'Bug Hunter', 'Reportó bug válido', '🐛', 'special', 'manual', NULL, 'red-400', 'orange-500', false, 54)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- badge_definitions: lectura pública
CREATE POLICY "Badge definitions viewable by everyone" ON badge_definitions
  FOR SELECT USING (true);

-- user_badges: lectura pública, inserción por servicio
CREATE POLICY "User badges viewable by everyone" ON user_badges
  FOR SELECT USING (true);

CREATE POLICY "Service can insert badges" ON user_badges
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 7. FUNCIÓN: Verificar y otorgar badges
-- =====================================================

CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS TABLE(badge_id VARCHAR(50), badge_name VARCHAR(100), newly_awarded BOOLEAN) AS $$
DECLARE
  v_user RECORD;
  v_badge RECORD;
  v_total_memes INTEGER;
  v_already_has BOOLEAN;
BEGIN
  -- Obtener datos del usuario
  SELECT * INTO v_user FROM mining_users WHERE id = p_user_id;

  IF v_user IS NULL THEN
    RETURN;
  END IF;

  -- Obtener total de memes publicados (para badge Archivista)
  -- TODO: Obtener de una tabla de configuración o memes
  v_total_memes := 10; -- Placeholder, ajustar según memes publicados

  -- Iterar sobre badges activos
  FOR v_badge IN
    SELECT * FROM badge_definitions WHERE is_active = true
  LOOP
    -- Verificar si ya tiene el badge
    SELECT EXISTS(
      SELECT 1 FROM user_badges
      WHERE user_id = p_user_id AND badge_id = v_badge.id
    ) INTO v_already_has;

    IF v_already_has THEN
      badge_id := v_badge.id;
      badge_name := v_badge.name;
      newly_awarded := false;
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Verificar requisitos según tipo
    CASE v_badge.requirement_type
      WHEN 'lifetime_points_gte' THEN
        IF v_user.lifetime_points >= v_badge.requirement_value THEN
          INSERT INTO user_badges (user_id, badge_id, earned_value)
          VALUES (p_user_id, v_badge.id, v_user.lifetime_points);
          badge_id := v_badge.id;
          badge_name := v_badge.name;
          newly_awarded := true;
          RETURN NEXT;
        END IF;

      WHEN 'current_streak_gte' THEN
        IF v_user.current_streak >= v_badge.requirement_value THEN
          INSERT INTO user_badges (user_id, badge_id, earned_value)
          VALUES (p_user_id, v_badge.id, v_user.current_streak);
          badge_id := v_badge.id;
          badge_name := v_badge.name;
          newly_awarded := true;
          RETURN NEXT;
        END IF;

      WHEN 'total_mines_gte' THEN
        IF v_user.total_mines >= v_badge.requirement_value THEN
          INSERT INTO user_badges (user_id, badge_id, earned_value)
          VALUES (p_user_id, v_badge.id, v_user.total_mines);
          badge_id := v_badge.id;
          badge_name := v_badge.name;
          newly_awarded := true;
          RETURN NEXT;
        END IF;

      WHEN 'meme_count_gte' THEN
        IF v_user.cached_meme_count >= v_badge.requirement_value THEN
          INSERT INTO user_badges (user_id, badge_id, earned_value)
          VALUES (p_user_id, v_badge.id, v_user.cached_meme_count);
          badge_id := v_badge.id;
          badge_name := v_badge.name;
          newly_awarded := true;
          RETURN NEXT;
        END IF;

      WHEN 'meme_count_all' THEN
        IF v_user.cached_meme_count >= v_total_memes AND v_total_memes > 0 THEN
          INSERT INTO user_badges (user_id, badge_id, earned_value)
          VALUES (p_user_id, v_badge.id, v_user.cached_meme_count);
          badge_id := v_badge.id;
          badge_name := v_badge.name;
          newly_awarded := true;
          RETURN NEXT;
        END IF;

      WHEN 'has_pass' THEN
        IF v_user.cached_has_pass = true THEN
          INSERT INTO user_badges (user_id, badge_id)
          VALUES (p_user_id, v_badge.id);
          badge_id := v_badge.id;
          badge_name := v_badge.name;
          newly_awarded := true;
          RETURN NEXT;
        END IF;

      ELSE
        -- Otros tipos de requisitos se manejarán en el futuro
        NULL;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. FUNCIÓN: Obtener badges de usuario
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_badges(p_user_id UUID)
RETURNS TABLE(
  badge_id VARCHAR(50),
  name VARCHAR(100),
  description TEXT,
  icon VARCHAR(10),
  category VARCHAR(30),
  color_from VARCHAR(30),
  color_to VARCHAR(30),
  earned_at TIMESTAMP WITH TIME ZONE,
  unlocked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bd.id as badge_id,
    bd.name,
    bd.description,
    bd.icon,
    bd.category,
    bd.color_from,
    bd.color_to,
    ub.earned_at,
    (ub.id IS NOT NULL) as unlocked
  FROM badge_definitions bd
  LEFT JOIN user_badges ub ON ub.badge_id = bd.id AND ub.user_id = p_user_id
  WHERE bd.is_active = true
  ORDER BY bd.display_order;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DEL SCHEMA DE BADGES
-- =====================================================
