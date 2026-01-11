import {
  getOrCreateMiningUser,
  updateUserNFTCache,
  performMining,
  canMine,
} from '@/lib/mining';

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

    const walletLower = wallet.toLowerCase();

    // Obtener o crear usuario
    const user = await getOrCreateMiningUser(walletLower);

    // Verificar si necesitamos actualizar el cache de NFTs (cada 5 minutos)
    const needsRefresh =
      !user.last_nft_check ||
      Date.now() - new Date(user.last_nft_check).getTime() > 5 * 60 * 1000;

    if (needsRefresh) {
      await updateUserNFTCache(walletLower, apiKey);
    }

    // Ejecutar minería
    const result = await performMining(walletLower);

    if (!result.success) {
      // V2: NO_MINER ya no ocurre (FREE mining disponible)
      if (result.error === 'COOLDOWN') {
        return Response.json(
          {
            success: false,
            error: 'COOLDOWN',
            message: 'Mining is on cooldown',
            waitTime: result.waitTime,
            waitTimeFormatted: formatWaitTime(result.waitTime),
          },
          { status: 400 }
        );
      }

      return Response.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // V2: Incluye minerLevel y level info
    return Response.json({
      success: true,
      points: result.points,
      basePoints: result.basePoints,
      multiplier: result.multiplier,
      minerLevel: result.minerLevel,
      bonuses: result.bonuses,
      newStreak: result.newStreak,
      totalPoints: result.totalPoints,
      seasonPoints: result.seasonPoints,
      newBadges: result.newBadges || [],
      level: result.level,
    });
  } catch (error) {
    console.error('Mining error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function formatWaitTime(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
