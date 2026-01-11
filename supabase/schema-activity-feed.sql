-- =============================================
-- SCHEMA: Activity Feed System
-- Archive of Meme - V2 Auto-sustainable Model
--
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. TABLE: activity_feed (public activity events)
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who
  user_id UUID REFERENCES mining_users(id) ON DELETE CASCADE,
  wallet VARCHAR(42),

  -- What
  event_type VARCHAR(30) NOT NULL,
  -- Types: 'mining', 'jackpot', 'boost_purchase', 'cosmetic_purchase',
  --        'mystery_box', 'level_up', 'badge_earned', 'referral_joined'

  -- Details
  event_data JSONB DEFAULT '{}',
  -- Examples:
  -- mining: {"points": 150, "minerLevel": "Pro"}
  -- jackpot: {"points": 2500, "roll": 99}
  -- boost_purchase: {"item": "Boost x2", "icon": "⚡"}
  -- level_up: {"newLevel": "Gold", "icon": "🥇"}
  -- badge_earned: {"badge": "Lucky", "icon": "🍀"}

  points_amount INT, -- For quick filtering/display

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);

-- RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity feed viewable by everyone" ON activity_feed
  FOR SELECT USING (true);

CREATE POLICY "Activity feed insertable" ON activity_feed
  FOR INSERT WITH CHECK (true);

-- 2. VIEW: Recent activity with formatted data
CREATE OR REPLACE VIEW recent_activity AS
SELECT
  af.id,
  af.wallet,
  CONCAT(LEFT(af.wallet, 6), '...', RIGHT(af.wallet, 4)) as short_wallet,
  af.event_type,
  af.event_data,
  af.points_amount,
  af.created_at,
  -- Time ago calculation
  CASE
    WHEN af.created_at > NOW() - INTERVAL '1 minute' THEN 'just now'
    WHEN af.created_at > NOW() - INTERVAL '1 hour' THEN
      CONCAT(EXTRACT(MINUTE FROM NOW() - af.created_at)::INT, 'm ago')
    WHEN af.created_at > NOW() - INTERVAL '24 hours' THEN
      CONCAT(EXTRACT(HOUR FROM NOW() - af.created_at)::INT, 'h ago')
    ELSE TO_CHAR(af.created_at, 'Mon DD')
  END as time_ago
FROM activity_feed af
ORDER BY af.created_at DESC;

-- 3. Function: Log activity event
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_wallet VARCHAR,
  p_event_type VARCHAR,
  p_event_data JSONB DEFAULT '{}',
  p_points_amount INT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO activity_feed (user_id, wallet, event_type, event_data, points_amount)
  VALUES (p_user_id, p_wallet, p_event_type, p_event_data, p_points_amount)
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Cleanup: Delete old activity (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_activity()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_feed
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
