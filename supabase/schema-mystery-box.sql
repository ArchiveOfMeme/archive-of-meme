-- =============================================
-- SCHEMA: Mystery Box System
-- Archive of Meme - V2 Auto-sustainable Model
--
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add Mystery Box item to shop_items
INSERT INTO shop_items (id, name, description, category, cost_points, effect_type, effect_value, duration_hours, min_level, icon, sort_order)
VALUES (
  'mystery_box',
  'Mystery Box',
  'Open for a chance to win points, boosts, or rare badges!',
  'mystery',
  500,
  'mystery_box',
  1,
  NULL,
  'Gold',
  '🎁',
  20
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cost_points = EXCLUDED.cost_points,
  min_level = EXCLUDED.min_level;

-- 2. TABLE: mystery_box_history (track all openings)
CREATE TABLE IF NOT EXISTS mystery_box_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES mining_users(id) ON DELETE CASCADE,

  -- Result
  prize_type VARCHAR(30) NOT NULL, -- 'points', 'boost', 'badge', 'jackpot'
  prize_value INT, -- points amount or boost multiplier
  prize_description TEXT,

  -- Roll info (for transparency)
  roll_number INT NOT NULL, -- 1-100

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mystery_box_user ON mystery_box_history(user_id);
CREATE INDEX IF NOT EXISTS idx_mystery_box_date ON mystery_box_history(created_at DESC);

-- 3. RLS for mystery_box_history
ALTER TABLE mystery_box_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mystery box history viewable by everyone" ON mystery_box_history
  FOR SELECT USING (true);

CREATE POLICY "Mystery box history insertable" ON mystery_box_history
  FOR INSERT WITH CHECK (true);

-- 4. Add "Lucky" badge to badge_definitions (if not exists)
INSERT INTO badge_definitions (id, name, description, icon, category, requirement_type, requirement_value, color_from, color_to, display_order, is_active)
VALUES (
  'lucky',
  'Lucky',
  'Won the Lucky badge from a Mystery Box',
  '🍀',
  'special',
  'mystery_box_lucky',
  1,
  '#10B981',
  '#34D399',
  50,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 5. Add "Jackpot" badge for big winners
INSERT INTO badge_definitions (id, name, description, icon, category, requirement_type, requirement_value, color_from, color_to, display_order, is_active)
VALUES (
  'jackpot',
  'Jackpot Winner',
  'Hit the jackpot in a Mystery Box!',
  '💰',
  'special',
  'mystery_box_jackpot',
  1,
  '#F59E0B',
  '#FBBF24',
  51,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 6. View: User mystery box stats
CREATE OR REPLACE VIEW user_mystery_box_stats AS
SELECT
  user_id,
  COUNT(*) as total_opened,
  SUM(CASE WHEN prize_type = 'points' THEN prize_value ELSE 0 END) as total_points_won,
  SUM(CASE WHEN prize_type = 'jackpot' THEN 1 ELSE 0 END) as jackpots_hit,
  MAX(prize_value) FILTER (WHERE prize_type IN ('points', 'jackpot')) as biggest_win
FROM mystery_box_history
GROUP BY user_id;
