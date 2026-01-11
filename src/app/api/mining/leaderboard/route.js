import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const type = searchParams.get('type') || 'season'; // 'season' or 'lifetime'
  const wallet = searchParams.get('wallet');

  try {
    // Determine which field to order by
    const orderField = type === 'lifetime' ? 'lifetime_points' : 'season_points';

    // Get leaderboard
    const { data: leaderboard, error, count } = await supabase
      .from('mining_users')
      .select('wallet, season_points, lifetime_points, current_streak, max_streak, cached_miner_level', { count: 'exact' })
      .gt(orderField, 0)
      .order(orderField, { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Add rank to each entry
    const rankedLeaderboard = (leaderboard || []).map((entry, index) => ({
      ...entry,
      rank: offset + index + 1,
      points: type === 'lifetime' ? entry.lifetime_points : entry.season_points,
    }));

    // Get user's rank if wallet provided
    let userRank = null;
    let userData = null;
    if (wallet) {
      const { data: allUsers, error: rankError } = await supabase
        .from('mining_users')
        .select('wallet, season_points, lifetime_points, current_streak, cached_miner_level')
        .gt(orderField, 0)
        .order(orderField, { ascending: false });

      if (!rankError && allUsers) {
        const userIndex = allUsers.findIndex(u => u.wallet.toLowerCase() === wallet.toLowerCase());
        if (userIndex !== -1) {
          userRank = userIndex + 1;
          userData = {
            ...allUsers[userIndex],
            rank: userRank,
            points: type === 'lifetime' ? allUsers[userIndex].lifetime_points : allUsers[userIndex].season_points,
          };
        }
      }
    }

    // Get top 3 for podium
    const podium = rankedLeaderboard.slice(0, 3);

    return Response.json({
      leaderboard: rankedLeaderboard,
      podium,
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
      type,
      userRank,
      userData,
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
