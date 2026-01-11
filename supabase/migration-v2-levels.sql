-- =============================================
-- MIGRATION: V2 - Levels & Free Mining System
-- Archive of Meme - Auto-sustainable Model
--
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add spent_points column to track spending
ALTER TABLE mining_users
ADD COLUMN IF NOT EXISTS spent_points BIGINT DEFAULT 0;

-- 2. Add comment for documentation
COMMENT ON COLUMN mining_users.spent_points IS 'Total points spent on upgrades, boosts, etc. Available points = lifetime_points - spent_points';

-- 3. Drop existing view first (required to change columns)
DROP VIEW IF EXISTS mining_leaderboard;

-- 4. Recreate leaderboard view with level calculation
CREATE VIEW mining_leaderboard AS
SELECT
  wallet,
  season_points,
  lifetime_points,
  COALESCE(spent_points, 0) as spent_points,
  (lifetime_points - COALESCE(spent_points, 0)) as available_points,
  current_streak,
  cached_miner_level,
  -- Calculate level based on lifetime_points
  CASE
    WHEN lifetime_points >= 500000 THEN 'Legend'
    WHEN lifetime_points >= 100000 THEN 'Diamond'
    WHEN lifetime_points >= 20000 THEN 'Platinum'
    WHEN lifetime_points >= 5000 THEN 'Gold'
    WHEN lifetime_points >= 1000 THEN 'Silver'
    ELSE 'Bronze'
  END as level,
  RANK() OVER (ORDER BY season_points DESC) as rank
FROM mining_users
WHERE lifetime_points > 0
ORDER BY season_points DESC;

-- 5. Create index for available points calculation (optional optimization)
CREATE INDEX IF NOT EXISTS idx_mining_users_available_points
ON mining_users((lifetime_points - COALESCE(spent_points, 0)) DESC);

-- 6. Verify the changes
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'mining_users'
  AND column_name IN ('spent_points', 'lifetime_points');
