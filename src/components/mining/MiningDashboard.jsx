'use client';

import { useState, useEffect } from 'react';
import { useMining } from '@/hooks/useMining';
import { useAccount } from 'wagmi';
import Image from 'next/image';
import { useTheme } from '@/hooks/useTheme';

// =============================================
// CONFIGURACIÓN DE MINERS
// =============================================
const MINER_CONFIG = {
  Free: {
    name: 'Free Mining',
    image: '/images/logo/Logo.png',
    basePoints: 15,
    color: 'from-slate-500 to-slate-600',
    glow: 'shadow-slate-500/30',
    border: 'border-slate-500/50',
  },
  Basic: {
    name: 'Basic Miner',
    image: '/images/Miners/MinerBasic.png',
    basePoints: 50,
    color: 'from-amber-600 to-amber-700',
    glow: 'shadow-amber-500/30',
    border: 'border-amber-500/50',
  },
  Pro: {
    name: 'Pro Miner',
    image: '/images/Miners/MinerPro.png',
    basePoints: 150,
    color: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/30',
    border: 'border-blue-500/50',
  },
  Ultra: {
    name: 'Ultra Miner',
    image: '/images/Miners/UltraMiner.png',
    basePoints: 400,
    color: 'from-purple-500 to-pink-500',
    glow: 'shadow-purple-500/30',
    border: 'border-purple-500/50',
  },
};

