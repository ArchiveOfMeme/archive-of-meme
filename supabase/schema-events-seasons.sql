-- =============================================
-- SCHEMA: EVENTOS Y TEMPORADAS
-- Archive of Meme - Enero 2026
-- =============================================

-- =============================================
-- TABLA: EVENTOS
-- =============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  type VARCHAR(20) NOT NULL CHECK (type IN ('weekly', 'anniversary', 'special')),
  multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.5, -- 1.5 = +50%, 2.0 = x2
  icon VARCHAR(10) DEFAULT '🎉',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  meme_id INTEGER, -- Para eventos de aniversario, referencia al meme
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'system' -- 'system' o 'admin'
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

-- =============================================
-- TABLA: TEMPORADAS
-- =============================================
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL, -- 'Genesis', 'Season 2', etc.
  description VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
  min_users_to_start INTEGER DEFAULT 100,
  nft_collection_url VARCHAR(255), -- URL a la colección de NFTs de la temporada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: PARTICIPANTES DE TEMPORADA
-- =============================================
CREATE TABLE IF NOT EXISTS season_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES mining_users(id) ON DELETE CASCADE,
  season_points BIGINT DEFAULT 0, -- Puntos ganados en esta temporada
  final_rank INTEGER, -- Ranking al finalizar (NULL si temporada activa)
  prize_claimed BOOLEAN DEFAULT false,
  prize_multiplier DECIMAL(3,2) DEFAULT 1.0, -- 1.15 = +15% para siguiente temporada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(season_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_season_participants_season ON season_participants(season_id);
CREATE INDEX IF NOT EXISTS idx_season_participants_user ON season_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_season_participants_points ON season_participants(season_id, season_points DESC);

-- =============================================
-- AÑADIR CAMPO season_multiplier A mining_users
-- (bonus acumulado de temporadas anteriores)
-- =============================================
ALTER TABLE mining_users
ADD COLUMN IF NOT EXISTS season_multiplier DECIMAL(3,2) DEFAULT 1.0;

-- =============================================
-- FUNCIÓN: Obtener evento activo con mayor multiplicador
-- =============================================
CREATE OR REPLACE FUNCTION get_active_event_multiplier()
RETURNS TABLE(
  event_id UUID,
  event_name VARCHAR(100),
  multiplier DECIMAL(3,2),
  icon VARCHAR(10),
  ends_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.multiplier,
    e.icon,
    e.end_date
  FROM events e
  WHERE e.is_active = true
    AND NOW() >= e.start_date
    AND NOW() <= e.end_date
  ORDER BY e.multiplier DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Obtener todos los eventos activos
-- =============================================
CREATE OR REPLACE FUNCTION get_all_active_events()
RETURNS TABLE(
  event_id UUID,
  event_name VARCHAR(100),
  event_type VARCHAR(20),
  multiplier DECIMAL(3,2),
  icon VARCHAR(10),
  description VARCHAR(255),
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.type,
    e.multiplier,
    e.icon,
    e.description,
    e.start_date,
    e.end_date
  FROM events e
  WHERE e.is_active = true
    AND NOW() >= e.start_date
    AND NOW() <= e.end_date
  ORDER BY e.multiplier DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Crear Meme Monday automático
-- Ejecutar cada domingo a las 23:00 UTC
-- =============================================
CREATE OR REPLACE FUNCTION create_meme_monday()
RETURNS UUID AS $$
DECLARE
  new_event_id UUID;
  next_monday TIMESTAMP WITH TIME ZONE;
  monday_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calcular próximo lunes a las 00:00 UTC
  next_monday := date_trunc('week', NOW() + INTERVAL '1 week');
  monday_end := next_monday + INTERVAL '24 hours';

  -- Verificar si ya existe un Meme Monday para esa fecha
  SELECT id INTO new_event_id
  FROM events
  WHERE type = 'weekly'
    AND name = 'Meme Monday'
    AND DATE(start_date) = DATE(next_monday);

  IF new_event_id IS NOT NULL THEN
    RETURN new_event_id; -- Ya existe
  END IF;

  -- Crear el evento
  INSERT INTO events (name, description, type, multiplier, icon, start_date, end_date, created_by)
  VALUES (
    'Meme Monday',
    'Every Monday: +50% mining points!',
    'weekly',
    1.5,
    '🚀',
    next_monday,
    monday_end,
    'system'
  )
  RETURNING id INTO new_event_id;

  RETURN new_event_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Crear evento de aniversario de meme
-- =============================================
CREATE OR REPLACE FUNCTION create_meme_anniversary(
  p_meme_id INTEGER,
  p_meme_name VARCHAR(100),
  p_anniversary_date DATE
)
RETURNS UUID AS $$
DECLARE
  new_event_id UUID;
  event_start TIMESTAMP WITH TIME ZONE;
  event_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- El evento dura 24 horas desde las 00:00 UTC de la fecha
  event_start := p_anniversary_date::TIMESTAMP AT TIME ZONE 'UTC';
  event_end := event_start + INTERVAL '24 hours';

  -- Verificar si ya existe
  SELECT id INTO new_event_id
  FROM events
  WHERE type = 'anniversary'
    AND meme_id = p_meme_id
    AND DATE(start_date) = p_anniversary_date;

  IF new_event_id IS NOT NULL THEN
    RETURN new_event_id;
  END IF;

  -- Crear el evento
  INSERT INTO events (name, description, type, multiplier, icon, start_date, end_date, meme_id, created_by)
  VALUES (
    p_meme_name || ' Anniversary',
    'Celebrating ' || p_meme_name || '! Double points today!',
    'anniversary',
    2.0,
    '🎂',
    event_start,
    event_end,
    p_meme_id,
    'system'
  )
  RETURNING id INTO new_event_id;

  RETURN new_event_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Obtener temporada activa
-- =============================================
CREATE OR REPLACE FUNCTION get_active_season()
RETURNS TABLE(
  season_id INTEGER,
  season_name VARCHAR(50),
  start_date DATE,
  end_date DATE,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.start_date,
    s.end_date,
    (s.end_date - CURRENT_DATE)::INTEGER
  FROM seasons s
  WHERE s.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Registrar puntos de temporada
-- Se llama cada vez que un usuario mina
-- =============================================
CREATE OR REPLACE FUNCTION add_season_points(
  p_user_id UUID,
  p_points BIGINT
)
RETURNS VOID AS $$
DECLARE
  active_season_id INTEGER;
BEGIN
  -- Obtener temporada activa
  SELECT id INTO active_season_id FROM seasons WHERE status = 'active' LIMIT 1;

  IF active_season_id IS NULL THEN
    RETURN; -- No hay temporada activa
  END IF;

  -- Insertar o actualizar participación
  INSERT INTO season_participants (season_id, user_id, season_points)
  VALUES (active_season_id, p_user_id, p_points)
  ON CONFLICT (season_id, user_id)
  DO UPDATE SET
    season_points = season_participants.season_points + p_points,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Obtener leaderboard de temporada
-- =============================================
CREATE OR REPLACE FUNCTION get_season_leaderboard(
  p_season_id INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
  rank BIGINT,
  user_id UUID,
  wallet VARCHAR(42),
  level VARCHAR(20),
  season_points BIGINT
) AS $$
DECLARE
  target_season_id INTEGER;
BEGIN
  -- Si no se especifica, usar temporada activa
  IF p_season_id IS NULL THEN
    SELECT id INTO target_season_id FROM seasons WHERE status = 'active' LIMIT 1;
  ELSE
    target_season_id := p_season_id;
  END IF;

  IF target_season_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY sp.season_points DESC) as rank,
    sp.user_id,
    mu.wallet,
    mu.level,
    sp.season_points
  FROM season_participants sp
  JOIN mining_users mu ON mu.id = sp.user_id
  WHERE sp.season_id = target_season_id
  ORDER BY sp.season_points DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Finalizar temporada y asignar premios
-- =============================================
CREATE OR REPLACE FUNCTION end_season(p_season_id INTEGER)
RETURNS VOID AS $$
DECLARE
  participant RECORD;
  rank_counter INTEGER := 0;
BEGIN
  -- Actualizar rankings finales
  FOR participant IN
    SELECT sp.id, sp.user_id, sp.season_points
    FROM season_participants sp
    WHERE sp.season_id = p_season_id
    ORDER BY sp.season_points DESC
  LOOP
    rank_counter := rank_counter + 1;

    -- Asignar ranking y multiplicador según posición
    UPDATE season_participants
    SET
      final_rank = rank_counter,
      prize_multiplier = CASE
        WHEN rank_counter = 1 THEN 1.15  -- Top 1: +15%
        WHEN rank_counter <= 3 THEN 1.10  -- Top 2-3: +10%
        WHEN rank_counter <= 10 THEN 1.05 -- Top 4-10: +5%
        ELSE 1.0
      END
    WHERE id = participant.id;

    -- Actualizar season_multiplier del usuario (para siguiente temporada)
    IF rank_counter <= 10 THEN
      UPDATE mining_users
      SET season_multiplier = CASE
        WHEN rank_counter = 1 THEN 1.15
        WHEN rank_counter <= 3 THEN 1.10
        ELSE 1.05
      END
      WHERE id = participant.user_id;
    END IF;
  END LOOP;

  -- Marcar temporada como finalizada
  UPDATE seasons SET status = 'ended' WHERE id = p_season_id;

  -- Resetear season_points en mining_users
  UPDATE mining_users SET season_points = 0;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Verificar y activar Season 1
-- =============================================
CREATE OR REPLACE FUNCTION check_and_start_season_one()
RETURNS BOOLEAN AS $$
DECLARE
  user_count INTEGER;
  season_exists BOOLEAN;
  first_of_month DATE;
BEGIN
  -- Verificar si ya existe alguna temporada activa o Season 1
  SELECT EXISTS(SELECT 1 FROM seasons WHERE status IN ('active', 'ended')) INTO season_exists;

  IF season_exists THEN
    RETURN FALSE;
  END IF;

  -- Contar usuarios que han minado al menos una vez
  SELECT COUNT(*) INTO user_count FROM mining_users WHERE total_mines > 0;

  IF user_count < 100 THEN
    RETURN FALSE;
  END IF;

  -- Calcular primer día del próximo mes
  first_of_month := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')::DATE;

  -- Crear Season 1 "Genesis"
  INSERT INTO seasons (name, description, start_date, end_date, status)
  VALUES (
    'Genesis',
    'The first season of Archive of Meme! Compete for exclusive rewards.',
    first_of_month,
    first_of_month + INTERVAL '3 months',
    'pending'
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Activar temporada pendiente si es fecha
-- =============================================
CREATE OR REPLACE FUNCTION activate_pending_season()
RETURNS BOOLEAN AS $$
DECLARE
  pending_season RECORD;
BEGIN
  SELECT * INTO pending_season
  FROM seasons
  WHERE status = 'pending' AND start_date <= CURRENT_DATE
  LIMIT 1;

  IF pending_season.id IS NOT NULL THEN
    UPDATE seasons SET status = 'active' WHERE id = pending_season.id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Finalizar temporada si terminó
-- =============================================
CREATE OR REPLACE FUNCTION check_and_end_season()
RETURNS BOOLEAN AS $$
DECLARE
  active_season RECORD;
BEGIN
  SELECT * INTO active_season
  FROM seasons
  WHERE status = 'active' AND end_date <= CURRENT_DATE
  LIMIT 1;

  IF active_season.id IS NOT NULL THEN
    PERFORM end_season(active_season.id);
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Crear evento especial (para admin)
-- =============================================
CREATE OR REPLACE FUNCTION create_special_event(
  p_name VARCHAR(100),
  p_description VARCHAR(255),
  p_multiplier DECIMAL(3,2),
  p_icon VARCHAR(10),
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS UUID AS $$
DECLARE
  new_event_id UUID;
BEGIN
  INSERT INTO events (name, description, type, multiplier, icon, start_date, end_date, created_by)
  VALUES (p_name, p_description, 'special', p_multiplier, p_icon, p_start_date, p_end_date, 'admin')
  RETURNING id INTO new_event_id;

  RETURN new_event_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =============================================
COMMENT ON TABLE events IS 'Eventos especiales con multiplicadores de puntos';
COMMENT ON TABLE seasons IS 'Temporadas de competición (3 meses cada una)';
COMMENT ON TABLE season_participants IS 'Participación y ranking de usuarios en temporadas';
COMMENT ON COLUMN mining_users.season_multiplier IS 'Multiplicador bonus por ganar temporadas anteriores (Top 1: 1.15, Top 2-3: 1.10, Top 4-10: 1.05)';
