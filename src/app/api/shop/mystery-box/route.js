import { createClient } from '@supabase/supabase-js';
import { getUserLevel, LEVELS } from '@/lib/mining';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mystery Box Configuration
const MYSTERY_BOX_COST = 500;
const MIN_LEVEL = 'Gold';

// Prize table (cumulative percentages)
// Roll 1-100, check thresholds in order
const PRIZE_TABLE = [
  { maxRoll: 40, type: 'points_small', minValue: 100, maxValue: 300, description: 'Small points win' },
  { maxRoll: 65, type: 'boost', value: 1.5, description: 'Free Boost x1.5' },
  { maxRoll: 80, type: 'points_medium', minValue: 500, maxValue: 800, description: 'Medium points win' },
  { maxRoll: 90, type: 'badge_lucky', description: 'Lucky Badge' },
  { maxRoll: 97, type: 'jackpot_small', minValue: 1000, maxValue: 2000, description: 'Jackpot!' },
  { maxRoll: 100, type: 'jackpot_big', minValue: 2500, maxValue: 5000, description: 'MEGA JACKPOT!' },
];

/**
 * POST /api/shop/mystery-box - Open a mystery box
 */
export async function POST(request) {
  try {
    const { wallet } = await request.json();

    if (!wallet) {
      return Response.json({ error: 'Wallet required' }, { status: 400 });
    }

    const walletLower = wallet.toLowerCase();

    // Get user
    const { data: user, error: userError } = await supabase
      .from('mining_users')
      .select('*')
      .eq('wallet', walletLower)
      .single();

    if (userError || !user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check level requirement
    const userLevel = getUserLevel(user.lifetime_points || 0);
    const levelOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legend'];
    const userLevelIndex = levelOrder.indexOf(userLevel);
    const requiredLevelIndex = levelOrder.indexOf(MIN_LEVEL);

    if (userLevelIndex < requiredLevelIndex) {
      return Response.json({
        error: 'LEVEL_REQUIRED',
        message: `Mystery Box requires ${MIN_LEVEL} level`,
        required: MIN_LEVEL,
        current: userLevel,
      }, { status: 400 });
    }

    // Check available points
    const availablePoints = (user.lifetime_points || 0) - (user.spent_points || 0);
    if (availablePoints < MYSTERY_BOX_COST) {
      return Response.json({
        error: 'INSUFFICIENT_POINTS',
        message: 'Not enough points',
        required: MYSTERY_BOX_COST,
        available: availablePoints,
      }, { status: 400 });
    }

    // Generate random roll (1-100)
    const roll = Math.floor(Math.random() * 100) + 1;

    // Determine prize
    let prize = null;
    for (const tier of PRIZE_TABLE) {
      if (roll <= tier.maxRoll) {
        prize = { ...tier, roll };
        break;
      }
    }

    // Calculate actual prize value
    let prizeResult = {
      type: prize.type,
      roll: roll,
      description: prize.description,
      pointsWon: 0,
      boostAwarded: null,
      badgeAwarded: null,
    };

    // Process prize based on type
    switch (prize.type) {
      case 'points_small':
      case 'points_medium':
        prizeResult.pointsWon = Math.floor(
          Math.random() * (prize.maxValue - prize.minValue + 1) + prize.minValue
        );
        prizeResult.prizeType = 'points';
        break;

      case 'boost':
        // Award a free Boost x1.5 for 24 hours
        const boostExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('user_boosts').insert({
          user_id: user.id,
          item_id: 'boost_1_5x',
          effect_type: 'mining_multiplier',
          effect_value: 1.5,
          expires_at: boostExpires,
          is_active: true,
        });
        prizeResult.boostAwarded = { multiplier: 1.5, expiresAt: boostExpires };
        prizeResult.prizeType = 'boost';
        break;

      case 'badge_lucky':
        // Check if user already has Lucky badge
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', user.id)
          .eq('badge_id', 'lucky')
          .single();

        if (!existingBadge) {
          await supabase.from('user_badges').insert({
            user_id: user.id,
            badge_id: 'lucky',
            earned_value: roll,
          });
          prizeResult.badgeAwarded = { id: 'lucky', name: 'Lucky', icon: '🍀' };
        } else {
          // Already has badge, give points instead
          prizeResult.pointsWon = 750;
          prizeResult.description = 'Lucky (already owned) - bonus points!';
        }
        prizeResult.prizeType = 'badge';
        break;

      case 'jackpot_small':
      case 'jackpot_big':
        prizeResult.pointsWon = Math.floor(
          Math.random() * (prize.maxValue - prize.minValue + 1) + prize.minValue
        );
        prizeResult.prizeType = 'jackpot';

        // Award Jackpot badge if first time
        const { data: existingJackpot } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', user.id)
          .eq('badge_id', 'jackpot')
          .single();

        if (!existingJackpot) {
          await supabase.from('user_badges').insert({
            user_id: user.id,
            badge_id: 'jackpot',
            earned_value: prizeResult.pointsWon,
          });
          prizeResult.badgeAwarded = { id: 'jackpot', name: 'Jackpot Winner', icon: '💰' };
        }
        break;
    }

    // Calculate net points change
    const netPointsChange = prizeResult.pointsWon - MYSTERY_BOX_COST;
    const newSpentPoints = (user.spent_points || 0) + MYSTERY_BOX_COST;
    const newLifetimePoints = (user.lifetime_points || 0) + prizeResult.pointsWon;

    // Update user points
    const { error: updateError } = await supabase
      .from('mining_users')
      .update({
        spent_points: newSpentPoints,
        lifetime_points: newLifetimePoints,
        season_points: (user.season_points || 0) + prizeResult.pointsWon,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Record in mystery box history
    await supabase.from('mystery_box_history').insert({
      user_id: user.id,
      prize_type: prizeResult.prizeType,
      prize_value: prizeResult.pointsWon || (prizeResult.boostAwarded ? 150 : 0),
      prize_description: prizeResult.description,
      roll_number: roll,
    });

    // Record transaction
    await supabase.from('mining_transactions').insert({
      user_id: user.id,
      amount: netPointsChange,
      type: 'mystery_box',
      description: `Mystery Box: ${prizeResult.description}`,
    });

    // Record shop transaction
    await supabase.from('shop_transactions').insert({
      user_id: user.id,
      item_id: 'mystery_box',
      points_spent: MYSTERY_BOX_COST,
    });

    // Log activity event
    try {
      const isJackpot = prizeResult.prizeType === 'jackpot';
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_wallet: walletLower,
        p_event_type: isJackpot ? 'jackpot' : 'mystery_box',
        p_event_data: {
          prizeType: prizeResult.prizeType,
          isJackpot,
          description: prizeResult.description,
        },
        p_points_amount: prizeResult.pointsWon || null,
      });

      // Create notification for jackpot wins
      if (isJackpot) {
        await supabase.rpc('create_notification', {
          p_user_id: user.id,
          p_type: 'jackpot',
          p_title: 'JACKPOT! You Won!',
          p_message: `You won ${prizeResult.pointsWon.toLocaleString()} points from the Mystery Box! Roll: ${roll}`,
          p_icon: '🎉',
          p_action_url: '/shop',
        });
      }
    } catch (activityErr) {
      console.error('Activity log error:', activityErr);
    }

    return Response.json({
      success: true,
      result: {
        roll: roll,
        prizeType: prizeResult.prizeType,
        description: prizeResult.description,
        pointsWon: prizeResult.pointsWon,
        boostAwarded: prizeResult.boostAwarded,
        badgeAwarded: prizeResult.badgeAwarded,
        cost: MYSTERY_BOX_COST,
        netChange: netPointsChange,
      },
      newBalance: availablePoints + netPointsChange,
    });

  } catch (error) {
    console.error('Mystery Box error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/shop/mystery-box - Get user's mystery box history
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return Response.json({ error: 'Wallet required' }, { status: 400 });
  }

  try {
    // Get user
    const { data: user } = await supabase
      .from('mining_users')
      .select('id')
      .eq('wallet', wallet.toLowerCase())
      .single();

    if (!user) {
      return Response.json({ history: [], stats: null });
    }

    // Get history (last 20)
    const { data: history } = await supabase
      .from('mystery_box_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get stats
    const { data: stats } = await supabase
      .from('user_mystery_box_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return Response.json({
      history: history || [],
      stats: stats || { total_opened: 0, total_points_won: 0, jackpots_hit: 0, biggest_win: 0 },
    });

  } catch (error) {
    console.error('Mystery Box history error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
