-- =============================================
-- SCHEMA: In-App Notifications System
-- Archive of Meme
--
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. TABLE: user_notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES mining_users(id) ON DELETE CASCADE,

  -- Notification content
  type VARCHAR(30) NOT NULL,
  -- Types: 'badge_earned', 'level_up', 'referral_joined', 'referral_milestone',
  --        'referral_bonus', 'jackpot', 'mystery_box_win', 'streak_milestone'

  title VARCHAR(100) NOT NULL,
  message VARCHAR(255) NOT NULL,
  icon VARCHAR(10) DEFAULT '🔔',

  -- Optional link
  action_url VARCHAR(255),

  -- Metadata
  data JSONB DEFAULT '{}',

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON user_notifications(created_at DESC);

-- RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON user_notifications
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM mining_users WHERE wallet = lower(current_setting('request.headers', true)::json->>'x-wallet-address')
    )
  );

-- Allow insert from server
CREATE POLICY "Server can insert notifications" ON user_notifications
  FOR INSERT WITH CHECK (true);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON user_notifications
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM mining_users WHERE wallet = lower(current_setting('request.headers', true)::json->>'x-wallet-address')
    )
  );

-- 2. FUNCTION: Create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message VARCHAR,
  p_icon VARCHAR DEFAULT '🔔',
  p_action_url VARCHAR DEFAULT NULL,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO user_notifications (user_id, type, title, message, icon, action_url, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_icon, p_action_url, p_data)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- 3. FUNCTION: Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_notifications
  SET is_read = true, read_at = NOW()
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNCTION: Mark all notifications as read for user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE user_notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = p_user_id AND is_read = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 5. VIEW: Unread count per user
CREATE OR REPLACE VIEW user_unread_notifications AS
SELECT
  user_id,
  COUNT(*) as unread_count
FROM user_notifications
WHERE is_read = false
GROUP BY user_id;

-- 6. Cleanup: Delete old read notifications (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM user_notifications
  WHERE is_read = true AND read_at < NOW() - INTERVAL '30 days';

  -- Also delete unread notifications older than 90 days
  DELETE FROM user_notifications
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