// =============================================
// CLAIM MODAL - Floating modal when session complete
// =============================================
function ClaimModal({ points, onClaim, onClose }) {
  const [status, setStatus] = useState('idle'); // idle | claiming | success
  const [isClosing, setIsClosing] = useState(false);

  const handleClaim = async () => {
    setStatus('claiming');
    try {
      const result = await onClaim();
      if (result?.success) {
        setStatus('success');
        // Mostrar "Claimed!" por 1.5s, luego fade out y cerrar
        setTimeout(() => {
          setIsClosing(true);
          setTimeout(onClose, 300);
        }, 1500);
      } else {
        setStatus('idle');
      }
    } catch {
      setStatus('idle');
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={status === 'idle' ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={`relative z-10 w-full max-w-sm transition-all duration-300 ${isClosing ? 'scale-95' : 'scale-100'}`}
        style={{
          backgroundColor: 'var(--color-white, #fffef5)',
          border: '4px solid #3e2723',
          borderRadius: '12px 20px 16px 18px',
          boxShadow: '6px 6px 0px #3e2723',
          transform: 'rotate(-1deg)',
          animation: 'bounce-in 0.4s ease-out',
        }}
      >
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="text-6xl mb-4">
            {status === 'success' ? '✅' : '🎉'}
          </div>

          {/* Title */}
          <h2
            className="text-3xl mb-2"
            style={{
              fontFamily: '"Permanent Marker", cursive',
              color: '#3e2723',
              textShadow: '3px 3px 0px #ffb300',
              transform: 'rotate(-1deg)',
            }}
          >
            {status === 'success' ? 'Claimed!' : 'Mining Complete!'}
          </h2>

          {/* Subtitle */}
          <p
            className="text-base mb-4"
            style={{
              fontFamily: 'var(--font-sketch), cursive',
              color: 'var(--color-ink-light)',
            }}
          >
            {status === 'success' ? 'Points added to your balance' : 'Your miner worked for 4 hours'}
          </p>

          {/* Points */}
          <div
            className="text-4xl mb-6"
            style={{
              fontFamily: '"Permanent Marker", cursive',
              color: status === 'success' ? '#22c55e' : '#f97316',
              textShadow: '2px 2px 0px #3e2723',
            }}
          >
            {status === 'success' ? '+' : '⭐ '}{points.toFixed(1)} pts
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={status !== 'idle'}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: status === 'success' ? '#22c55e' : status === 'claiming' ? '#d1d5db' : '#ffb300',
              color: status === 'success' ? 'white' : '#3e2723',
              border: '3px solid #3e2723',
              borderRadius: '8px 14px 10px 12px',
              boxShadow: status === 'idle' ? '4px 4px 0px #3e2723' : 'none',
              fontFamily: '"Permanent Marker", cursive',
              fontSize: '1.25rem',
              cursor: status === 'idle' ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
            }}
          >
            {status === 'claiming' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Claiming...
              </span>
            ) : status === 'success' ? (
              <span>✓ Claimed!</span>
            ) : (
              <span>Claim Points</span>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.8) rotate(-1deg); opacity: 0; }
          50% { transform: scale(1.05) rotate(-1deg); }
          100% { transform: scale(1) rotate(-1deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// =============================================
// MAIN COMPONENT
// =============================================
export default function MiningDashboard() {
  const { isConnected } = useAccount();
  const {
    user,
    loading,
    error,
    register,
    // V3: Session states
    session,
    sessionComplete,
    livePoints,
    liveRemainingMs,
    starting,
    claiming,
    lastResult,
    startSession,
    claimSession,
  } = useMining();

  // V3: Modal de claim cuando sesión completa
  // Usamos sessionComplete del servidor (fuente de verdad) en lugar de liveRemainingMs === 0
  // para evitar que el modal aparezca incorrectamente al iniciar sesión
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Mostrar modal cuando la sesión se completa (según el servidor)
  useEffect(() => {
    if (sessionComplete && !showClaimModal) {
      setShowClaimModal(true);
    }
  }, [sessionComplete]);

  const handleClaimFromModal = async () => {
    return await claimSession();
  };

  if (!isConnected) {
    return <NotConnectedState />;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (!user?.registered) {
    return <NotRegisteredState onRegister={register} loading={loading} />;
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Modal de Claim */}
      {showClaimModal && (
        <ClaimModal
          points={livePoints}
          claiming={claiming}
          onClaim={handleClaimFromModal}
          onClose={() => setShowClaimModal(false)}
        />
      )}

      {/* Header Stats Bar */}
      <HeaderStats user={user} />

      {/* Main Miner Card - V3 */}
      <MinerCard
        user={user}
        session={session}
        sessionComplete={sessionComplete}
        livePoints={livePoints}
        liveRemainingMs={liveRemainingMs}
        starting={starting}
        claiming={claiming}
        onStartSession={startSession}
        onClaim={claimSession}
        lastResult={lastResult}
      />

      {/* Bonuses Breakdown */}
      <BonusesCard user={user} />

      {/* Next Goals */}
      <GoalsCard user={user} />

      {/* Badges Preview */}
      <BadgesCard user={user} />

      {/* Error Display */}
      {error && (
        <ErrorDisplay error={error} />
      )}
    </div>
  );
}

// =============================================
// HEADER STATS BAR
// =============================================
function HeaderStats({ user }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const badgeStyle = isLight ? {
    backgroundColor: 'var(--color-white)',
    border: '2px solid var(--border-sketch)',
    borderRadius: '9999px',
  } : {};

  return (
    <div className="flex items-center justify-between gap-2">
      {/* Season Badge */}
      {user.season && (
        <div
          className={isLight ? 'flex items-center gap-1.5 px-3 py-1.5' : 'flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-card)] rounded-full border border-[var(--bg-elevated)]'}
          style={badgeStyle}
        >
          <span className="text-xs">🏆</span>
          <span
            className="text-xs font-medium"
            style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
          >
            {user.season.name}
          </span>
        </div>
      )}

      {/* Streak Badge */}
      <div
        className={isLight ? 'flex items-center gap-1.5 px-3 py-1.5' : `flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
          user.streak?.current >= 7
            ? 'bg-orange-500/20 border-orange-500/30'
            : user.streak?.current >= 3
            ? 'bg-yellow-500/20 border-yellow-500/30'
            : 'bg-[var(--bg-card)] border-[var(--bg-elevated)]'
        }`}
        style={badgeStyle}
      >
        <span className="text-xs">🔥</span>
        <span
          className="text-xs font-bold"
          style={{
            color: isLight
              ? (user.streak?.current >= 7 ? 'var(--color-accent)' : 'var(--color-ink)')
              : (user.streak?.current >= 7 ? '#fb923c' : user.streak?.current >= 3 ? '#facc15' : 'white')
          }}
        >
          {user.streak?.current || 0} days
        </span>
      </div>

      {/* Rank Badge */}
      {user.rank && (
        <div
          className={isLight ? 'flex items-center gap-1.5 px-3 py-1.5' : 'flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-card)] rounded-full border border-[var(--bg-elevated)]'}
          style={badgeStyle}
        >
          <span className="text-xs">📊</span>
          <span
            className="text-xs font-medium"
            style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
          >
            #{user.rank}
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================
// MINER CARD - Main mining interface (V3: Session-based)
// =============================================
function MinerCard({ user, session, sessionComplete, livePoints, liveRemainingMs, starting, claiming, onStartSession, onClaim, lastResult }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [showSuccess, setShowSuccess] = useState(false);
  const [floatingPoints, setFloatingPoints] = useState(null);

  // V3: Estado derivado de la sesión
  // Usamos sessionComplete del servidor (fuente de verdad)
  const hasSession = !!session?.active;
  const isComplete = sessionComplete;
  const minClaimPoints = session?.minClaimPoints || 5;
  const canClaim = hasSession && livePoints >= minClaimPoints;

  const minerLevel = user.miner?.level || 'Free';
  const miner = MINER_CONFIG[minerLevel] || MINER_CONFIG.Free;

  // V3: Progress y tiempo (usando liveRemainingMs para tiempo real)
  const sessionDurationMs = 4 * 60 * 60 * 1000;
  const sessionProgress = hasSession ? ((sessionDurationMs - liveRemainingMs) / sessionDurationMs) * 100 : 0;
  const remainingHours = Math.floor(liveRemainingMs / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((liveRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const remainingSeconds = Math.floor((liveRemainingMs % (1000 * 60)) / 1000);

  // Success animation
  useEffect(() => {
    if (lastResult?.success && lastResult?.pointsClaimed) {
      setShowSuccess(true);
      setFloatingPoints(lastResult.pointsClaimed);

      const timer = setTimeout(() => {
        setShowSuccess(false);
        setFloatingPoints(null);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [lastResult]);

  const potentialPoints = user.mining?.potentialPoints || miner.basePoints;
  const totalBonus = user.mining?.bonuses?.total || 0;

  // V3: Earning rate display
  const earningRatePerMin = session?.earningRate?.perMinute || (potentialPoints / 240);

  return (
    <div
      className={`relative overflow-hidden ${isLight ? '' : `border-2 ${miner.border}`}`}
      style={{
        backgroundColor: isLight ? 'var(--color-white)' : 'var(--bg-card)',
        border: isLight ? '3px solid var(--border-sketch)' : undefined,
        borderRadius: isLight ? '8px 18px 12px 15px' : '16px',
        boxShadow: isLight ? '4px 4px 0px var(--color-ink)' : undefined,
        transform: isLight ? 'rotate(-0.3deg)' : undefined,
      }}
    >
      {/* Background gradient */}
      {!isLight && <div className={`absolute inset-0 bg-gradient-to-br ${miner.color} opacity-10`} />}

      {/* Floating points animation */}
      {floatingPoints && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div
            className="animate-float-up text-4xl font-bold"
            style={{ color: isLight ? 'var(--color-accent)' : 'var(--accent-primary)' }}
          >
            +{floatingPoints}
          </div>
        </div>
      )}

      {/* Success overlay */}
      {showSuccess && (
        <div
          className="absolute inset-0 z-20 animate-pulse"
          style={{
            backgroundColor: isLight ? 'rgba(255, 140, 0, 0.1)' : 'rgba(var(--accent-primary-rgb), 0.1)',
          }}
        />
      )}

      <div className="relative z-10 p-5">
        {/* Points Display */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-3xl">⭐</span>
            <span
              className="text-4xl font-bold"
              style={{
                color: isLight ? 'var(--color-ink)' : 'white',
                fontFamily: isLight ? 'var(--font-heading), "Permanent Marker", cursive' : undefined,
              }}
            >
              {user.points?.lifetime?.toLocaleString() || '0'}
            </span>
            <span
              className="text-lg"
              style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
            >
              pts
            </span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">{user.level?.icon || '🥉'}</span>
            <span
              className="font-medium"
              style={{ color: isLight ? 'var(--color-ink)' : 'var(--text-secondary)' }}
            >
              {user.level?.name || 'Bronze'}
            </span>
            {user.level?.bonus > 0 && (
              <span
                className="text-sm"
                style={{ color: isLight ? 'var(--color-accent)' : 'var(--accent-primary)' }}
              >
                +{(user.level.bonus * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Miner NFT Display */}
        <div className="flex justify-center mb-4">
          <div
            className={`relative w-40 h-40 overflow-hidden ${isLight ? '' : `border-2 ${miner.border} ${miner.glow} shadow-xl`} ${hasSession && !isComplete ? 'animate-pulse' : ''}`}
            style={{
              borderRadius: isLight ? '10px 18px 12px 16px' : '16px',
              border: isLight ? '3px solid var(--border-sketch)' : undefined,
              boxShadow: isLight ? '3px 3px 0px var(--color-ink)' : undefined,
            }}
          >
            <img
              src={miner.image}
              alt={miner.name}
              className="w-full h-full object-contain"
              style={{ backgroundColor: isLight ? 'var(--color-paper)' : 'var(--bg-elevated)' }}
            />
            {/* Level badge */}
            <div
              className={`absolute bottom-0 inset-x-0 py-1.5 px-2 text-center ${isLight ? '' : `bg-gradient-to-r ${miner.color}`}`}
              style={{
                backgroundColor: isLight ? 'var(--color-gold)' : undefined,
                borderTop: isLight ? '2px solid var(--border-sketch)' : undefined,
              }}
            >
              <span
                className="text-xs font-bold"
                style={{
                  color: isLight ? 'var(--color-ink)' : 'white',
                  fontFamily: isLight ? 'var(--font-sketch), cursive' : undefined,
                }}
              >
                {miner.name}
              </span>
            </div>
          </div>
        </div>

        {/* V3: Session info o Points calculation */}
        {hasSession ? (
          // Sesión activa: mostrar puntos acumulados y earning rate
          <div className="text-center mb-4">
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: isLight ? 'var(--color-accent)' : 'var(--accent-primary)' }}
            >
              {livePoints.toFixed(2)} pts
            </div>
            <div
              className="text-xs"
              style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
            >
              {earningRatePerMin.toFixed(2)} pts/min • {session?.totalPoints || potentialPoints} pts total
            </div>
            {user.mining?.hasActiveBoost && (
              <div
                className="mt-1 text-xs font-medium"
                style={{ color: isLight ? 'var(--color-gold)' : '#facc15' }}
              >
                ⚡ {user.mining.boostMultiplier}x Boost Active!
              </div>
            )}
          </div>
        ) : (
          // Sin sesión: mostrar cálculo de puntos potenciales
          <div className="text-center mb-4">
            <div
              className="text-sm"
              style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-secondary)' }}
            >
              <span
                className="font-medium"
                style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
              >
                {miner.basePoints}
              </span>{' '}
              base
              {totalBonus > 0 && (
                <>
                  <span className="mx-1">×</span>
                  <span
                    className="font-medium"
                    style={{ color: isLight ? 'var(--color-accent)' : 'var(--accent-primary)' }}
                  >
                    {(1 + totalBonus).toFixed(2)}x
                  </span>
                </>
              )}
              <span className="mx-1">=</span>
              <span
                className="font-bold text-lg"
                style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
              >
                {potentialPoints} pts/4h
              </span>
            </div>
            {user.mining?.hasActiveBoost && (
              <div
                className="mt-1 text-xs font-medium"
                style={{ color: isLight ? 'var(--color-gold)' : '#facc15' }}
              >
                ⚡ {user.mining.boostMultiplier}x Boost Active!
              </div>
            )}
          </div>
        )}

        {/* V3: Progress bar */}
        <div className="mb-4">
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{
              backgroundColor: isLight ? 'var(--color-paper-dark)' : 'var(--bg-elevated)',
              border: isLight ? '1px solid var(--border-sketch)' : undefined,
            }}
          >
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isLight
                  ? ''
                  : hasSession
                    ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]'
                    : 'bg-[var(--accent-primary)]'
              }`}
              style={{
                width: hasSession ? `${sessionProgress}%` : '100%',
                backgroundColor: isLight ? 'var(--color-accent)' : undefined,
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span
              className="text-xs"
              style={{
                color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)',
                fontFamily: isLight ? 'var(--font-sketch), cursive' : undefined,
              }}
            >
              {!hasSession
                ? 'Ready to mine!'
                : isComplete
                  ? 'Mining complete!'
                  : `Mining... ${sessionProgress.toFixed(0)}%`}
            </span>
            {hasSession && !isComplete && (
              <span
                className="text-xs font-mono"
                style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
              >
                {String(remainingHours).padStart(2, '0')}:
                {String(remainingMinutes).padStart(2, '0')}:
                {String(remainingSeconds).padStart(2, '0')} left
              </span>
            )}
          </div>
        </div>

        {/* V3: Action Buttons */}
        {!hasSession ? (
          // Sin sesión: botón Start Mining
          <button
            onClick={onStartSession}
            disabled={starting}
            className={`w-full py-4 font-bold text-lg transition-all duration-300 ${
              isLight
                ? ''
                : !starting
                  ? `bg-gradient-to-r ${miner.color} text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-lg ${miner.glow} rounded-xl`
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed rounded-xl'
            }`}
            style={isLight ? {
              backgroundColor: !starting ? 'var(--color-gold)' : 'var(--color-paper-dark)',
              color: !starting ? 'var(--color-ink)' : 'var(--color-ink-light)',
              border: '2px solid var(--border-sketch)',
              borderRadius: '6px 12px 8px 10px',
              boxShadow: !starting ? '3px 3px 0px var(--color-ink)' : 'none',
              fontFamily: 'var(--font-sketch), cursive',
              cursor: !starting ? 'pointer' : 'not-allowed',
            } : undefined}
          >
            {starting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Starting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                ⛏️ Start Mining
              </span>
            )}
          </button>
        ) : (
          // Con sesión: botón Claim
          <button
            onClick={onClaim}
            disabled={claiming || !canClaim}
            className={`w-full py-4 font-bold text-lg transition-all duration-300 ${
              isLight
                ? ''
                : canClaim && !claiming
                  ? `bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/30 rounded-xl`
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed rounded-xl'
            }`}
            style={isLight ? {
              backgroundColor: canClaim && !claiming ? 'var(--color-accent)' : 'var(--color-paper-dark)',
              color: canClaim && !claiming ? 'var(--color-white)' : 'var(--color-ink-light)',
              border: '2px solid var(--border-sketch)',
              borderRadius: '6px 12px 8px 10px',
              boxShadow: canClaim && !claiming ? '3px 3px 0px var(--color-ink)' : 'none',
              fontFamily: 'var(--font-sketch), cursive',
              cursor: canClaim && !claiming ? 'pointer' : 'not-allowed',
            } : undefined}
          >
            {claiming ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Claiming...
              </span>
            ) : canClaim ? (
              <span className="flex items-center justify-center gap-2">
                💰 Claim {livePoints.toFixed(1)} pts
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                ⏳ {livePoints.toFixed(2)} pts...
              </span>
            )}
          </button>
        )}

        {/* V3: Session info message */}
        {hasSession && isComplete && (
          <div
            className="mt-3 p-2 rounded-lg"
            style={{
              backgroundColor: isLight ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              border: isLight ? '1px dashed var(--color-accent)' : '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: isLight ? '5px 10px 7px 8px' : '8px',
            }}
          >
            <p
              className="text-xs text-center"
              style={{ color: isLight ? 'var(--color-accent)' : '#22c55e' }}
            >
              🎉 Mining session complete! Claim your {livePoints.toFixed(1)} points.
            </p>
          </div>
        )}

        {/* Streak info (cuando no hay sesión) */}
        {!hasSession && user.streak?.current > 0 && (
          <div
            className="mt-3 p-2 rounded-lg"
            style={{
              backgroundColor: isLight ? 'rgba(255, 140, 0, 0.1)' : 'rgba(249, 115, 22, 0.1)',
              border: isLight ? '1px dashed var(--color-accent)' : '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: isLight ? '5px 10px 7px 8px' : '8px',
            }}
          >
            <p
              className="text-xs text-center"
              style={{ color: isLight ? 'var(--color-accent)' : '#fb923c' }}
            >
              🔥 {user.streak.current}-day streak active! Start mining to keep it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// BONUSES CARD
// =============================================
function BonusesCard({ user }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const bonuses = user.mining?.bonuses || {};
  const [expanded, setExpanded] = useState(false);

  const bonusItems = [
    {
      label: 'Streak Bonus',
      value: bonuses.streak || 0,
      icon: '🔥',
      description: `${user.streak?.current || 0}/7 days`,
    },
    {
      label: 'Level Bonus',
      value: bonuses.level || 0,
      icon: user.level?.icon || '🥉',
      description: user.level?.name || 'Bronze',
    },
    {
      label: 'OG Pass',
      value: bonuses.pass || 0,
      icon: '👑',
      description: user.nfts?.hasPass ? 'Active' : 'Not owned',
    },
    {
      label: 'Meme NFTs',
      value: bonuses.memes || 0,
      icon: '🖼️',
      description: `${user.nfts?.memeCount || 0} owned`,
    },
  ];

  return (
    <div
      className={isLight ? 'overflow-hidden' : 'bg-[var(--bg-card)] rounded-xl border border-[var(--bg-elevated)] overflow-hidden'}
      style={isLight ? {
        backgroundColor: 'var(--color-white)',
        border: '2px solid var(--border-sketch)',
        borderRadius: '6px 14px 10px 12px',
        boxShadow: '3px 3px 0px var(--color-ink)',
      } : undefined}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full p-4 flex items-center justify-between transition-colors ${isLight ? '' : 'hover:bg-[var(--bg-elevated)]/50'}`}
        style={isLight ? { backgroundColor: 'transparent' } : undefined}
      >
        <div className="flex items-center gap-2">
          <span>📊</span>
          <span
            className="font-semibold"
            style={{
              color: isLight ? 'var(--color-ink)' : 'white',
              fontFamily: isLight ? 'var(--font-sketch), cursive' : undefined,
            }}
          >
            Bonuses
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="font-bold"
            style={{
              color: isLight
                ? (bonuses.capped ? 'var(--color-gold)' : 'var(--color-accent)')
                : (bonuses.capped ? '#facc15' : 'var(--accent-primary)'),
            }}
          >
            +{((bonuses.total || 0) * 100).toFixed(0)}%
            {bonuses.capped && ' MAX'}
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div
          className="px-4 pb-4 space-y-3"
          style={{
            borderTop: isLight ? '1px dashed var(--border-sketch)' : '1px solid var(--bg-elevated)',
          }}
        >
          {bonusItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
              <span
                className="font-bold"
                style={{
                  color: item.value > 0
                    ? (isLight ? 'var(--color-accent)' : 'var(--accent-primary)')
                    : (isLight ? 'var(--color-ink-light)' : 'var(--text-muted)'),
                }}
              >
                {item.value > 0 ? `+${(item.value * 100).toFixed(0)}%` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================
// GOALS CARD - Next achievements
// =============================================
function GoalsCard({ user }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [expanded, setExpanded] = useState(true);

  const goals = [];

  // Next level goal
  if (user.level?.nextLevel) {
    goals.push({
      icon: user.level.nextLevelIcon,
      title: `Reach ${user.level.nextLevel}`,
      progress: user.level.progress || 0,
      detail: `${user.level.pointsToNext?.toLocaleString()} pts to go`,
      type: 'level',
    });
  }

  // Streak goal
  if ((user.streak?.current || 0) < 7) {
    const daysToGo = 7 - (user.streak?.current || 0);
    goals.push({
      icon: '🔥',
      title: 'Max Streak Bonus',
      progress: ((user.streak?.current || 0) / 7) * 100,
      detail: `${daysToGo} more days for +30%`,
      type: 'streak',
    });
  }

  // Rank goal (if not in top 10)
  if (user.rank && user.rank > 10) {
    goals.push({
      icon: '🏆',
      title: 'Top 10 Rank',
      progress: Math.max(0, 100 - (user.rank - 10) * 2),
      detail: `Currently #${user.rank}`,
      type: 'rank',
    });
  }

  if (goals.length === 0) return null;

  return (
    <div
      className={isLight ? 'overflow-hidden' : 'bg-[var(--bg-card)] rounded-xl border border-[var(--bg-elevated)] overflow-hidden'}
      style={isLight ? {
        backgroundColor: 'var(--color-white)',
        border: '2px solid var(--border-sketch)',
        borderRadius: '10px 8px 14px 6px',
        boxShadow: '3px 3px 0px var(--color-ink)',
      } : undefined}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full p-4 flex items-center justify-between transition-colors ${isLight ? '' : 'hover:bg-[var(--bg-elevated)]/50'}`}
        style={isLight ? { backgroundColor: 'transparent' } : undefined}
      >
        <div className="flex items-center gap-2">
          <span>🎯</span>
          <span
            className="font-semibold"
            style={{
              color: isLight ? 'var(--color-ink)' : 'white',
              fontFamily: isLight ? 'var(--font-sketch), cursive' : undefined,
            }}
          >
            Next Goals
          </span>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div
          className="px-4 pb-4 space-y-4"
          style={{
            borderTop: isLight ? '1px dashed var(--border-sketch)' : '1px solid var(--bg-elevated)',
          }}
        >
          {goals.map((goal, i) => (
            <div key={i} className="pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{goal.icon}</span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
                  >
                    {goal.title}
                  </span>
                </div>
                <span
                  className="text-xs"
                  style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
                >
                  {goal.detail}
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{
                  backgroundColor: isLight ? 'var(--color-paper-dark)' : 'var(--bg-elevated)',
                  border: isLight ? '1px solid var(--border-sketch)' : undefined,
                }}
              >
                <div
                  className={`h-full rounded-full transition-all ${isLight ? '' : 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]'}`}
                  style={{
                    width: `${Math.min(goal.progress, 100)}%`,
                    backgroundColor: isLight ? 'var(--color-accent)' : undefined,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================
// BADGES CARD
// =============================================
function BadgesCard({ user }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const badges = user.badges || [];
  const unlockedBadges = badges.filter(b => b.unlocked);
  const lockedBadges = badges.filter(b => !b.unlocked);

  if (badges.length === 0) return null;

  return (
    <div
      className={isLight ? 'p-4' : 'bg-[var(--bg-card)] rounded-xl border border-[var(--bg-elevated)] p-4'}
      style={isLight ? {
        backgroundColor: 'var(--color-white)',
        border: '2px solid var(--border-sketch)',
        borderRadius: '8px 12px 6px 14px',
        boxShadow: '3px 3px 0px var(--color-ink)',
      } : undefined}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span>🎖️</span>
          <span
            className="font-semibold"
            style={{
              color: isLight ? 'var(--color-ink)' : 'white',
              fontFamily: isLight ? 'var(--font-sketch), cursive' : undefined,
            }}
          >
            Badges
          </span>
        </div>
        <span
          className="text-sm"
          style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
        >
          {unlockedBadges.length}/{badges.length}
        </span>
      </div>

      {/* Unlocked badges */}
      {unlockedBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {unlockedBadges.slice(0, 8).map((badge) => (
            <div
              key={badge.id}
              className={`w-10 h-10 flex items-center justify-center ${isLight ? '' : 'rounded-lg bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 border border-[var(--accent-primary)]/30'}`}
              style={isLight ? {
                backgroundColor: 'var(--color-paper)',
                border: '2px solid var(--border-sketch)',
                borderRadius: '5px 8px 6px 9px',
                boxShadow: '1px 1px 0px var(--color-ink)',
              } : undefined}
              title={badge.name}
            >
              <span className="text-lg">{badge.icon}</span>
            </div>
          ))}
          {unlockedBadges.length > 8 && (
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{
                backgroundColor: isLight ? 'var(--color-paper-dark)' : 'var(--bg-elevated)',
                borderRadius: isLight ? '5px 8px 6px 9px' : '8px',
              }}
            >
              <span
                className="text-xs"
                style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
              >
                +{unlockedBadges.length - 8}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Next badge to unlock */}
      {lockedBadges.length > 0 && (
        <div
          className="pt-3"
          style={{
            borderTop: isLight ? '1px dashed var(--border-sketch)' : '1px solid var(--bg-elevated)',
          }}
        >
          <p
            className="text-xs mb-2"
            style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
          >
            Next to unlock:
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center opacity-50"
              style={{
                backgroundColor: isLight ? 'var(--color-paper-dark)' : 'var(--bg-elevated)',
                borderRadius: isLight ? '5px 8px 6px 9px' : '8px',
              }}
            >
              <span className="text-lg grayscale">{lockedBadges[0].icon}</span>
            </div>
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
              >
                {lockedBadges[0].name}
              </p>
              <p
                className="text-xs"
                style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
              >
                {lockedBadges[0].description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// STATES
// =============================================

function NotConnectedState() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="space-y-6">
      <div
        className={isLight ? 'p-8 text-center' : 'bg-[var(--bg-card)] rounded-2xl p-8 text-center border border-[var(--bg-elevated)]'}
        style={isLight ? {
          backgroundColor: 'var(--color-white)',
          border: '3px solid var(--border-sketch)',
          borderRadius: '10px 18px 14px 12px',
          boxShadow: '4px 4px 0px var(--color-ink)',
        } : undefined}
      >
        <div
          className="w-20 h-20 mx-auto mb-4 flex items-center justify-center"
          style={{
            backgroundColor: isLight ? 'var(--color-paper)' : undefined,
            borderRadius: isLight ? '8px 14px 10px 12px' : '16px',
            border: isLight ? '2px solid var(--border-sketch)' : undefined,
            background: isLight ? undefined : 'linear-gradient(to bottom right, rgba(var(--accent-primary-rgb), 0.2), rgba(var(--accent-secondary-rgb), 0.2))',
          }}
        >
          <span className="text-4xl">🔗</span>
        </div>
        <h2
          className="text-xl font-semibold mb-2"
          style={{
            color: isLight ? 'var(--color-ink)' : 'white',
            fontFamily: isLight ? 'var(--font-heading), "Permanent Marker", cursive' : undefined,
          }}
        >
          Connect Wallet
        </h2>
        <p
          className="text-sm"
          style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
        >
          Connect your wallet to start mining ARCH points.
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const cardBg = isLight ? 'bg-[var(--color-paper-dark)]' : 'bg-[var(--bg-card)]';
  const elevatedBg = isLight ? 'bg-[var(--color-paper)]' : 'bg-[var(--bg-elevated)]';

  return (
    <div className="space-y-4 pb-8">
      {/* Header Stats Bar Skeleton */}
      <div className="flex items-center justify-between gap-2">
        <div className={`h-8 w-24 rounded-full ${cardBg} animate-pulse`} />
        <div className={`h-8 w-20 rounded-full ${cardBg} animate-pulse`} />
      </div>

      {/* Main Miner Card Skeleton */}
      <div className={`${cardBg} rounded-2xl p-6 space-y-4`}>
        {/* Miner Image */}
        <div className="flex justify-center">
          <div className={`w-32 h-32 rounded-full ${elevatedBg} animate-pulse`} />
        </div>
        {/* Miner Name */}
        <div className={`h-6 w-32 mx-auto rounded ${elevatedBg} animate-pulse`} />
        {/* Points Display */}
        <div className={`h-10 w-40 mx-auto rounded-lg ${elevatedBg} animate-pulse`} />
        {/* Progress Bar */}
        <div className={`h-3 w-full rounded-full ${elevatedBg} animate-pulse`} />
        {/* Time Display */}
        <div className={`h-5 w-28 mx-auto rounded ${elevatedBg} animate-pulse`} />
        {/* Action Button */}
        <div className={`h-14 w-full rounded-2xl ${elevatedBg} animate-pulse`} />
      </div>

      {/* Bonuses Card Skeleton */}
      <div className={`${cardBg} rounded-xl p-4 space-y-3`}>
        <div className={`h-5 w-24 rounded ${elevatedBg} animate-pulse`} />
        <div className="grid grid-cols-2 gap-3">
          <div className={`h-12 rounded-lg ${elevatedBg} animate-pulse`} />
          <div className={`h-12 rounded-lg ${elevatedBg} animate-pulse`} />
        </div>
      </div>

      {/* Goals Card Skeleton */}
      <div className={`${cardBg} rounded-xl p-4 space-y-3`}>
        <div className={`h-5 w-20 rounded ${elevatedBg} animate-pulse`} />
        <div className={`h-16 rounded-lg ${elevatedBg} animate-pulse`} />
      </div>
    </div>
  );
}

function NotRegisteredState({ onRegister, loading }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [registering, setRegistering] = useState(false);

  const handleRegister = async () => {
    setRegistering(true);
    await onRegister();
    setRegistering(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div
        className={isLight ? 'p-6 text-center' : 'bg-[var(--bg-card)] rounded-2xl p-6 text-center border border-[var(--bg-elevated)]'}
        style={isLight ? {
          backgroundColor: 'var(--color-white)',
          border: '3px solid var(--border-sketch)',
          borderRadius: '10px 18px 14px 12px',
          boxShadow: '4px 4px 0px var(--color-ink)',
        } : undefined}
      >
        <div className="w-24 h-24 mx-auto mb-4">
          <img
            src="/images/logo/Logo.png"
            alt="Archive of Meme"
            className="w-full h-full object-contain"
          />
        </div>
        <h2
          className="text-xl font-bold mb-2"
          style={{
            color: isLight ? 'var(--color-ink)' : 'white',
            fontFamily: isLight ? 'var(--font-heading), "Permanent Marker", cursive' : undefined,
          }}
        >
          Start Mining Free
        </h2>
        <p
          className="text-sm mb-6"
          style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
        >
          Earn ARCH points every 4 hours. No NFT required!
        </p>

        <button
          onClick={handleRegister}
          disabled={registering || loading}
          className={`w-full py-4 font-bold transition-all disabled:opacity-50 ${isLight ? '' : 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-black rounded-xl hover:opacity-90'}`}
          style={isLight ? {
            backgroundColor: 'var(--color-gold)',
            color: 'var(--color-ink)',
            border: '2px solid var(--border-sketch)',
            borderRadius: '6px 12px 8px 10px',
            boxShadow: '3px 3px 0px var(--color-ink)',
            fontFamily: 'var(--font-sketch), cursive',
          } : undefined}
        >
          {registering ? 'Starting...' : '🚀 Start Mining'}
        </button>
      </div>

      {/* Miner Tiers */}
      <div
        className={isLight ? 'p-4' : 'bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--bg-elevated)]'}
        style={isLight ? {
          backgroundColor: 'var(--color-white)',
          border: '2px solid var(--border-sketch)',
          borderRadius: '6px 14px 10px 12px',
          boxShadow: '3px 3px 0px var(--color-ink)',
        } : undefined}
      >
        <h3
          className="font-semibold mb-4 flex items-center gap-2"
          style={{
            color: isLight ? 'var(--color-ink)' : 'white',
            fontFamily: isLight ? 'var(--font-sketch), cursive' : undefined,
          }}
        >
          <span>⛏️</span>
          Mining Tiers
        </h3>
        <div className="space-y-3">
          {Object.entries(MINER_CONFIG).map(([level, config]) => (
            <div
              key={level}
              className={`flex items-center gap-3 p-3 ${isLight ? '' : `rounded-lg bg-gradient-to-r ${config.color} bg-opacity-10 border ${config.border}`}`}
              style={isLight ? {
                backgroundColor: 'var(--color-paper)',
                border: '2px solid var(--border-sketch)',
                borderRadius: '5px 10px 7px 9px',
              } : undefined}
            >
              <img
                src={config.image}
                alt={config.name}
                className="w-12 h-12 object-contain"
                style={{
                  backgroundColor: isLight ? 'var(--color-white)' : 'rgba(0,0,0,0.2)',
                  borderRadius: isLight ? '4px 8px 6px 7px' : '8px',
                  border: isLight ? '1px solid var(--border-sketch)' : undefined,
                }}
              />
              <div className="flex-1">
                <p
                  className="font-medium text-sm"
                  style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
                >
                  {config.name}
                </p>
                <p
                  className="text-xs"
                  style={{ color: isLight ? 'var(--color-ink-light)' : 'rgba(255,255,255,0.7)' }}
                >
                  {config.basePoints} pts/mine
                </p>
              </div>
              {level === 'Free' && (
                <span
                  className="px-2 py-1 text-xs font-bold"
                  style={{
                    backgroundColor: isLight ? 'var(--color-gold)' : 'rgba(var(--accent-primary-rgb), 0.2)',
                    color: isLight ? 'var(--color-ink)' : 'var(--accent-primary)',
                    borderRadius: isLight ? '3px 6px 4px 5px' : '4px',
                    border: isLight ? '1px solid var(--border-sketch)' : undefined,
                  }}
                >
                  FREE
                </span>
              )}
            </div>
          ))}
        </div>
        <p
          className="text-xs mt-4 text-center"
          style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
        >
          Get Miner NFTs on OpenSea to boost your mining power!
        </p>
      </div>
    </div>
  );
}

function ErrorDisplay({ error }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div
      className="p-4"
      style={{
        backgroundColor: isLight ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: isLight ? '2px dashed #ef4444' : '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: isLight ? '5px 10px 7px 9px' : '12px',
      }}
    >
      <p
        className="text-sm"
        style={{ color: '#f87171' }}
      >
        {error}
      </p>
    </div>
  );
}
