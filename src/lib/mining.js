import { createClient } from '@supabase/supabase-js';

// Supabase client con service role para operaciones del servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// =============================================
// CONSTANTES
// =============================================

export const MINER_CONTRACT = '0x132e7e2b63070adc4169ef9f9d5f8af2be91f4f5';
export const MINER_COLLECTION_SLUG = 'archive-of-meme-miners';
export const MEMES_COLLECTION_SLUG = 'archive-of-meme-arch';
export const PASS_CONTRACT = '0xca84fa4b3e0956ed97015c0b2d42750f122244f7';
export const PASS_COLLECTION_SLUG = 'archive-of-meme-pass';

// Puntos base por nivel de minero (por sesión de 4h)
export const MINER_POINTS = {
  Free: 15,   // V2: Subido de 10 a 15
  Basic: 50,
  Pro: 150,
  Ultra: 400,
};

// Mínimo de puntos para hacer claim
export const MIN_CLAIM_POINTS = {
  Free: 5,
  Basic: 10,
  Pro: 10,
  Ultra: 10,
};

// Sistema de niveles basado en lifetime_points
export const LEVELS = {
  Bronze:   { min: 0,       bonus: 0,    icon: '🥉', next: 'Silver' },
  Silver:   { min: 1000,    bonus: 0.05, icon: '🥈', next: 'Gold' },
  Gold:     { min: 5000,    bonus: 0.10, icon: '🥇', next: 'Platinum' },
  Platinum: { min: 20000,   bonus: 0.15, icon: '💎', next: 'Diamond' },
  Diamond:  { min: 100000,  bonus: 0.25, icon: '👑', next: 'Legend' },
  Legend:   { min: 500000,  bonus: 0.30, icon: '🌟', next: null },
};

// Duración de sesión de minado (4 horas en milisegundos)
export const MINING_SESSION_DURATION_MS = 4 * 60 * 60 * 1000;
// Alias para compatibilidad con código existente
export const MINING_COOLDOWN_MS = MINING_SESSION_DURATION_MS;

// Bonus por streak (días consecutivos)
export const STREAK_BONUS = {
  1: 0,
  2: 0.05,
  3: 0.10,
  4: 0.15,
  5: 0.20,
  6: 0.25,
  7: 0.30, // máximo
};

// Bonus por cantidad de memes (reducido en v2)
export const MEME_BONUS = {
  0: 0,
  1: 0.02,   // 1-2 memes: +2%
  3: 0.05,   // 3-5 memes: +5%
  6: 0.08,   // 6-10 memes: +8%
  11: 0.10,  // 11+ memes: +10% (máx)
};

// Bonus por tener OG Pass (+5%)
export const PASS_BONUS = 0.05;

// Hard cap de bonus total (reducido de 150% a 100% en v2)
export const BONUS_HARD_CAP = 1.00;

// =============================================
// FUNCIONES DE USUARIO
// =============================================

/**
 * Obtener o crear usuario de mining
 */
export async function getOrCreateMiningUser(wallet) {
  const walletLower = wallet.toLowerCase();

  // Buscar usuario existente
  let { data: user, error } = await supabase
    .from('mining_users')
    .select('*')
    .eq('wallet', walletLower)
    .single();

  if (error && error.code === 'PGRST116') {
    // No existe, crear nuevo
    const { data: newUser, error: insertError } = await supabase
      .from('mining_users')
      .insert({ wallet: walletLower })
      .select()
      .single();

    if (insertError) throw insertError;
    return newUser;
  }

  if (error) throw error;
  return user;
}

/**
 * Obtener usuario por wallet
 */
