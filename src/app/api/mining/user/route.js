import {
  getOrCreateMiningUser,
  getMiningUser,
  updateUserNFTCache,
  canMine,
  canStartSession,
  getUserRank,
  getActiveSeason,
  getUserBadges,
  checkAndAwardBadges,
  getUserActiveBoosts,
  MINER_POINTS,
  MIN_CLAIM_POINTS,
  MINING_SESSION_DURATION_MS,
  calculateMiningPoints,
  getLevelInfo,
  LEVELS,
} from '@/lib/mining';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return Response.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    const user = await getMiningUser(wallet);

    if (!user) {
      return Response.json({
        registered: false,
        wallet: wallet.toLowerCase(),
      });
    }

    // V3: Calcular estado de sesión
    const sessionStatus = canStartSession(user);

    // Calcular estado de minería (legacy, para compatibilidad)
    const miningStatus = canMine(user);

    // V2: Obtener boosts activos
    const activeBoosts = await getUserActiveBoosts(user.id);

    // Calcular puntos potenciales (V2: incluye minerLevel, level bonus, y boosts)
    const potentialPoints = calculateMiningPoints(user, activeBoosts);

    // V2: Obtener información del nivel
    const levelInfo = getLevelInfo(user.lifetime_points || 0);

    // V2: Determinar minerLevel (Free si no tiene NFT) - movido arriba para usar en sessionData
    const minerLevel = user.cached_miner_level || 'Free';

    // V3: Calcular datos de sesión activa
    let sessionData = null;
    if (user.mining_session_started_at) {
      const sessionStart = new Date(user.mining_session_started_at).getTime();
      const now = Date.now();
      const elapsedMs = now - sessionStart;
      const effectiveElapsed = Math.min(elapsedMs, MINING_SESSION_DURATION_MS);
      const pointsAccumulated = (effectiveElapsed / 1000) * (user.mining_session_earning_rate || 0);
      const minPoints = MIN_CLAIM_POINTS[minerLevel] || MIN_CLAIM_POINTS.Free;

      sessionData = {
        active: true,
        startedAt: user.mining_session_started_at,
        endsAt: new Date(sessionStart + MINING_SESSION_DURATION_MS).toISOString(),
        elapsedMs: effectiveElapsed,
        remainingMs: Math.max(0, MINING_SESSION_DURATION_MS - elapsedMs),
        isComplete: elapsedMs >= MINING_SESSION_DURATION_MS,
        earningRate: {
          perSecond: user.mining_session_earning_rate,
          perMinute: (user.mining_session_earning_rate || 0) * 60,
        },
        pointsAccumulated: Math.floor(pointsAccumulated * 100) / 100,
        totalPoints: user.mining_session_total_points,
        progress: (effectiveElapsed / MINING_SESSION_DURATION_MS) * 100,
        canClaim: pointsAccumulated >= minPoints,
        minClaimPoints: minPoints,
      };
    }

    // Obtener rank
    const rank = await getUserRank(wallet);

    // Obtener temporada activa
    const season = await getActiveSeason();

    // Obtener badges y verificar nuevos
    const badges = await getUserBadges(user.id);
    // Verificar badges por si hay nuevos (ej: por NFTs actualizados)
    await checkAndAwardBadges(user.id, user);

    // Fetch equipped cosmetics with item details
    let equippedCosmetics = null;
    if (user.equipped_frame || user.equipped_name_color || user.equipped_badge) {
      const cosmeticIds = [user.equipped_frame, user.equipped_name_color, user.equipped_badge].filter(Boolean);
      const { data: cosmeticItems } = await supabase
        .from('shop_items')
        .select('id, name, icon, effect_type')
        .in('id', cosmeticIds);

      const itemMap = {};
      (cosmeticItems || []).forEach(item => { itemMap[item.id] = item; });

      equippedCosmetics = {
        frame: user.equipped_frame ? itemMap[user.equipped_frame] : null,
        nameColor: user.equipped_name_color ? itemMap[user.equipped_name_color] : null,
        badge: user.equipped_badge ? itemMap[user.equipped_badge] : null,
      };
    }

    return Response.json({
      registered: true,
      wallet: user.wallet,
      points: {
        lifetime: user.lifetime_points,
        season: user.season_points,
        spent: user.spent_points || 0,
        available: (user.lifetime_points || 0) - (user.spent_points || 0),
      },
      // V2: Información del nivel
      level: levelInfo,
      streak: {
        current: user.current_streak,
        max: user.max_streak,
      },
      miner: {
        level: minerLevel,
        hasNFT: !!user.cached_miner_level,
        tokenId: user.cached_miner_token_id,
        basePoints: MINER_POINTS[minerLevel] || MINER_POINTS.Free,
      },
      nfts: {
        memeCount: user.cached_meme_count,
        hasPass: user.cached_has_pass,
      },
      mining: {
        canMine: miningStatus.canMine,
        cooldownReason: miningStatus.reason,
        waitTime: miningStatus.waitTime,
        lastMiningAt: user.last_mining_at,
        potentialPoints: potentialPoints.points,
        minerLevel: potentialPoints.minerLevel,
        bonuses: potentialPoints.bonuses,
        boostMultiplier: potentialPoints.boostMultiplier,
        hasActiveBoost: potentialPoints.hasActiveBoost,
      },
      // V3: Datos de sesión activa
      session: sessionData,
      activeBoosts: activeBoosts.map(b => ({
        id: b.id,
        effectType: b.effect_type,
        effectValue: b.effect_value,
        expiresAt: b.expires_at,
      })),
      rank,
      season: season
        ? {
            id: season.id,
            name: season.name,
            endsAt: season.ends_at,
          }
        : null,
      badges,
      cosmetics: equippedCosmetics,
      avatar: {
        type: user.avatar_type || 'default',
        contract: user.avatar_nft_contract,
        tokenId: user.avatar_nft_token_id,
        imageUrl: user.avatar_nft_url,
        autoMode: user.avatar_auto_mode !== false, // Default true if null
      },
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { wallet } = await request.json();

    if (!wallet) {
      return Response.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const apiKey = process.env.OPENSEA_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'API not configured' }, { status: 500 });
    }

    // Crear usuario si no existe
    const user = await getOrCreateMiningUser(wallet);

    // Actualizar cache de NFTs
    await updateUserNFTCache(wallet, apiKey);

    // Obtener datos actualizados
    const updatedUser = await getMiningUser(wallet);

    return Response.json({
      success: true,
      user: {
        wallet: updatedUser.wallet,
        miner: {
          level: updatedUser.cached_miner_level,
          tokenId: updatedUser.cached_miner_token_id,
        },
        memeCount: updatedUser.cached_meme_count,
        hasPass: updatedUser.cached_has_pass,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
