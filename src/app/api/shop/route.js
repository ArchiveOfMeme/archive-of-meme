import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/shop - List all shop items and user's active boosts
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  try {
    // Get all active shop items
    const { data: items, error: itemsError } = await supabase
      .from('shop_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (itemsError) throw itemsError;

    // If wallet provided, get user's active boosts
    let activeBoosts = [];
    let userPoints = { available: 0, lifetime: 0, spent: 0 };

    if (wallet) {
      // Get user
      const { data: user } = await supabase
        .from('mining_users')
        .select('id, lifetime_points, spent_points')
        .eq('wallet', wallet.toLowerCase())
        .single();

      if (user) {
        userPoints = {
          lifetime: user.lifetime_points || 0,
          spent: user.spent_points || 0,
          available: (user.lifetime_points || 0) - (user.spent_points || 0),
        };

        // Get active boosts
        const { data: boosts } = await supabase
          .from('user_boosts')
          .select('*, shop_items(name, icon)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .or('expires_at.is.null,expires_at.gt.now()');

        activeBoosts = (boosts || []).map(b => ({
          id: b.id,
          itemId: b.item_id,
          name: b.shop_items?.name,
          icon: b.shop_items?.icon,
          effectType: b.effect_type,
          effectValue: b.effect_value,
          purchasedAt: b.purchased_at,
          expiresAt: b.expires_at,
          isOneTime: !b.expires_at,
        }));
      }
    }

    return Response.json({
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        cost: item.cost_points,
        effectType: item.effect_type,
        effectValue: item.effect_value,
        durationHours: item.duration_hours,
        minLevel: item.min_level,
        icon: item.icon,
      })),
      activeBoosts,
      userPoints,
    });
  } catch (error) {
    console.error('Shop error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/shop - Purchase an item
 */
export async function POST(request) {
  try {
    const { wallet, itemId } = await request.json();

    if (!wallet || !itemId) {
      return Response.json(
        { error: 'Wallet and itemId required' },
        { status: 400 }
      );
    }

    const walletLower = wallet.toLowerCase();

    // Get user
    const { data: user, error: userError } = await supabase
      .from('mining_users')
      .select('*')
      .eq('wallet', walletLower)
      .single();

    if (userError || !user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get item
    const { data: item, error: itemError } = await supabase
      .from('shop_items')
      .select('*')
      .eq('id', itemId)
      .eq('is_active', true)
      .single();

    if (itemError || !item) {
      return Response.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check available points
    const availablePoints = (user.lifetime_points || 0) - (user.spent_points || 0);
    if (availablePoints < item.cost_points) {
      return Response.json(
        {
          error: 'INSUFFICIENT_POINTS',
          message: 'Not enough points',
          required: item.cost_points,
          available: availablePoints,
        },
        { status: 400 }
      );
    }

    // Check level requirement
    if (item.min_level) {
      const { getUserLevel } = await import('@/lib/mining');
      const userLevel = getUserLevel(user.lifetime_points);
      const levelOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legend'];
      const userLevelIndex = levelOrder.indexOf(userLevel);
      const requiredLevelIndex = levelOrder.indexOf(item.min_level);

      if (userLevelIndex < requiredLevelIndex) {
        return Response.json(
          {
            error: 'LEVEL_REQUIRED',
            message: `Requires ${item.min_level} level`,
            required: item.min_level,
            current: userLevel,
          },
          { status: 400 }
        );
      }
    }

    // Check if user already has an active boost of same type (for multipliers)
    if (item.effect_type === 'mining_multiplier') {
      const { data: existingBoost } = await supabase
        .from('user_boosts')
        .select('id, expires_at')
        .eq('user_id', user.id)
        .eq('effect_type', 'mining_multiplier')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (existingBoost) {
        return Response.json(
          {
            error: 'BOOST_ACTIVE',
            message: 'You already have an active mining boost',
            expiresAt: existingBoost.expires_at,
          },
          { status: 400 }
        );
      }
    }

    // Calculate expiration
    let expiresAt = null;
    if (item.duration_hours) {
      expiresAt = new Date(Date.now() + item.duration_hours * 60 * 60 * 1000).toISOString();
    }

    // Create the boost/purchase
    const { data: boost, error: boostError } = await supabase
      .from('user_boosts')
      .insert({
        user_id: user.id,
        item_id: item.id,
        effect_type: item.effect_type,
        effect_value: item.effect_value,
        expires_at: expiresAt,
        is_active: true,
      })
      .select()
      .single();

    if (boostError) throw boostError;

    // Deduct points (update spent_points)
    const { error: updateError } = await supabase
      .from('mining_users')
      .update({
        spent_points: (user.spent_points || 0) + item.cost_points,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Record transaction
    await supabase
      .from('shop_transactions')
      .insert({
        user_id: user.id,
        item_id: item.id,
        points_spent: item.cost_points,
      });

    // Also record in mining_transactions for history
    await supabase
      .from('mining_transactions')
      .insert({
        user_id: user.id,
        amount: -item.cost_points,
        type: 'purchase',
        description: `Purchased ${item.name}`,
      });

    // Log activity event
    try {
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_wallet: walletLower,
        p_event_type: 'boost_purchase',
        p_event_data: { item: item.name, icon: item.icon },
        p_points_amount: item.cost_points,
      });
    } catch (activityErr) {
      console.error('Activity log error:', activityErr);
    }

    return Response.json({
      success: true,
      purchase: {
        itemId: item.id,
        itemName: item.name,
        cost: item.cost_points,
        effectType: item.effect_type,
        effectValue: item.effect_value,
        expiresAt,
      },
      newBalance: availablePoints - item.cost_points,
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