export async function getMiningUser(wallet) {
  const { data, error } = await supabase
    .from('mining_users')
    .select('*')
    .eq('wallet', wallet.toLowerCase())
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

// =============================================
// FUNCIONES DE NFT
// =============================================

/**
 * Verificar qué minero tiene el usuario (llama a OpenSea API)
 */
export async function verifyMinerNFT(wallet, apiKey) {
  try {
    const response = await fetch(
      `https://api.opensea.io/api/v2/chain/base/account/${wallet.toLowerCase()}/nfts?collection=${MINER_COLLECTION_SLUG}`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('OpenSea API error:', response.status);
      return { hasMiner: false, level: null, tokenId: null };
    }

    const data = await response.json();

    if (!data.nfts || data.nfts.length === 0) {
      return { hasMiner: false, level: null, tokenId: null };
    }

    // Encontrar el mejor minero (Ultra > Pro > Basic)
    let bestMiner = null;
    const levelPriority = { Ultra: 3, Pro: 2, Basic: 1 };

    for (const nft of data.nfts) {
      // Detectar nivel por nombre del NFT (más robusto que traits)
      let level = null;
      const name = nft.name || '';

      if (name.includes('Ultra')) {
        level = 'Ultra';
      } else if (name.includes('Pro')) {
        level = 'Pro';
      } else if (name.includes('Basic')) {
        level = 'Basic';
      }

      if (level) {
        if (!bestMiner || levelPriority[level] > levelPriority[bestMiner.level]) {
          bestMiner = {
            level,
            tokenId: nft.identifier,
            name: nft.name,
          };
        }
      }
    }

    if (bestMiner) {
      return {
        hasMiner: true,
        level: bestMiner.level,
        tokenId: bestMiner.tokenId,
        name: bestMiner.name,
      };
    }

    return { hasMiner: false, level: null, tokenId: null };
  } catch (error) {
    console.error('Error verifying miner:', error);
    return { hasMiner: false, level: null, tokenId: null, error: error.message };
  }
}

/**
 * Contar memes que posee el usuario
 */
export async function countUserMemes(wallet, apiKey) {
  try {
    const response = await fetch(
      `https://api.opensea.io/api/v2/chain/base/account/${wallet.toLowerCase()}/nfts?collection=${MEMES_COLLECTION_SLUG}`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey,
        },
      }
    );

    if (!response.ok) return 0;

    const data = await response.json();
    return data.nfts?.length || 0;
  } catch {
    return 0;
  }
}

/**
 * Verificar si tiene el OG Pass
 */
export async function verifyOGPass(wallet, apiKey) {
  try {
    const response = await fetch(
      `https://api.opensea.io/api/v2/chain/base/account/${wallet.toLowerCase()}/nfts?collection=${PASS_COLLECTION_SLUG}`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('OpenSea API error checking OG Pass:', response.status);
      return false;
    }

    const data = await response.json();

    // Verificar si tiene algún NFT con "OG Pass" en el nombre
    if (!data.nfts || data.nfts.length === 0) {
      return false;
    }

    return data.nfts.some((nft) => {
      const name = nft.name || '';
      return name.includes('OG Pass') || name.includes('OG');
    });
  } catch (error) {
    console.error('Error verifying OG Pass:', error);
    return false;
  }
}

// Alias para compatibilidad
export const verifyPass = verifyOGPass;

/**
 * Actualizar cache de NFTs del usuario
 */
