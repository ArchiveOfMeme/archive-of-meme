-- =============================================
-- SCHEMA: Referral System
-- Archive of Meme - V2 Auto-sustainable Model
--
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add referral columns to mining_users
ALTER TABLE mining_users
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(8) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES mining_users(id),
ADD COLUMN IF NOT EXISTS referred_at TIMESTAMP WITH TIME ZONE;

-- 2. Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(8) := '';
  i INTEGER;
  exists_already BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    SELECT EXISTS(SELECT 1 FROM mining_users WHERE referral_code = result) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Generate referral codes for existing users
UPDATE mining_users
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- 4. Trigger to auto-generate referral code on new user
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_referral_code ON mining_users;
CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON mining_users
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();

-- 5. TABLE: referral_rewards (track referral bonuses)
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES mining_users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES mining_users(id) ON DELETE CASCADE,

  -- Reward tracking
  reward_type VARCHAR(30) NOT NULL, -- 'signup_bonus', 'mining_bonus', 'milestone_bonus'
  points_earned INT NOT NULL,

  -- For mining bonus: track the mining transaction that triggered it
  source_transaction_id UUID REFERENCES mining_transactions(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referred ON referral_rewards(referred_id);

-- RLS
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referral rewards viewable by everyone" ON referral_rewards
  FOR SELECT USING (true);

CREATE POLICY "Referral rewards insertable" ON referral_rewards
  FOR INSERT WITH CHECK (true);

-- 6. VIEW: Referral stats per user
CREATE OR REPLACE VIEW user_referral_stats AS
SELECT
  mu.id as user_id,
  mu.wallet,
  mu.referral_code,
  COUNT(DISTINCT ref.id) as total_referrals,
  COUNT(DISTINCT CASE WHEN ref.lifetime_points >= 100 THEN ref.id END) as active_referrals,
  COALESCE(SUM(rr.points_earned), 0) as total_points_earned
FROM mining_users mu
LEFT JOIN mining_users ref ON ref.referred_by = mu.id
LEFT JOIN referral_rewards rr ON rr.referrer_id = mu.id
GROUP BY mu.id, mu.wallet, mu.referral_code;

-- 7. VIEW: Detailed referrals list
CREATE OR REPLACE VIEW user_referrals_list AS
SELECT
  ref.referred_by as referrer_id,
  ref.id as referred_id,
  ref.wallet as referred_wallet,
  ref.lifetime_points as referred_points,
  ref.referred_at,
  ref.lifetime_points >= 100 as is_active,
  COALESCE(
    (SELECT SUM(points_earned) FROM referral_rewards WHERE referred_id = ref.id AND referrer_id = ref.referred_by),
    0
  ) as points_earned_from_referral
FROM mining_users ref
WHERE ref.referred_by IS NOT NULL;

-- 8. Function: Award referral bonus when referred user mines
-- This is called from the mining API
CREATE OR REPLACE FUNCTION award_referral_mining_bonus(
  p_referred_id UUID,
  p_mining_points INT,
  p_transaction_id UUID
)
RETURNS INT AS $$
DECLARE
  v_referrer_id UUID;
  v_referred_at TIMESTAMP;
  v_bonus_points INT;
  v_days_since_referral INT;
BEGIN
  -- Get referrer info
  SELECT referred_by, referred_at INTO v_referrer_id, v_referred_at
  FROM mining_users
  WHERE id = p_referred_id;

  -- No referrer? Exit
  IF v_referrer_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Check if within 30 day window
  v_days_since_referral := EXTRACT(DAY FROM (NOW() - v_referred_at));
  IF v_days_since_referral > 30 THEN
    RETURN 0;
  END IF;

  -- Calculate 5% bonus
  v_bonus_points := GREATEST(1, FLOOR(p_mining_points * 0.05));

  -- Award points to referrer
  UPDATE mining_users
  SET
    lifetime_points = lifetime_points + v_bonus_points,
    season_points = season_points + v_bonus_points,
    updated_at = NOW()
  WHERE id = v_referrer_id;

  -- Record the reward
  INSERT INTO referral_rewards (referrer_id, referred_id, reward_type, points_earned, source_transaction_id)
  VALUES (v_referrer_id, p_referred_id, 'mining_bonus', v_bonus_points, p_transaction_id);

  RETURN v_bonus_points;
END;
$$ LANGUAGE plpgsql;

-- 9. Function: Award signup bonus (100 pts) when referral reaches 10 mines
CREATE OR REPLACE FUNCTION check_referral_milestone(p_referred_id UUID)
RETURNS INT AS $$
DECLARE
  v_referrer_id UUID;
  v_mine_count INT;
  v_already_awarded BOOLEAN;
  v_bonus_points INT := 100;
BEGIN
  -- Get referrer
  SELECT referred_by INTO v_referrer_id
  FROM mining_users
  WHERE id = p_referred_id;

  IF v_referrer_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Count referred user's mines
  SELECT COUNT(*) INTO v_mine_count
  FROM mining_transactions
  WHERE user_id = p_referred_id AND type = 'mining';

  -- Check if milestone already awarded
  SELECT EXISTS(
    SELECT 1 FROM referral_rewards
    WHERE referrer_id = v_referrer_id
    AND referred_id = p_referred_id
    AND reward_type = 'milestone_bonus'
  ) INTO v_already_awarded;

  -- If exactly 10 mines and not already awarded
  IF v_mine_count = 10 AND NOT v_already_awarded THEN
    -- Award bonus
    UPDATE mining_users
    SET
      lifetime_points = lifetime_points + v_bonus_points,
      season_points = season_points + v_bonus_points,
      updated_at = NOW()
    WHERE id = v_referrer_id;

    -- Record reward
    INSERT INTO referral_rewards (referrer_id, referred_id, reward_type, points_earned)
    VALUES (v_referrer_id, p_referred_id, 'milestone_bonus', v_bonus_points);

    RETURN v_bonus_points;
  END IF;

  RETURN 0;
END;
$$ LANGUAGE plpgsql;
