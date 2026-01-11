-- =============================================
-- SCHEMA: Cosmetics System
-- Archive of Meme - V2 Auto-sustainable Model
--
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. TABLE: user_cosmetics (owned cosmetics and equipped status)
CREATE TABLE IF NOT EXISTS user_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES mining_users(id) ON DELETE CASCADE,
  item_id VARCHAR(50) NOT NULL REFERENCES shop_items(id),

  -- Status
  is_equipped BOOLEAN DEFAULT false,

  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user ON user_cosmetics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_equipped ON user_cosmetics(user_id, is_equipped) WHERE is_equipped = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_cosmetics_unique ON user_cosmetics(user_id, item_id);

-- RLS
ALTER TABLE user_cosmetics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User cosmetics viewable by everyone" ON user_cosmetics
  FOR SELECT USING (true);

CREATE POLICY "User cosmetics insertable" ON user_cosmetics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "User cosmetics updatable" ON user_cosmetics
  FOR UPDATE USING (true);

-- 2. Add equipped_frame and equipped_name_color to mining_users
ALTER TABLE mining_users
ADD COLUMN IF NOT EXISTS equipped_frame VARCHAR(50),
ADD COLUMN IF NOT EXISTS equipped_name_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS equipped_badge VARCHAR(50);

-- 3. INSERT COSMETIC ITEMS INTO shop_items
INSERT INTO shop_items (id, name, description, category, cost_points, effect_type, effect_value, duration_hours, min_level, max_purchases, icon, sort_order) VALUES

-- Purchasable Badges
('badge_early_miner', 'Early Miner Badge', 'Show your dedication as an early adopter', 'cosmetic', 500, 'badge', 1, NULL, NULL, 1, '⛏️', 30),
('badge_dedicated', 'Dedicated Badge', 'For the truly committed miners', 'cosmetic', 1000, 'badge', 1, NULL, 'Silver', 1, '💪', 31),
('badge_diamond_hands', 'Diamond Hands Badge', 'You never give up', 'cosmetic', 2500, 'badge', 1, NULL, 'Platinum', 1, '💎', 32),
('badge_whale', 'Whale Badge', 'A true whale of the community', 'cosmetic', 10000, 'badge', 1, NULL, 'Diamond', 1, '🐋', 33),

-- Profile Frames
('frame_bronze', 'Bronze Frame', 'A simple bronze frame for your profile', 'cosmetic', 500, 'frame', 1, NULL, 'Silver', 1, '🖼️', 40),
('frame_silver', 'Silver Frame', 'A shiny silver frame', 'cosmetic', 1000, 'frame', 1, NULL, 'Gold', 1, '🪞', 41),
('frame_gold', 'Gold Frame', 'A prestigious gold frame', 'cosmetic', 2000, 'frame', 1, NULL, 'Platinum', 1, '🏅', 42),
('frame_diamond', 'Diamond Frame', 'The ultimate diamond frame with sparkle effect', 'cosmetic', 5000, 'frame', 1, NULL, 'Diamond', 1, '💠', 43),

-- Name Colors
('color_green', 'Green Name', 'Display your name in green', 'cosmetic', 1000, 'name_color', 1, NULL, 'Gold', 1, '🟢', 50),
('color_blue', 'Blue Name', 'Display your name in blue', 'cosmetic', 1000, 'name_color', 1, NULL, 'Gold', 1, '🔵', 51),
('color_purple', 'Purple Name', 'Display your name in purple', 'cosmetic', 1500, 'name_color', 1, NULL, 'Platinum', 1, '🟣', 52),
('color_gold', 'Gold Name', 'Display your name in gold', 'cosmetic', 2500, 'name_color', 1, NULL, 'Diamond', 1, '🟡', 53),
('color_rainbow', 'Rainbow Name', 'Display your name with rainbow gradient', 'cosmetic', 5000, 'name_color', 1, NULL, 'Legend', 1, '🌈', 54)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cost_points = EXCLUDED.cost_points,
  min_level = EXCLUDED.min_level;

-- 4. View: User equipped cosmetics
CREATE OR REPLACE VIEW user_equipped_cosmetics AS
SELECT
  mu.id as user_id,
  mu.wallet,
  mu.equipped_frame,
  mu.equipped_name_color,
  mu.equipped_badge,
  sf.icon as frame_icon,
  sf.name as frame_name,
  sc.icon as color_icon,
  sc.name as color_name,
  sb.icon as badge_icon,
  sb.name as badge_name
FROM mining_users mu
LEFT JOIN shop_items sf ON mu.equipped_frame = sf.id
LEFT JOIN shop_items sc ON mu.equipped_name_color = sc.id
LEFT JOIN shop_items sb ON mu.equipped_badge = sb.id;