export async function updateUserNFTCache(wallet, apiKey) {
  const walletLower = wallet.toLowerCase();

  const [minerData, memeCount, hasPass] = await Promise.all([
    verifyMinerNFT(walletLower, apiKey),
    countUserMemes(walletLower, apiKey),
    verifyPass(walletLower, apiKey),
  ]);

  const { error } = await supabase
    .from('mining_users')
    .update({
      cached_miner_level: minerData.level,
      cached_miner_token_id: minerData.tokenId,
      cached_meme_count: memeCount,
      cached_has_pass: hasPass,
      last_nft_check: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('wallet', walletLower);

  if (error) console.error('Error updating NFT cache:', error);

  return {
    miner: minerData,
    memeCount,
    hasPass,
  };
}

// =============================================
// FUNCIONES DE MINERÍA
// =============================================

/**
 * Verificar si el usuario puede iniciar una sesión de minado
 * V3: Sistema de sesiones - no puede iniciar si tiene sesión activa
 */
export function canStartSession(user) {
  // Si tiene sesión activa, no puede iniciar otra
  if (user.mining_session_started_at) {
    const sessionStart = new Date(user.mining_session_started_at).getTime();
    const elapsed = Date.now() - sessionStart;
    const isSessionComplete = elapsed >= MINING_SESSION_DURATION_MS;

    return {
      canStart: false,
      reason: isSessionComplete ? 'SESSION_COMPLETE_PENDING_CLAIM' : 'SESSION_ACTIVE',
      sessionStartedAt: user.mining_session_started_at,
      elapsed,
      isSessionComplete,
    };
  }

  return { canStart: true, reason: null };
}

/**
 * @deprecated Usar canStartSession() para el nuevo sistema de sesiones
 * Mantener para compatibilidad con código existente
 */
export function canMine(user) {
  if (!user.last_mining_at) {
    return { canMine: true, reason: null, waitTime: 0 };
  }

  const lastMining = new Date(user.last_mining_at).getTime();
  const now = Date.now();
  const elapsed = now - lastMining;

  if (elapsed < MINING_COOLDOWN_MS) {
    const waitTime = MINING_COOLDOWN_MS - elapsed;
    return { canMine: false, reason: 'COOLDOWN', waitTime };
  }

  return { canMine: true, reason: null, waitTime: 0 };
}

/**
 * Calcular bonus por streak
 */
export function getStreakBonus(streak) {
  if (streak >= 7) return STREAK_BONUS[7];
  return STREAK_BONUS[streak] || 0;
}

/**
 * Calcular bonus por memes (valores reducidos en v2)
 */
export function getMemeBonus(memeCount) {
  if (memeCount >= 11) return MEME_BONUS[11];  // +10% máx
  if (memeCount >= 6) return MEME_BONUS[6];    // +8%
  if (memeCount >= 3) return MEME_BONUS[3];    // +5%
  if (memeCount >= 1) return MEME_BONUS[1];    // +2%
  return 0;
}

/**
 * Obtener nivel del usuario basado en lifetime_points
 */
export function getUserLevel(lifetimePoints) {
  const points = lifetimePoints || 0;

  if (points >= LEVELS.Legend.min) return 'Legend';
  if (points >= LEVELS.Diamond.min) return 'Diamond';
  if (points >= LEVELS.Platinum.min) return 'Platinum';
  if (points >= LEVELS.Gold.min) return 'Gold';
  if (points >= LEVELS.Silver.min) return 'Silver';
  return 'Bronze';
}

/**
 * Obtener bonus por nivel
 */
export function getLevelBonus(level) {
  return LEVELS[level]?.bonus || 0;
}

/**
 * Obtener información completa del nivel
 */
export function getLevelInfo(lifetimePoints) {
  const level = getUserLevel(lifetimePoints);
  const levelData = LEVELS[level];
  const nextLevel = levelData.next;
  const nextLevelData = nextLevel ? LEVELS[nextLevel] : null;

  return {
    name: level,
    icon: levelData.icon,
    bonus: levelData.bonus,
    minPoints: levelData.min,
    nextLevel: nextLevel,
    nextLevelMin: nextLevelData?.min || null,
    nextLevelIcon: nextLevelData?.icon || null,
    progress: nextLevelData
      ? ((lifetimePoints - levelData.min) / (nextLevelData.min - levelData.min)) * 100
      : 100,
    pointsToNext: nextLevelData ? nextLevelData.min - lifetimePoints : 0,
  };
}

/**
 * Obtener boosts activos del usuario
 */
export async function getUserActiveBoosts(userId) {
  const { data: boosts, error } = await supabase
    .from('user_boosts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .or('expires_at.is.null,expires_at.gt.now()');

  if (error) {
    console.error('Error getting boosts:', error);
    return [];
  }

  return boosts || [];
}

/**
 * Obtener el multiplicador de boost activo (el mejor si hay varios)
 */
export function getActiveBoostMultiplier(boosts) {
  const miningBoosts = (boosts || []).filter(
    b => b.effect_type === 'mining_multiplier' &&
         b.is_active &&
         (!b.expires_at || new Date(b.expires_at) > new Date())
  );

  if (miningBoosts.length === 0) return 1.0;

  // Retornar el mejor multiplicador
  return Math.max(...miningBoosts.map(b => parseFloat(b.effect_value) || 1.0));
}

/**
 * Calcular puntos de minería con todos los bonuses
 * V2: Incluye level bonus, FREE mining, y boosts de tienda
 * V3: Incluye event multiplier y season multiplier
 */
export function calculateMiningPoints(user, activeBoosts = [], eventMultiplier = 1.0) {
  // V2: Si no tiene miner, usa FREE (10 pts)
  const minerLevel = user.cached_miner_level || 'Free';
  const basePoints = MINER_POINTS[minerLevel] || MINER_POINTS.Free;

  // Calcular bonuses individuales
  const streakBonus = getStreakBonus(user.current_streak || 0);
  const memeBonus = getMemeBonus(user.cached_meme_count || 0);
  const passBonus = user.cached_has_pass ? PASS_BONUS : 0;

  // V2: Agregar level bonus
  const userLevel = getUserLevel(user.lifetime_points || 0);
  const levelBonus = getLevelBonus(userLevel);

  // Sumar bonuses
  let totalBonus = streakBonus + memeBonus + passBonus + levelBonus;

  // Aplicar hard cap (100% en v2)
  if (totalBonus > BONUS_HARD_CAP) {
    totalBonus = BONUS_HARD_CAP;
  }

  // Calcular puntos con bonuses normales
  const multiplier = 1 + totalBonus;
  let points = Math.floor(basePoints * multiplier);

  // V2: Aplicar boost de tienda (multiplicador adicional)
  const boostMultiplier = getActiveBoostMultiplier(activeBoosts);
  points = Math.floor(points * boostMultiplier);

  // V3: Aplicar season multiplier (bonus por ganar temporadas anteriores)
  const seasonMultiplier = parseFloat(user.season_multiplier) || 1.0;
  points = Math.floor(points * seasonMultiplier);

  // V3: Aplicar event multiplier (Meme Monday, aniversarios, etc.)
  const finalPoints = Math.floor(points * eventMultiplier);

  return {
    points: finalPoints,
    basePoints,
    multiplier,
    minerLevel,
    boostMultiplier,
    seasonMultiplier,
    eventMultiplier,
    hasActiveBoost: boostMultiplier > 1,
    hasEventBonus: eventMultiplier > 1,
    hasSeasonBonus: seasonMultiplier > 1,
    bonuses: {
      streak: streakBonus,
      memes: memeBonus,
      pass: passBonus,
      level: levelBonus,
      total: totalBonus,
      capped: totalBonus === BONUS_HARD_CAP,
    },
  };
}

/**
 * Calcular nuevo streak basado en el inicio de sesiones
 * V3: Usa last_session_started_at (inicio de sesión anterior)
 */
export function calculateNewStreak(user) {
  // Usar last_session_started_at para el nuevo sistema, fallback a last_mining_at
  const lastSessionStart = user.last_session_started_at || user.last_mining_at;

  if (!lastSessionStart) {
    return 1; // Primera sesión
  }

  const lastSession = new Date(lastSessionStart);
  const now = new Date();

  // Calcular diferencia en horas desde el inicio de la última sesión
  const hoursDiff = (now - lastSession) / (1000 * 60 * 60);

  // Si han pasado menos de 28 horas, el streak continúa
  if (hoursDiff <= 28) {
    // Solo incrementar si ha pasado al menos 20 horas (un "nuevo día")
    if (hoursDiff >= 20) {
      return Math.min((user.current_streak || 0) + 1, 7); // Max 7
    }
    return user.current_streak || 1;
  }

  // Si han pasado más de 28 horas, el streak se rompe
  return 1;
}

// =============================================
// SISTEMA DE SESIONES V3
// =============================================

/**
 * Calcular earning rate para una sesión
 * Reutiliza calculateMiningPoints() y añade rates por tiempo
 */
export function calculateSessionEarningRate(user, activeBoosts = [], eventMultiplier = 1.0) {
  const miningData = calculateMiningPoints(user, activeBoosts, eventMultiplier);
  const totalPoints = miningData.points;

  return {
    ...miningData,
    totalPointsIn4h: totalPoints,
    perSecond: totalPoints / 14400,  // 4h = 14400 segundos
    perMinute: totalPoints / 240,     // 4h = 240 minutos
    perHour: totalPoints / 4,
  };
}

/**
 * Iniciar una nueva sesión de minado
 */
export async function startMiningSession(wallet) {
  const walletLower = wallet.toLowerCase();

  // Obtener usuario
  const user = await getOrCreateMiningUser(walletLower);

  // Verificar si puede iniciar sesión
  const { canStart, reason, sessionStartedAt } = canStartSession(user);
  if (!canStart) {
    return {
      success: false,
      error: reason,
      sessionStartedAt,
    };
  }

  // Obtener boosts activos
  const activeBoosts = await getUserActiveBoosts(user.id);

  // Obtener evento activo
  let activeEvent = null;
  let eventMultiplier = 1.0;
  try {
    const { data: eventData } = await supabase.rpc('get_active_event_multiplier');
    if (eventData && eventData.length > 0) {
      activeEvent = eventData[0];
      eventMultiplier = parseFloat(activeEvent.multiplier) || 1.0;
    }
  } catch (err) {
    console.error('Error getting active event:', err);
  }

  // Calcular nuevo streak (basado en inicio de sesión anterior)
  const newStreak = calculateNewStreak(user);
  const newMaxStreak = Math.max(newStreak, user.max_streak || 0);

  // Crear usuario temporal con nuevo streak para calcular earning rate
  const userWithNewStreak = { ...user, current_streak: newStreak };

  // Calcular earning rate con todos los bonuses
  const earningData = calculateSessionEarningRate(userWithNewStreak, activeBoosts, eventMultiplier);

  const now = new Date().toISOString();

  // Actualizar usuario: iniciar sesión
  const { error: updateError } = await supabase
    .from('mining_users')
    .update({
      mining_session_started_at: now,
      mining_session_earning_rate: earningData.perSecond,
      mining_session_total_points: earningData.totalPointsIn4h,
      current_streak: newStreak,
      max_streak: newMaxStreak,
      last_session_started_at: now, // Para calcular streak en próxima sesión
      updated_at: now,
    })
    .eq('id', user.id);

  if (updateError) throw updateError;

  // Log activity: session started
  try {
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_wallet: walletLower,
      p_event_type: 'mining_session_started',
      p_event_data: {
        minerLevel: earningData.minerLevel,
        totalPoints: earningData.totalPointsIn4h,
        earningRate: earningData.perMinute,
        streak: newStreak,
      },
      p_points_amount: null,
    });
  } catch (err) {
    console.error('Activity log error:', err);
  }

  const sessionEndsAt = new Date(Date.now() + MINING_SESSION_DURATION_MS).toISOString();

  return {
    success: true,
    session: {
      startedAt: now,
      endsAt: sessionEndsAt,
      durationMs: MINING_SESSION_DURATION_MS,
      earningRate: {
        perSecond: earningData.perSecond,
        perMinute: earningData.perMinute,
        perHour: earningData.perHour,
      },
      totalPoints: earningData.totalPointsIn4h,
      minerLevel: earningData.minerLevel,
      bonuses: earningData.bonuses,
      boostMultiplier: earningData.boostMultiplier,
      hasActiveBoost: earningData.hasActiveBoost,
      eventMultiplier: earningData.eventMultiplier,
      hasEventBonus: earningData.hasEventBonus,
    },
    streak: {
      current: newStreak,
      max: newMaxStreak,
      bonus: getStreakBonus(newStreak),
    },
    activeEvent: activeEvent ? {
      name: activeEvent.event_name,
      icon: activeEvent.icon,
      multiplier: eventMultiplier,
    } : null,
  };
}

/**
 * Obtener estado de la sesión de minado actual
 */
export async function getMiningSessionStatus(wallet) {
  const user = await getMiningUser(wallet);

  if (!user) {
    return { error: 'USER_NOT_FOUND' };
  }

  if (!user.mining_session_started_at) {
    return {
      hasActiveSession: false,
      canStartSession: true,
      lastSessionEndedAt: user.last_mining_at,
    };
  }

  const sessionStart = new Date(user.mining_session_started_at).getTime();
  const now = Date.now();
  const elapsedMs = now - sessionStart;
  const isComplete = elapsedMs >= MINING_SESSION_DURATION_MS;

  // Calcular puntos acumulados
  const effectiveElapsed = Math.min(elapsedMs, MINING_SESSION_DURATION_MS);
  const pointsAccumulated = (effectiveElapsed / 1000) * (user.mining_session_earning_rate || 0);

  // Determinar si puede hacer claim
  const minerLevel = user.cached_miner_level || 'Free';
  const minPoints = MIN_CLAIM_POINTS[minerLevel] || MIN_CLAIM_POINTS.Free;
  const canClaim = pointsAccumulated >= minPoints;

  return {
    hasActiveSession: true,
    session: {
      startedAt: user.mining_session_started_at,
      endsAt: new Date(sessionStart + MINING_SESSION_DURATION_MS).toISOString(),
      elapsedMs: effectiveElapsed,
      remainingMs: Math.max(0, MINING_SESSION_DURATION_MS - elapsedMs),
      isComplete,
      earningRate: {
        perSecond: user.mining_session_earning_rate,
        perMinute: (user.mining_session_earning_rate || 0) * 60,
      },
      pointsAccumulated: Math.floor(pointsAccumulated * 100) / 100, // 2 decimales
      totalPoints: user.mining_session_total_points,
      progress: (effectiveElapsed / MINING_SESSION_DURATION_MS) * 100,
      minerLevel,
    },
    claim: {
      canClaim,
      minPoints,
      currentPoints: Math.floor(pointsAccumulated * 100) / 100,
    },
  };
}

/**
 * Reclamar puntos de la sesión de minado
 */
export async function claimMiningSession(wallet) {
  const walletLower = wallet.toLowerCase();
  const user = await getMiningUser(walletLower);

  if (!user) {
    return { success: false, error: 'USER_NOT_FOUND' };
  }

  if (!user.mining_session_started_at) {
    return { success: false, error: 'NO_ACTIVE_SESSION' };
  }

  // Calcular puntos acumulados
  const sessionStart = new Date(user.mining_session_started_at).getTime();
  const elapsedMs = Math.min(Date.now() - sessionStart, MINING_SESSION_DURATION_MS);
  const pointsAccumulated = Math.floor((elapsedMs / 1000) * (user.mining_session_earning_rate || 0));

  // Verificar mínimo
  const minerLevel = user.cached_miner_level || 'Free';
  const minPoints = MIN_CLAIM_POINTS[minerLevel] || MIN_CLAIM_POINTS.Free;

  if (pointsAccumulated < minPoints) {
    return {
      success: false,
      error: 'MIN_POINTS_NOT_REACHED',
      currentPoints: pointsAccumulated,
      minPoints,
    };
  }

  const points = pointsAccumulated;
  const newLifetimePoints = (user.lifetime_points || 0) + points;
  const newSeasonPoints = (user.season_points || 0) + points;
  const now = new Date().toISOString();

  // Actualizar usuario: dar puntos y limpiar sesión
  const { error: updateError } = await supabase
    .from('mining_users')
    .update({
      lifetime_points: newLifetimePoints,
      season_points: newSeasonPoints,
      total_mines: (user.total_mines || 0) + 1,
      last_mining_at: now,
      mining_session_started_at: null,
      mining_session_earning_rate: null,
      mining_session_total_points: null,
      updated_at: now,
    })
    .eq('id', user.id);

  if (updateError) throw updateError;

  // Registrar transacción
  const sessionDurationMin = Math.floor(elapsedMs / 60000);
  const { data: txData, error: txError } = await supabase
    .from('mining_transactions')
    .insert({
      user_id: user.id,
      amount: points,
      type: 'mining',
      description: `${minerLevel === 'Free' ? 'Free' : minerLevel} Mining Session (${sessionDurationMin}min)`,
      miner_level: minerLevel,
      streak_at_time: user.current_streak,
      bonuses_applied: {
        sessionDuration: elapsedMs,
        earningRate: user.mining_session_earning_rate,
      },
    })
    .select('id')
    .single();

  if (txError) console.error('Error logging transaction:', txError);

  // Season points
  try {
    await supabase.rpc('add_season_points', {
      p_user_id: user.id,
      p_points: points,
    });
  } catch (err) {
    console.error('Error adding season points:', err);
  }

  // Referral bonuses
  try {
    await supabase.rpc('award_referral_mining_bonus', {
      p_referred_id: user.id,
      p_mining_points: points,
      p_transaction_id: txData?.id || null,
    });
    await supabase.rpc('check_referral_milestone', {
      p_referred_id: user.id,
    });
  } catch (err) {
    console.error('Referral bonus error:', err);
  }

  // Verificar y otorgar badges
  const updatedUserData = {
    ...user,
    lifetime_points: newLifetimePoints,
    total_mines: (user.total_mines || 0) + 1,
  };
  const newBadges = await checkAndAwardBadges(user.id, updatedUserData);

  // Calcular nivel
  const newLevel = getUserLevel(newLifetimePoints);
  const levelInfo = getLevelInfo(newLifetimePoints);
  const previousLevel = getUserLevel(user.lifetime_points || 0);

  // Log activity
  try {
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_wallet: walletLower,
      p_event_type: 'mining_claimed',
      p_event_data: {
        minerLevel,
        sessionDuration: elapsedMs,
      },
      p_points_amount: points,
    });

    // Level up notification
    if (newLevel !== previousLevel) {
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_wallet: walletLower,
        p_event_type: 'level_up',
        p_event_data: { newLevel, icon: LEVELS[newLevel]?.icon },
        p_points_amount: null,
      });

      await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'level_up',
        p_title: `Level Up! ${LEVELS[newLevel]?.icon}`,
        p_message: `You've reached ${newLevel} level with +${(LEVELS[newLevel]?.bonus * 100).toFixed(0)}% mining bonus.`,
        p_icon: LEVELS[newLevel]?.icon || '🏆',
        p_action_url: '/mine',
      });
    }

    // Badge notifications
    for (const badge of newBadges) {
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_wallet: walletLower,
        p_event_type: 'badge_earned',
        p_event_data: { badge: badge.name, icon: badge.icon },
        p_points_amount: null,
      });

      await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'badge_earned',
        p_title: `New Badge: ${badge.name}`,
        p_message: badge.description || `You've earned the ${badge.name} badge!`,
        p_icon: badge.icon || '🏅',
        p_action_url: '/dashboard',
      });
    }
  } catch (err) {
    console.error('Activity log error:', err);
  }

  return {
    success: true,
    claimed: {
      points,
      sessionDuration: elapsedMs,
      sessionDurationFormatted: `${sessionDurationMin} minutes`,
    },
    user: {
      lifetimePoints: newLifetimePoints,
      seasonPoints: newSeasonPoints,
      level: newLevel,
    },
    levelInfo,
    newBadges,
    leveledUp: newLevel !== previousLevel,
    canStartNewSession: true,
  };
}

