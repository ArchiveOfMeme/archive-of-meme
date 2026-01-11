-- =============================================
-- SCHEMA: Shop & Boosts System
-- Archive of Meme - V2 Auto-sustainable Model
--
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. TABLE: shop_items (item definitions)
CREATE TABLE IF NOT EXISTS shop_items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL, -- 'boost', 'cosmetic', 'utility'

  -- Pricing
  cost_points INT NOT NULL,

  -- Effect
  effect_type VARCHAR(30) NOT NULL, -- 'mining_multiplier', 'skip_cooldown', 'streak_shield', etc.
  effect_value DECIMAL(5,2), -- e.g., 1.5 for +50%, 2.0 for +100%
  duration_hours INT, -- NULL for permanent or one-time use

  -- Requirements
  min_level VARCHAR(20), -- NULL = no requirement
  max_purchases INT, -- NULL = unlimited, 1 = one-time

  -- Display
  icon VARCHAR(10),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE: user_boosts (active boosts)
CREATE TABLE IF NOT EXISTS user_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES mining_users(id) ON DELETE CASCADE,
  item_id VARCHAR(50) NOT NULL REFERENCES shop_items(id),

  -- Boost details
  effect_type VARCHAR(30) NOT NULL,
  effect_value DECIMAL(5,2) NOT NULL,

  -- Timing
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL for one-time use items
  used_at TIMESTAMP WITH TIME ZONE, -- When one-time item was used

  is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_boosts_user ON user_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_boosts_active ON user_boosts(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_boosts_expires ON user_boosts(expires_at) WHERE expires_at IS NOT NULL;

-- 3. TABLE: shop_transactions (purchase history)
CREATE TABLE IF NOT EXISTS shop_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES mining_users(id) ON DELETE CASCADE,
  item_id VARCHAR(50) NOT NULL REFERENCES shop_items(id),

  points_spent INT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_tx_user ON shop_transactions(user_id);

-- =============================================
-- INSERT DEFAULT SHOP ITEMS
-- =============================================

INSERT INTO shop_items (id, name, description, category, cost_points, effect_type, effect_value, duration_hours, icon, sort_order) VALUES
-- Boosts temporales
('boost_1_5x', 'Boost x1.5', '+50% mining points for 24 hours', 'boost', 200, 'mining_multiplier', 1.5, 24, '🚀', 1),
('boost_2x', 'Boost x2', '+100% mining points for 24 hours', 'boost', 500, 'mining_multiplier', 2.0, 24, '⚡', 2),

-- Utilidades (one-time use)
('skip_cooldown', 'Skip Cooldown', 'Mine immediately without waiting', 'utility', 400, 'skip_cooldown', 1, NULL, '⏭️', 10),
('streak_shield', 'Streak Shield', 'Protect your streak once', 'utility', 1000, 'streak_shield', 1, NULL, '🛡️', 11)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cost_points = EXCLUDED.cost_points,
  effect_value = EXCLUDED.effect_value,
  duration_hours = EXCLUDED.duration_hours;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_transactions ENABLE ROW LEVEL SECURITY;

-- Shop items: everyone can view
CREATE POLICY "Shop items viewable by everyone" ON shop_items
  FOR SELECT USING (true);

-- User boosts: viewable and insertable
CREATE POLICY "User boosts viewable by everyone" ON user_boosts
  FOR SELECT USING (true);

CREATE POLICY "User boosts insertable" ON user_boosts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "User boosts updatable" ON user_boosts
  FOR UPDATE USING (true);

-- Shop transactions
CREATE POLICY "Shop transactions viewable" ON shop_transactions
  FOR SELECT USING (true);

CREATE POLICY "Shop transactions insertable" ON shop_transactions
  FOR INSERT WITH CHECK (true);

-- =============================================
-- HELPER FUNCTION: Get active boost multiplier
-- =============================================

CREATE OR REPLACE FUNCTION get_user_boost_multiplier(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_multiplier DECIMAL := 1.0;
  v_boost RECORD;
BEGIN
  -- Find the best active mining multiplier boost
  SELECT effect_value INTO v_multiplier
  FROM user_boosts
  WHERE user_id = p_user_id
    AND effect_type = 'mining_multiplier'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY effect_value DESC
  LIMIT 1;

  RETURN COALESCE(v_multiplier, 1.0);
END;
$$ LANGUAGE plpgsql;
