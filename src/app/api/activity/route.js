import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/activity - Get recent community activity
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
  const type = searchParams.get('type'); // Optional filter by event type

  try {
    let query = supabase
      .from('recent_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('event_type', type);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Format events for display
    const events = (data || []).map(event => ({
      id: event.id,
      wallet: event.short_wallet,
      type: event.event_type,
      data: event.event_data,
      points: event.points_amount,
      timeAgo: event.time_ago,
      ...formatEventDisplay(event),
    }));

    return Response.json({ events });

  } catch (error) {
    console.error('Activity feed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Format event for display
 */
function formatEventDisplay(event) {
  const data = event.event_data || {};

  switch (event.event_type) {
    case 'mining':
      return {
        icon: '⛏️',
        message: `mined +${event.points_amount} pts`,
        color: 'text-green-400',
      };

    case 'jackpot':
      return {
        icon: '🎉',
        message: `WON ${event.points_amount} JACKPOT!`,
        color: 'text-yellow-400',
        highlight: true,
      };

    case 'boost_purchase':
      return {
        icon: data.icon || '⚡',
        message: `bought ${data.item || 'Boost'}`,
        color: 'text-blue-400',
      };

    case 'cosmetic_purchase':
      return {
        icon: data.icon || '🎨',
        message: `bought ${data.item || 'cosmetic'}`,
        color: 'text-purple-400',
      };

    case 'mystery_box':
      return {
        icon: '🎁',
        message: data.isJackpot ? `won ${event.points_amount} from Mystery Box!` : `opened Mystery Box`,
        color: data.isJackpot ? 'text-yellow-400' : 'text-pink-400',
        highlight: data.isJackpot,
      };

    case 'level_up':
      return {
        icon: data.icon || '🏆',
        message: `reached ${data.newLevel}`,
        color: 'text-amber-400',
        highlight: true,
      };

    case 'badge_earned':
      return {
        icon: data.icon || '🏅',
        message: `earned ${data.badge} badge`,
        color: 'text-emerald-400',
      };

    case 'referral_joined':
      return {
        icon: '👥',
        message: 'joined via referral',
        color: 'text-cyan-400',
      };

    default:
      return {
        icon: '📌',
        message: event.event_type,
        color: 'text-white',
      };
  }
}