/**
 * @deprecated Usar startMiningSession() + claimMiningSession() para el nuevo sistema
 * Ejecutar minería
 * V2: Permite FREE mining sin NFT, aplica boosts de tienda
 * V3: Aplica multiplicadores de eventos y temporadas
 */
export async function performMining(wallet) {
  const walletLower = wallet.toLowerCase();

  // Obtener usuario
  const user = await getOrCreateMiningUser(walletLower);

  // Verificar cooldown
  const { canMine: canMineNow, reason, waitTime } = canMine(user);
  if (!canMineNow) {
    return {
      success: false,
      error: reason,
      waitTime,
    };
  }

  // V2: Obtener boosts activos del usuario
  const activeBoosts = await getUserActiveBoosts(user.id);

  // V3: Obtener evento activo con mayor multiplicador
  let activeEvent = null;
  let eventMultiplier = 1.0;
  try {
    const { data: eventData } = await supabase.rpc('get_active_event_multiplier');
    if (eventData && eventData.length > 0) {
      activeEvent = eventData[0];
      eventMultiplier = parseFloat(activeEvent.multiplier) || 1.0;
    }
  } catch (eventErr) {
    console.error('Error getting active event:', eventErr);
  }

  // Calcular puntos (V3: incluye event multiplier)
  const { points, basePoints, multiplier, minerLevel, bonuses, boostMultiplier, hasActiveBoost, seasonMultiplier, hasEventBonus, hasSeasonBonus } = calculateMiningPoints(user, activeBoosts, eventMultiplier);

  // Calcular nuevo streak
  const newStreak = calculateNewStreak(user);
  const newMaxStreak = Math.max(newStreak, user.max_streak || 0);

  // Actualizar usuario (incluyendo total_mines)
  const { error: updateError } = await supabase
    .from('mining_users')
    .update({
      lifetime_points: user.lifetime_points + points,
      season_points: user.season_points + points,
      current_streak: newStreak,
      max_streak: newMaxStreak,
      total_mines: (user.total_mines || 0) + 1,
      last_mining_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) throw updateError;

  // Registrar transacción (V3: incluye minerLevel, boost info, y event info)
  const boostDesc = hasActiveBoost ? ` (${boostMultiplier}x boost)` : '';
  const eventDesc = hasEventBonus ? ` [${activeEvent?.event_name || 'Event'} ${eventMultiplier}x]` : '';
  const seasonDesc = hasSeasonBonus ? ` (+${((seasonMultiplier - 1) * 100).toFixed(0)}% season)` : '';
  const { data: txData, error: txError } = await supabase
    .from('mining_transactions')
    .insert({
      user_id: user.id,
      amount: points,
      type: 'mining',
      description: (minerLevel === 'Free' ? 'Free Mining' : `Mined with ${minerLevel} Miner`) + boostDesc + eventDesc + seasonDesc,
      miner_level: minerLevel,
      streak_at_time: newStreak,
      bonuses_applied: { ...bonuses, boostMultiplier, eventMultiplier, seasonMultiplier },
    })
    .select('id')
    .single();

  if (txError) console.error('Error logging transaction:', txError);

  // V3: Registrar puntos en la temporada activa
  try {
    await supabase.rpc('add_season_points', {
      p_user_id: user.id,
      p_points: points,
    });
  } catch (seasonErr) {
    console.error('Error adding season points:', seasonErr);
  }

  // Award referral bonuses (5% to referrer, milestone check)
  let referralBonusAwarded = 0;
  try {
    // Call the database function to award 5% bonus to referrer
    const { data: bonusResult } = await supabase.rpc('award_referral_mining_bonus', {
      p_referred_id: user.id,
      p_mining_points: points,
      p_transaction_id: txData?.id || null,
    });
    referralBonusAwarded = bonusResult || 0;

    // Check for milestone bonus (100 pts when referral reaches 10 mines)
    await supabase.rpc('check_referral_milestone', {
      p_referred_id: user.id,
    });
  } catch (refErr) {
    console.error('Referral bonus error:', refErr);
  }

  // Verificar y otorgar badges
  const newLifetimePoints = user.lifetime_points + points;
  const updatedUserData = {
    ...user,
    lifetime_points: newLifetimePoints,
    current_streak: newStreak,
    total_mines: (user.total_mines || 0) + 1,
  };
  const newBadges = await checkAndAwardBadges(user.id, updatedUserData);

  // V2: Calcular nivel actualizado
  const newLevel = getUserLevel(newLifetimePoints);
  const levelInfo = getLevelInfo(newLifetimePoints);
  const previousLevel = getUserLevel(user.lifetime_points || 0);

  // Log activity: mining event
  try {
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_wallet: walletLower,
      p_event_type: 'mining',
      p_event_data: {
        minerLevel,
        boostMultiplier: hasActiveBoost ? boostMultiplier : null,
        eventMultiplier: hasEventBonus ? eventMultiplier : null,
        eventName: activeEvent?.event_name || null,
      },
      p_points_amount: points,
    });

    // Log level up if applicable
    if (newLevel !== previousLevel) {
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_wallet: walletLower,
        p_event_type: 'level_up',
        p_event_data: { newLevel, icon: LEVELS[newLevel]?.icon },
        p_points_amount: null,
      });

      // Create notification for level up
      await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'level_up',
        p_title: `Level Up! ${LEVELS[newLevel]?.icon}`,
        p_message: `Congratulations! You've reached ${newLevel} level with +${(LEVELS[newLevel]?.bonus * 100).toFixed(0)}% mining bonus.`,
        p_icon: LEVELS[newLevel]?.icon || '🏆',
        p_action_url: '/dashboard',
      });
    }

    // Log badges earned
    for (const badge of newBadges) {
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_wallet: walletLower,
        p_event_type: 'badge_earned',
        p_event_data: { badge: badge.name, icon: badge.icon },
        p_points_amount: null,
      });

      // Create notification for badge earned
      await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'badge_earned',
        p_title: `New Badge: ${badge.name}`,
        p_message: badge.description || `You've earned the ${badge.name} badge!`,
        p_icon: badge.icon || '🏅',
        p_action_url: '/dashboard',
      });
    }
  } catch (activityErr) {
    console.error('Activity log error:', activityErr);
  }

  return {
    success: true,
    points,
    basePoints,
    multiplier,
    minerLevel,
    bonuses,
    boostMultiplier,
    hasActiveBoost,
    seasonMultiplier,
    hasSeasonBonus,
    eventMultiplier,
    hasEventBonus,
    activeEvent: activeEvent ? {
      name: activeEvent.event_name,
      icon: activeEvent.icon,
      multiplier: eventMultiplier,
      endsAt: activeEvent.ends_at,
    } : null,
    newStreak,
    totalPoints: newLifetimePoints,
    seasonPoints: user.season_points + points,
    newBadges,
    level: {
      name: newLevel,
      ...levelInfo,
    },
  };
}

