import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/seasons - Obtener info de temporadas
 *
 * Query params:
 * - active: obtener temporada activa
 * - leaderboard: obtener ranking (opcional: seasonId)
 * - history: obtener temporadas pasadas
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const getActive = searchParams.get('active') === 'true';
    const getLeaderboard = searchParams.get('leaderboard') === 'true';
    const getHistory = searchParams.get('history') === 'true';
    const seasonId = searchParams.get('seasonId');
    const wallet = searchParams.get('wallet');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    const response = {};

    // Obtener temporada activa
    if (getActive || !getLeaderboard && !getHistory) {
      const { data: activeSeason } = await supabase.rpc('get_active_season');

      if (activeSeason && activeSeason.length > 0) {
        const season = activeSeason[0];
        response.activeSeason = {
          id: season.season_id,
          name: season.season_name,
          startDate: season.start_date,
          endDate: season.end_date,
          daysRemaining: season.days_remaining,
        };
      } else {
        // Verificar si hay temporada pendiente
        const { data: pendingSeason } = await supabase
          .from('seasons')
          .select('*')
          .eq('status', 'pending')
          .limit(1)
          .single();

        if (pendingSeason) {
          response.pendingSeason = {
            id: pendingSeason.id,
            name: pendingSeason.name,
            startDate: pendingSeason.start_date,
            status: 'pending',
          };
        }

        // Contar usuarios para Season 1
        const { count: userCount } = await supabase
          .from('mining_users')
          .select('*', { count: 'exact', head: true })
          .gt('total_mines', 0);

        response.usersForSeasonOne = {
          current: userCount || 0,
          required: 100,
          progress: Math.min(100, ((userCount || 0) / 100) * 100),
        };
      }
    }

    // Obtener leaderboard
    if (getLeaderboard) {
      const targetSeasonId = seasonId ? parseInt(seasonId) : null;
      const { data: leaderboard } = await supabase.rpc('get_season_leaderboard', {
        p_season_id: targetSeasonId,
        p_limit: limit,
      });

      response.leaderboard = (leaderboard || []).map(entry => ({
        rank: entry.rank,
        wallet: entry.wallet,
        shortWallet: `${entry.wallet.slice(0, 6)}...${entry.wallet.slice(-4)}`,
        level: entry.level,
        seasonPoints: entry.season_points,
      }));

      // Si se especificó wallet, obtener su posición
      if (wallet) {
        const walletLower = wallet.toLowerCase();
        const userEntry = response.leaderboard.find(e => e.wallet === walletLower);

        if (userEntry) {
          response.userRank = userEntry;
        } else {
          // Buscar fuera del top
          const { data: userInSeason } = await supabase
            .from('season_participants')
            .select(`
              season_points,
              mining_users!inner(wallet, level)
            `)
            .eq('mining_users.wallet', walletLower)
            .limit(1);

          if (userInSeason && userInSeason.length > 0) {
            // Contar cuántos tienen más puntos para calcular rank
            const { count } = await supabase
              .from('season_participants')
              .select('*', { count: 'exact', head: true })
              .gt('season_points', userInSeason[0].season_points);

            response.userRank = {
              rank: (count || 0) + 1,
              wallet: walletLower,
              shortWallet: `${walletLower.slice(0, 6)}...${walletLower.slice(-4)}`,
              level: userInSeason[0].mining_users.level,
              seasonPoints: userInSeason[0].season_points,
            };
          }
        }
      }
    }

    // Obtener historial de temporadas
    if (getHistory) {
      const { data: seasons } = await supabase
        .from('seasons')
        .select('*')
        .eq('status', 'ended')
        .order('end_date', { ascending: false })
        .limit(10);

      response.history = (seasons || []).map(s => ({
        id: s.id,
        name: s.name,
        startDate: s.start_date,
        endDate: s.end_date,
        nftUrl: s.nft_collection_url,
      }));
    }

    return Response.json(response);

  } catch (error) {
    console.error('Seasons error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
