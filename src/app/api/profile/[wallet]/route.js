import { createClient } from '@supabase/supabase-js';
import { getUserLevel, getLevelInfo, LEVELS } from '@/lib/mining';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/profile/[wallet] - Get public profile data
 */
export async function GET(request, { params }) {
  const { wallet } = await params;

  if (!wallet) {
    return Response.json({ error: 'Wallet required' }, { status: 400 });
  }

  const walletLower = wallet.toLowerCase();

  try {
    // Get user data
    const { data: user, error: userError } = await supabase
      .from('mining_users')
      .select(`
        id,
        wallet,
        lifetime_points,
        season_points,
        current_streak,
        max_streak,
        total_mines,
        cached_miner_level,
        cached_meme_count,
        cached_has_pass,
        equipped_frame,
        equipped_name_color,
        equipped_badge,
        created_at
      `)
      .eq('wallet', walletLower)
      .single();

    if (userError || !user) {
      return Response.json({ error: 'User not found', found: false }, { status: 404 });
    }

    // Get user's rank
    const { data: rankData } = await supabase
      .from('mining_leaderboard')
      .select('rank')
      .eq('wallet', walletLower)
      .single();

    // Get user's badges (only unlocked)
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', user.id);

    const badgeIds = (userBadges || []).map(b => b.badge_id);

    // Get badge definitions for unlocked badges
    let badges = [];
    if (badgeIds.length > 0) {
      const { data: badgeDefs } = await supabase
        .from('badge_definitions')
        .select('id, name, description, icon, category, color_from, color_to')
        .in('id', badgeIds);

      badges = (badgeDefs || []).map(badge => {
        const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
        return {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          colorFrom: badge.color_from,
          colorTo: badge.color_to,
          earnedAt: userBadge?.earned_at,
        };
      });
    }

    // Get equipped cosmetics details
    let cosmetics = {};
    const cosmeticIds = [user.equipped_frame, user.equipped_name_color, user.equipped_badge].filter(Boolean);

    if (cosmeticIds.length > 0) {
      const { data: cosmeticItems } = await supabase
        .from('shop_items')
        .select('id, name, icon, effect_type')
        .in('id', cosmeticIds);

      for (const item of cosmeticItems || []) {
        if (item.effect_type === 'frame') {
          cosmetics.frame = { id: item.id, name: item.name, icon: item.icon };
        } else if (item.effect_type === 'name_color') {
          cosmetics.nameColor = { id: item.id, name: item.name, icon: item.icon };
        } else if (item.effect_type === 'badge') {
          cosmetics.badge = { id: item.id, name: item.name, icon: item.icon };
        }
      }
    }

    // Calculate level info
    const levelInfo = getLevelInfo(user.lifetime_points || 0);

    // Format response (PUBLIC DATA ONLY)
    const profile = {
      found: true,
      wallet: user.wallet,
      shortWallet: `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}`,

      // Level
      level: {
        name: levelInfo.name,
        icon: levelInfo.icon,
        bonus: levelInfo.bonus,
        progress: levelInfo.progress,
        nextLevel: levelInfo.nextLevel,
        nextLevelIcon: levelInfo.nextLevelIcon,
      },

      // Points (only lifetime, not available/spendable)
      points: {
        lifetime: user.lifetime_points || 0,
        season: user.season_points || 0,
      },

      // Stats
      stats: {
        rank: rankData?.rank || null,
        currentStreak: user.current_streak || 0,
        maxStreak: user.max_streak || 0,
        totalMines: user.total_mines || 0,
        memberSince: user.created_at,
      },

      // NFTs
      nfts: {
        minerLevel: user.cached_miner_level || null,
        memeCount: user.cached_meme_count || 0,
        hasPass: user.cached_has_pass || false,
      },

      // Cosmetics
      cosmetics,

      // Badges (only unlocked)
      badges,
    };

    return Response.json(profile);

  } catch (error) {
    console.error('Profile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