// =============================================
// FUNCIONES DE LEADERBOARD
// =============================================

/**
 * Obtener leaderboard
 */
export async function getLeaderboard(limit = 100) {
  const { data, error } = await supabase
    .from('mining_leaderboard')
    .select('*')
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Obtener rank de un usuario
 */
export async function getUserRank(wallet) {
  const { data, error } = await supabase
    .from('mining_leaderboard')
    .select('rank')
    .eq('wallet', wallet.toLowerCase())
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data?.rank;
}

// =============================================
// FUNCIONES DE TEMPORADA
// =============================================

/**
 * Obtener temporada activa
 */
export async function getActiveSeason() {
  const { data, error } = await supabase
    .from('mining_seasons')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

// =============================================
// FUNCIONES DE BADGES
// =============================================

/**
 * Verificar y otorgar badges al usuario
 * Retorna lista de badges recién otorgados
 */
export async function checkAndAwardBadges(userId, userData = null) {
  try {
    // Obtener datos del usuario si no se proporcionaron
    let user = userData;
    if (!user) {
      const { data, error } = await supabase
        .from('mining_users')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      user = data;
    }

    // Obtener definiciones de badges activos
    const { data: badgeDefs, error: badgeError } = await supabase
      .from('badge_definitions')
      .select('*')
      .eq('is_active', true);

    if (badgeError) throw badgeError;

    // Obtener badges que ya tiene el usuario
    const { data: existingBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const ownedBadgeIds = new Set((existingBadges || []).map(b => b.badge_id));
    const newlyAwarded = [];

    // Verificar cada badge
    for (const badge of badgeDefs) {
      // Si ya lo tiene, saltar
      if (ownedBadgeIds.has(badge.id)) continue;

      let shouldAward = false;
      let earnedValue = null;

      switch (badge.requirement_type) {
        case 'lifetime_points_gte':
          if (user.lifetime_points >= badge.requirement_value) {
            shouldAward = true;
            earnedValue = user.lifetime_points;
          }
          break;

        case 'current_streak_gte':
          if (user.current_streak >= badge.requirement_value) {
            shouldAward = true;
            earnedValue = user.current_streak;
          }
          break;

        case 'total_mines_gte':
          if ((user.total_mines || 0) >= badge.requirement_value) {
            shouldAward = true;
            earnedValue = user.total_mines;
          }
          break;

        case 'meme_count_gte':
          if ((user.cached_meme_count || 0) >= badge.requirement_value) {
            shouldAward = true;
            earnedValue = user.cached_meme_count;
          }
          break;

        case 'meme_count_all':
          // TODO: Obtener total de memes del sistema
          // Por ahora se maneja manualmente
          break;

        case 'has_pass':
          if (user.cached_has_pass === true) {
            shouldAward = true;
          }
          break;

        // Otros tipos se manejarán cuando se implementen sus sistemas
        default:
          break;
      }

      if (shouldAward) {
        const { error: insertError } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id,
            earned_value: earnedValue,
          });

        if (!insertError) {
          newlyAwarded.push({
            id: badge.id,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            category: badge.category,
          });
        }
      }
    }

    return newlyAwarded;
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
}

/**
 * Obtener todos los badges del usuario (desbloqueados y bloqueados)
 */
export async function getUserBadges(userId) {
  try {
    // Obtener definiciones de badges activos
    const { data: badgeDefs, error: badgeError } = await supabase
      .from('badge_definitions')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (badgeError) throw badgeError;

    // Obtener badges del usuario
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at, earned_value')
      .eq('user_id', userId);

    const userBadgeMap = new Map(
      (userBadges || []).map(b => [b.badge_id, b])
    );

    // Combinar información
    return badgeDefs.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      colorFrom: badge.color_from,
      colorTo: badge.color_to,
      unlocked: userBadgeMap.has(badge.id),
      earnedAt: userBadgeMap.get(badge.id)?.earned_at || null,
      earnedValue: userBadgeMap.get(badge.id)?.earned_value || null,
    }));
  } catch (error) {
    console.error('Error getting user badges:', error);
    return [];
  }
}
