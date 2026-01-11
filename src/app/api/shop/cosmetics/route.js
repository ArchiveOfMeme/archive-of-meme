import { createClient } from '@supabase/supabase-js';
import { getUserLevel } from '@/lib/mining';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/shop/cosmetics - Get user's owned cosmetics and equipped items
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
      .select('id, equipped_frame, equipped_name_color, equipped_badge')
      .eq('wallet', wallet.toLowerCase())
      .single();

    if (!user) {
      return Response.json({ owned: [], equipped: {} });
    }

    // Get owned cosmetics
    const { data: owned } = await supabase
      .from('user_cosmetics')
      .select('item_id, is_equipped, purchased_at')
      .eq('user_id', user.id);

    return Response.json({
      owned: owned || [],
      equipped: {
        frame: user.equipped_frame,
        nameColor: user.equipped_name_color,
        badge: user.equipped_badge,
      },
    });

  } catch (error) {
    console.error('Cosmetics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/shop/cosmetics - Purchase a cosmetic item
 */
export async function POST(request) {
  try {
    const { wallet, itemId } = await request.json();

    if (!wallet || !itemId) {
      return Response.json({ error: 'Wallet and itemId required' }, { status: 400 });
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

    // Get item
    const { data: item, error: itemError } = await supabase
      .from('shop_items')
      .select('*')
      .eq('id', itemId)
      .eq('category', 'cosmetic')
      .eq('is_active', true)
      .single();

    if (itemError || !item) {
      return Response.json({ error: 'Cosmetic item not found' }, { status: 404 });
    }

    // Check if already owned
    const { data: existing } = await supabase
      .from('user_cosmetics')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .single();

    if (existing) {
      return Response.json({
        error: 'ALREADY_OWNED',
        message: 'You already own this cosmetic',
      }, { status: 400 });
    }

    // Check available points
    const availablePoints = (user.lifetime_points || 0) - (user.spent_points || 0);
    if (availablePoints < item.cost_points) {
      return Response.json({
        error: 'INSUFFICIENT_POINTS',
        message: 'Not enough points',
        required: item.cost_points,
        available: availablePoints,
      }, { status: 400 });
    }

    // Check level requirement
    if (item.min_level) {
      const userLevel = getUserLevel(user.lifetime_points);
      const levelOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legend'];
      const userLevelIndex = levelOrder.indexOf(userLevel);
      const requiredLevelIndex = levelOrder.indexOf(item.min_level);

      if (userLevelIndex < requiredLevelIndex) {
        return Response.json({
          error: 'LEVEL_REQUIRED',
          message: `Requires ${item.min_level} level`,
          required: item.min_level,
          current: userLevel,
        }, { status: 400 });
      }
    }

    // Add to user_cosmetics
    const { error: cosmeticError } = await supabase
      .from('user_cosmetics')
      .insert({
        user_id: user.id,
        item_id: itemId,
        is_equipped: false,
      });

    if (cosmeticError) throw cosmeticError;

    // Deduct points
    const { error: updateError } = await supabase
      .from('mining_users')
      .update({
        spent_points: (user.spent_points || 0) + item.cost_points,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Record transactions
    await supabase.from('shop_transactions').insert({
      user_id: user.id,
      item_id: itemId,
      points_spent: item.cost_points,
    });

    await supabase.from('mining_transactions').insert({
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
        p_event_type: 'cosmetic_purchase',
        p_event_data: { item: item.name, icon: item.icon, effectType: item.effect_type },
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
      },
      newBalance: availablePoints - item.cost_points,
    });

  } catch (error) {
    console.error('Cosmetic purchase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/shop/cosmetics - Equip/unequip a cosmetic
 */
export async function PUT(request) {
  try {
    const { wallet, itemId, action } = await request.json();

    if (!wallet || !itemId || !action) {
      return Response.json({ error: 'Wallet, itemId, and action required' }, { status: 400 });
    }

    if (!['equip', 'unequip'].includes(action)) {
      return Response.json({ error: 'Action must be "equip" or "unequip"' }, { status: 400 });
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

    // Get item details
    const { data: item } = await supabase
      .from('shop_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (!item) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check if user owns this cosmetic
    const { data: owned } = await supabase
      .from('user_cosmetics')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .single();

    if (!owned) {
      return Response.json({ error: 'You do not own this cosmetic' }, { status: 400 });
    }

    // Determine which field to update based on effect_type
    let updateField = null;
    if (item.effect_type === 'frame') {
      updateField = 'equipped_frame';
    } else if (item.effect_type === 'name_color') {
      updateField = 'equipped_name_color';
    } else if (item.effect_type === 'badge') {
      updateField = 'equipped_badge';
    } else {
      return Response.json({ error: 'Invalid cosmetic type' }, { status: 400 });
    }

    // Update user's equipped cosmetic
    const newValue = action === 'equip' ? itemId : null;
    const { error: updateError } = await supabase
      .from('mining_users')
      .update({
        [updateField]: newValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Update user_cosmetics is_equipped status
    // First, unequip all of same type
    await supabase
      .from('user_cosmetics')
      .update({ is_equipped: false })
      .eq('user_id', user.id)
      .in('item_id',
        (await supabase
          .from('shop_items')
          .select('id')
          .eq('effect_type', item.effect_type)
        ).data?.map(i => i.id) || []
      );

    // Then equip the selected one
    if (action === 'equip') {
      await supabase
        .from('user_cosmetics')
        .update({ is_equipped: true })
        .eq('user_id', user.id)
        .eq('item_id', itemId);
    }

    return Response.json({
      success: true,
      action,
      itemId,
      effectType: item.effect_type,
    });

  } catch (error) {
    console.error('Cosmetic equip error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
