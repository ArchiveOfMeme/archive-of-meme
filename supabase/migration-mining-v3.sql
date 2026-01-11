-- =============================================
-- MIGRACIÓN: Mining System V3 (Session-based)
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Agregar columnas para sesiones de minado
ALTER TABLE mining_users
ADD COLUMN IF NOT EXISTS mining_session_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE mining_users
ADD COLUMN IF NOT EXISTS mining_session_earning_rate DECIMAL(10,8) DEFAULT NULL;

ALTER TABLE mining_users
ADD COLUMN IF NOT EXISTS mining_session_total_points DECIMAL(10,2) DEFAULT NULL;

ALTER TABLE mining_users
ADD COLUMN IF NOT EXISTS last_session_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE mining_users
ADD COLUMN IF NOT EXISTS spent_points BIGINT DEFAULT 0;

-- Índice para sesiones activas (útil para queries)
CREATE INDEX IF NOT EXISTS idx_mining_users_active_session
ON mining_users(mining_session_started_at)
WHERE mining_session_started_at IS NOT NULL;

-- Comentario: Las nuevas columnas son:
-- mining_session_started_at: Timestamp cuando inició la sesión actual. NULL = sin sesión
-- mining_session_earning_rate: Puntos por segundo calculados al iniciar sesión
-- mining_session_total_points: Total de puntos que ganará en 4h (para mostrar en UI)
-- last_session_started_at: Para calcular streak basado en inicio de sesión
-- spent_points: Puntos gastados en la tienda
