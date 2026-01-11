'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import Image from 'next/image';
import AvatarSelector, { Avatar } from '@/components/profile/AvatarSelector';
import { useTheme } from '@/hooks/useTheme';
import { useMiningData } from '@/hooks/useMining';

/**
 * MobileHome - Home screen para PWA con diseño app-like
 *
 * Estructura:
 * 1. Profile Card (avatar, verified, nivel)
 * 2. Stats Grid (puntos, rank, NFTs)
 * 3. Mine CTA (botón principal)
 * 4. Event Banner (si hay evento activo)
 * 5. Activity Ticker (feed compacto)
 * 6. Referrals Banner
 */
export default function MobileHome() {
  const { address, isConnected } = useAccount();
  const { user: userData, loading } = useMiningData();
  const [activeEvent, setActiveEvent] = useState(null);
  const [nextEvent, setNextEvent] = useState(null);

  // Fetch events (separado del user data)
  useEffect(() => {
    if (!isConnected) return;

    const fetchEvents = async () => {
      try {
        const eventRes = await fetch('/api/events');
        const events = await eventRes.json();

        if (events.hasActiveEvent) {
          setActiveEvent(events.mainEvent);
        } else if (events.nextEvent) {
          setNextEvent(events.nextEvent);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };

    fetchEvents();
  }, [isConnected]);

  // Not connected state
  if (!isConnected) {
    return <WelcomeScreen />;
  }

  // Loading state
  if (loading) {
    return <LoadingScreen />;
  }

  // Not registered state
  if (!userData?.registered) {
    return <RegisterScreen address={address} />;
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-8">
      {/* 1. Profile Card (incluye stats) */}
      <ProfileCard user={userData} />

      {/* 2. Mine CTA */}
      <MineCTA user={userData} />

      {/* 4. Event Banner */}
      {activeEvent && <EventBanner event={activeEvent} isActive={true} />}
      {!activeEvent && nextEvent && <EventBanner event={nextEvent} isActive={false} />}

      {/* 5. Activity Ticker */}
      <ActivitySection />

      {/* 6. Referrals */}
      <ReferralsSection wallet={address} />

      {/* 7. Explore NFTs */}
      <ExploreSection user={userData} />
    </div>
  );
}

// ============================================
// WELCOME SCREEN (Not Connected)
// ============================================
function WelcomeScreen() {
  return (
    <div className="px-4 py-8 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-purple-500/20 flex items-center justify-center">
          <Image
            src="/images/logo/Logo.png"
            alt="Archive of Meme"
            width={64}
            height={64}
            className="rounded-xl"
          />
        </div>
        <h1 className="text-white text-2xl font-bold mb-2">Archive of Meme</h1>
        <p className="text-[var(--text-secondary)] text-sm max-w-xs mx-auto">
          Mine points, collect NFTs, and join the community of meme enthusiasts
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className="w-full py-4 bg-[var(--accent-primary)] text-black font-bold text-lg rounded-2xl hover:opacity-90 transition-all active:scale-98"
            >
              Connect Wallet
            </button>
          )}
        </ConnectButton.Custom>

        <p className="text-[var(--text-muted)] text-xs text-center">
          Free to play. No purchase required.
        </p>
      </div>

      {/* Features preview */}
      <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-xs">
        <FeatureItem icon="⛏️" label="Mine" />
        <FeatureItem icon="🏆" label="Compete" />
        <FeatureItem icon="🎁" label="Earn" />
      </div>
    </div>
  );
}

function FeatureItem({ icon, label }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-1 rounded-xl bg-[var(--bg-card)] flex items-center justify-center">
        <span className="text-2xl">{icon}</span>
      </div>
      <span className="text-[var(--text-muted)] text-xs">{label}</span>
    </div>
  );
}

// ============================================
// LOADING SCREEN (Skeleton que coincide con la estructura real)
// ============================================
function LoadingScreen() {
  return (
    <div className="px-4 py-4 space-y-4 pb-8">
      {/* ProfileCard Skeleton */}
      <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)] rounded-2xl p-4 border border-[var(--bg-elevated)]">
        {/* Header: Avatar + Info + Arrow */}
        <div className="flex items-center gap-4">
          {/* Avatar skeleton */}
          <div className="w-14 h-14 rounded-full bg-[var(--bg-elevated)] animate-pulse" />

          {/* Info skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-[var(--bg-elevated)] rounded animate-pulse" />
            <div className="h-4 w-24 bg-[var(--bg-elevated)] rounded animate-pulse" />
            <div className="h-3 w-20 bg-[var(--bg-elevated)] rounded animate-pulse" />
          </div>

          {/* Arrow skeleton */}
          <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] animate-pulse" />
        </div>

        {/* Stats Row skeleton */}
        <div className="mt-3 pt-3 grid grid-cols-3 divide-x divide-[var(--bg-elevated)] border-t border-[var(--bg-elevated)]">
          <div className="text-center space-y-1">
            <div className="h-4 w-12 mx-auto bg-[var(--bg-elevated)] rounded animate-pulse" />
            <div className="h-3 w-10 mx-auto bg-[var(--bg-elevated)] rounded animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <div className="h-4 w-10 mx-auto bg-[var(--bg-elevated)] rounded animate-pulse" />
            <div className="h-3 w-8 mx-auto bg-[var(--bg-elevated)] rounded animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <div className="h-4 w-8 mx-auto bg-[var(--bg-elevated)] rounded animate-pulse" />
            <div className="h-3 w-10 mx-auto bg-[var(--bg-elevated)] rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* MineCTA Skeleton */}
      <div className="h-14 bg-[var(--bg-card)] rounded-2xl animate-pulse" />

      {/* Activity Section Skeleton */}
      <div className="space-y-2">
        <div className="h-5 w-24 bg-[var(--bg-card)] rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-12 bg-[var(--bg-card)] rounded-xl animate-pulse" />
          <div className="h-12 bg-[var(--bg-card)] rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Referrals Skeleton */}
      <div className="h-20 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
    </div>
  );
}

// ============================================
// REGISTER SCREEN
// ============================================
function RegisterScreen({ address }) {
  const [registering, setRegistering] = useState(false);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await fetch('/api/mining/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address }),
      });
      window.location.reload();
    } catch (err) {
      console.error('Error registering:', err);
    }
    setRegistering(false);
  };

  return (
    <div className="px-4 py-8 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--accent-primary)]/20 to-purple-500/20 flex items-center justify-center">
          <span className="text-4xl">👋</span>
        </div>
        <h1 className="text-white text-xl font-bold mb-2">Welcome!</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Join the Archive and start mining points
        </p>
      </div>

      <button
        onClick={handleRegister}
        disabled={registering}
        className="w-full max-w-xs py-4 bg-[var(--accent-primary)] text-black font-bold text-lg rounded-2xl hover:opacity-90 transition-all disabled:opacity-50"
      >
        {registering ? 'Creating account...' : 'Start Mining'}
      </button>
    </div>
  );
}

// ============================================
// PROFILE CARD
// ============================================
function ProfileCard({ user }) {
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const shortWallet = user.wallet
    ? `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}`
    : '';

  // Determine most important NFT and verified status
  const hasNFT = user.miner?.hasNFT || user.nfts?.hasPass || user.nfts?.memeCount > 0;
  const importantNFT = getImportantNFT(user);


  // Handle avatar selection
  const handleAvatarSelect = (selectedOption) => {
    if (selectedOption) {
      setCurrentAvatar({
        type: selectedOption.type,
        imageUrl: selectedOption.imageUrl,
      });
    } else {
      setCurrentAvatar(null);
    }
  };

  // Build user object for Avatar component
  const avatarUser = {
    ...user,
    avatar: currentAvatar || user.avatar,
  };

  return (
    <>
      <div
        className={isLight ? 'p-4 relative overflow-hidden' : 'bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)] rounded-2xl p-4 border border-[var(--bg-elevated)]'}
        style={isLight ? {
          backgroundColor: 'var(--color-white)',
          border: '3px solid var(--border-sketch)',
          borderRadius: '5px 15px 10px 20px',
          boxShadow: '3px 3px 0px var(--color-ink)',
          transform: 'rotate(0.5deg)',
        } : {}}
      >
        <div className="flex items-center gap-4">
          {/* Avatar - clickable to open selector */}
          <Avatar
            user={avatarUser}
            size="md"
            onClick={hasNFT ? () => setShowAvatarSelector(true) : undefined}
            showBadge={false}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="font-bold truncate"
                style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
              >
                {shortWallet}
              </span>
              {hasNFT && (
                <span style={{ color: isLight ? 'var(--color-accent)' : 'var(--accent-primary)' }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>

            {/* Important NFT label */}
            {importantNFT && (
              <p
                className="text-sm font-medium"
                style={{ color: isLight ? 'var(--color-accent)' : 'var(--accent-primary)' }}
              >
                {importantNFT}
              </p>
            )}

            {/* Level + Streak */}
            <div className="flex items-center gap-6 mt-1">
              <div className="flex items-center gap-1.5">
                <LevelBadge level={user.level?.name || 'Bronze'} size="sm" />
                <span
                  className="text-sm"
                  style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-secondary)' }}
                >
                  {user.level?.name || 'Bronze'}
                </span>
              </div>
              {user.streak?.current > 0 && (
                <span
                  className="text-sm"
                  style={{ color: isLight ? 'var(--color-accent)' : '#fb923c' }}
                >
                  {user.streak.current}d streak
                </span>
              )}
            </div>
          </div>

          {/* Settings/Profile link */}
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: isLight ? 'var(--color-paper-dark)' : 'var(--bg-elevated)',
              border: isLight ? '2px solid var(--border-sketch)' : 'none',
            }}
          >
            <svg
              className="w-5 h-5"
              style={{ color: isLight ? 'var(--color-ink)' : 'var(--text-secondary)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Stats Row - Points, Rank, NFTs */}
        <div
          className={`mt-3 grid grid-cols-3 ${isLight ? 'divide-x divide-[var(--border-sketch)]' : 'divide-x divide-[var(--bg-elevated)]'}`}
          style={{
            borderTop: isLight ? '1px dashed var(--border-sketch)' : '1px solid var(--bg-elevated)',
            paddingTop: '10px',
          }}
        >
          {/* Points */}
          <div className="text-center">
            <p
              className="font-bold text-sm"
              style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
            >
              {formatNumber(user.points?.lifetime || 0)}
            </p>
            <p
              className="text-[10px] uppercase tracking-wide"
              style={{
                color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)',
                fontFamily: isLight ? 'var(--font-sketch), cursive' : 'inherit',
              }}
            >
              points
            </p>
          </div>

          {/* Rank */}
          <div className="text-center">
            <p
              className="font-bold text-sm"
              style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
            >
              #{user.rank || '-'}
            </p>
            <p
              className="text-[10px] uppercase tracking-wide"
              style={{
                color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)',
                fontFamily: isLight ? 'var(--font-sketch), cursive' : 'inherit',
              }}
            >
              rank
            </p>
          </div>

          {/* NFTs */}
          <div className="text-center">
            <p
              className="font-bold text-sm"
              style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
            >
              {getTotalNFTs(user)}
            </p>
            <p
              className="text-[10px] uppercase tracking-wide"
              style={{
                color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)',
                fontFamily: isLight ? 'var(--font-sketch), cursive' : 'inherit',
              }}
            >
              NFTs
            </p>
          </div>
        </div>
      </div>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          wallet={user.wallet}
          currentAvatar={currentAvatar || user.avatar}
          onSelect={handleAvatarSelect}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </>
  );
}

function getImportantNFT(user) {
  // Priority: Miner > OG Pass > Memes
  if (user.miner?.level === 'Ultra') return 'Ultra Miner';
  if (user.miner?.level === 'Pro') return 'Pro Miner';
  if (user.miner?.level === 'Basic') return 'Basic Miner';
  if (user.nfts?.hasPass) return 'OG Pass Holder';
  if (user.nfts?.memeCount > 0) return `${user.nfts.memeCount} Meme${user.nfts.memeCount > 1 ? 's' : ''} Collector`;
  return null;
}

// ============================================
// STATS PANEL - Estilo gaming/dashboard
// ============================================
function StatsGrid({ user }) {
  const points = user.points?.lifetime || 0;
  const totalNFTs = getTotalNFTs(user);

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-elevated)] overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-[var(--bg-elevated)]">
        {/* Points */}
        <div className="py-4 px-3 text-center">
          <p className="text-white font-bold text-xl">{formatNumber(points)}</p>
          <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">points</p>
        </div>

        {/* Rank */}
        <div className="py-4 px-3 text-center">
          <p className="text-white font-bold text-xl">#{user.rank || '-'}</p>
          <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">rank</p>
        </div>

        {/* NFTs */}
        <div className="py-4 px-3 text-center">
          <p className="text-white font-bold text-xl">{totalNFTs}</p>
          <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">NFTs</p>
        </div>
      </div>
    </div>
  );
}

function getTotalNFTs(user) {
  let total = 0;
  if (user.miner?.hasNFT) total += 1;
  if (user.nfts?.hasPass) total += 1;
  if (user.nfts?.memeCount) total += user.nfts.memeCount;
  return total;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

// ============================================
// MINE CTA
// ============================================
function MineCTA({ user }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const initialWaitTime = user.mining?.waitTime || 0;
  const [timeLeft, setTimeLeft] = useState(initialWaitTime);

  // Countdown timer
  useEffect(() => {
    setTimeLeft(user.mining?.waitTime || 0);
  }, [user.mining?.waitTime]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) return 0;
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft > 0]);

  const canMine = timeLeft <= 0;

  // Format remaining time with fixed width segments
  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    const pad = (n) => n.toString().padStart(2, '0');

    return (
      <>
        <span style={{ display: 'inline-block', minWidth: '1.2em', textAlign: 'right' }}>{pad(hours)}</span>h{' '}
        <span style={{ display: 'inline-block', minWidth: '1.2em', textAlign: 'right' }}>{pad(minutes)}</span>m{' '}
        <span style={{ display: 'inline-block', minWidth: '1.2em', textAlign: 'right' }}>{pad(seconds)}</span>s
      </>
    );
  };

  // Light mode styles
  if (isLight) {
    return (
      <Link
        href="/mine"
        className="block w-full py-3 text-center font-bold transition-all active:scale-98"
        style={{
          backgroundColor: canMine ? 'var(--color-gold)' : 'var(--color-white)',
          color: 'var(--color-ink)',
          border: '2px solid var(--border-sketch)',
          borderRadius: '5px 12px 8px 15px',
          boxShadow: '2px 2px 0px var(--color-ink)',
          fontFamily: 'var(--font-sketch), cursive',
        }}
      >
        {canMine ? (
          <div className="flex items-center justify-center gap-2">
            <span>Mine Now!</span>
            <span className="text-sm opacity-75">+{user.miner?.level === 'Free' ? '10' : user.miner?.level === 'Basic' ? '50' : user.miner?.level === 'Pro' ? '150' : '400'}+ pts</span>
          </div>
        ) : (
          <span>Next mine in {formatTime(timeLeft)}</span>
        )}
      </Link>
    );
  }

  // Dark mode styles
  return (
    <Link
      href="/mine"
      className={`block w-full py-3 rounded-xl text-center font-bold transition-all active:scale-98 ${
        canMine
          ? 'bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 text-black'
          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--bg-elevated)]'
      }`}
    >
      {canMine ? (
        <div className="flex items-center justify-center gap-2">
          <span>Mine Now!</span>
          <span className="text-sm opacity-75">+{user.miner?.level === 'Free' ? '10' : user.miner?.level === 'Basic' ? '50' : user.miner?.level === 'Pro' ? '150' : '400'}+ pts</span>
        </div>
      ) : (
        <span>Next mine in {formatTime(timeLeft)}</span>
      )}
    </Link>
  );
}

// ============================================
// EVENT BANNER
// ============================================
function EventBanner({ event, isActive }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (isActive) {
    // Evento activo - mostrar countdown hasta que termine
    return (
      <div
        className={isLight ? 'p-3' : 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-3 border border-blue-500/30'}
        style={isLight ? {
          backgroundColor: 'var(--color-white)',
          border: '2px solid var(--border-sketch)',
          borderRadius: '8px 15px 5px 12px',
          boxShadow: '2px 2px 0px var(--color-ink)',
        } : {}}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{event.icon}</span>
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
              >
                {event.name}
              </p>
              <p
                className="text-xs font-medium"
                style={{ color: isLight ? 'var(--color-accent)' : '#93c5fd' }}
              >
                {event.multiplier}x points active!
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className="text-xs"
              style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
            >
              Ends in
            </p>
            <EventCountdown targetDate={event.endsAt} isLight={isLight} />
          </div>
        </div>
      </div>
    );
  }

  // Evento próximo - mostrar countdown hasta que empiece
  return (
    <div
      className={isLight ? 'p-3' : 'bg-gradient-to-r from-amber-600/10 to-orange-600/10 rounded-xl p-3 border border-amber-500/20'}
      style={isLight ? {
        backgroundColor: 'var(--color-white)',
        border: '2px solid var(--border-sketch)',
        borderRadius: '8px 15px 5px 12px',
        boxShadow: '2px 2px 0px var(--color-ink)',
      } : {}}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{event.icon}</span>
          <div>
            <p
              className="font-semibold text-sm"
              style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
            >
              Next: {event.name}
            </p>
            <p
              className="text-xs font-medium"
              style={{ color: isLight ? 'var(--color-accent)' : '#fcd34d' }}
            >
              {event.multiplier}x points bonus
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className="text-xs"
            style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
          >
            Starts in
          </p>
          <EventCountdown targetDate={event.startsAt} isLight={isLight} />
        </div>
      </div>
    </div>
  );
}

function EventCountdown({ targetDate, isLight }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) {
        setTimeLeft('Now!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <p
      className="font-mono text-sm font-bold"
      style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
    >
      {timeLeft}
    </p>
  );
}

// ============================================
// ACTIVITY SECTION
// ============================================
function ActivitySection() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetch('/api/activity?limit=5')
      .then(res => res.json())
      .then(data => setActivities(data.events || []))
      .catch(console.error);
  }, []);

  if (activities.length === 0) return null;

  return (
    <div
      className={isLight ? 'p-4' : 'bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--bg-elevated)]'}
      style={isLight ? {
        backgroundColor: 'var(--color-white)',
        border: '2px solid var(--border-sketch)',
        borderRadius: '10px 5px 15px 8px',
        boxShadow: '2px 2px 0px var(--color-ink)',
      } : {}}
    >
      <h3
        className="font-semibold text-sm mb-3 flex items-center gap-2"
        style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
      >
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Live Activity
      </h3>
      <div className="space-y-2">
        {activities.slice(0, 3).map((activity, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span>{activity.icon}</span>
            <span
              className="truncate flex-1"
              style={{ color: isLight ? 'var(--color-ink)' : 'var(--text-secondary)' }}
            >
              {activity.wallet} {activity.message}
            </span>
            <span
              className="text-xs shrink-0"
              style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
            >
              {activity.timeAgo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// REFERRALS SECTION
// ============================================
function ReferralsSection({ wallet }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [referrals, setReferrals] = useState(null);
  const [showShareSheet, setShowShareSheet] = useState(false);

  useEffect(() => {
    fetch(`/api/referrals?wallet=${wallet}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setReferrals(data);
      })
      .catch(console.error);
  }, [wallet]);

  if (!referrals) return null;

  return (
    <>
      <div
        className={isLight ? 'p-4' : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20'}
        style={isLight ? {
          backgroundColor: 'var(--color-white)',
          border: '2px solid var(--border-sketch)',
          borderRadius: '5px 12px 8px 15px',
          boxShadow: '2px 2px 0px var(--color-ink)',
        } : {}}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isLight ? 'var(--color-paper-dark)' : 'rgba(168, 85, 247, 0.2)',
                border: isLight ? '1px solid var(--border-sketch)' : 'none',
              }}
            >
              <span className="text-xl">👥</span>
            </div>
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
              >
                {referrals.referralCount || 0} friends invited
              </p>
              <p
                className="text-xs"
                style={{ color: isLight ? 'var(--color-accent)' : '#d8b4fe' }}
              >
                +{referrals.totalBonusEarned || 0} bonus pts earned
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowShareSheet(true)}
            className="px-3 py-1.5 text-xs font-medium transition-colors"
            style={isLight ? {
              backgroundColor: 'var(--color-gold)',
              color: 'var(--color-ink)',
              border: '1px solid var(--border-sketch)',
              borderRadius: '9999px',
            } : {
              backgroundColor: 'rgba(168, 85, 247, 0.2)',
              color: '#d8b4fe',
              borderRadius: '9999px',
            }}
          >
            Invite +
          </button>
        </div>
      </div>

      {/* Share Bottom Sheet */}
      {showShareSheet && (
        <ShareSheet
          referralCode={referrals.referralCode || wallet.slice(2, 8).toUpperCase()}
          stats={referrals}
          onClose={() => setShowShareSheet(false)}
        />
      )}
    </>
  );
}

// ============================================
// SHARE BOTTOM SHEET - iOS Style
// ============================================
function ShareSheet({ referralCode, stats, onClose }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [copied, setCopied] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const referralLink = `https://archiveofmeme.com/?ref=${referralCode}`;

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Touch handlers for swipe to dismiss
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    // Only allow dragging down
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // If dragged more than 100px, close
    if (dragY > 100) {
      onClose();
    } else {
      setDragY(0);
    }
  };

  // Share messages in English
  const shareMessages = {
    whatsapp: `Join me on Archive of Meme! Mine points, collect NFTs, and earn rewards together.\n\n${referralLink}`,
    telegram: `Archive of Meme - the digital meme museum. Join with my link and we both earn bonus points!\n\n${referralLink}`,
    twitter: `Mining memes on @archiveofmeme - join me and we both earn rewards!\n\n${referralLink}`,
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for mobile
      const textArea = document.createElement('textarea');
      textArea.value = referralLink;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessages.whatsapp)}`, '_blank');
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on Archive of Meme!')}`, '_blank');
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessages.twitter)}`, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Archive of Meme',
          text: 'Join me on Archive of Meme!',
          url: referralLink,
        });
      } catch (err) {
        // User cancelled
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{
          backgroundColor: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.6)',
          opacity: Math.max(0.2, 1 - dragY / 300),
        }}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md overflow-hidden animate-slide-up touch-none"
        style={{
          backgroundColor: isLight ? 'var(--color-paper)' : '#1c1c1e',
          borderRadius: isLight ? '20px 20px 0 0' : '12px 12px 0 0',
          border: isLight ? '3px solid var(--border-sketch)' : 'none',
          borderBottom: 'none',
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle - visual indicator for drag */}
        <div className="flex justify-center pt-2 pb-3 cursor-grab">
          <div
            className="w-9 h-1 rounded-full"
            style={{ backgroundColor: isLight ? 'var(--color-ink-light)' : 'rgba(255,255,255,0.3)' }}
          />
        </div>

        {/* Header */}
        <div className="text-center px-4 pb-4">
          <h3
            className="text-base font-semibold"
            style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
          >
            Invite Friends
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{ color: isLight ? 'var(--color-ink-light)' : '#8e8e93' }}
          >
            Earn <span style={{ color: 'var(--color-accent, var(--accent-primary))' }}>100 pts</span> per friend + <span style={{ color: 'var(--color-accent, var(--accent-primary))' }}>5%</span> of their mining
          </p>
        </div>

        {/* Link Card */}
        <div
          className="mx-4 mb-4 p-3"
          style={{
            backgroundColor: isLight ? 'var(--color-white)' : '#2c2c2e',
            border: isLight ? '2px solid var(--border-sketch)' : 'none',
            borderRadius: isLight ? '8px 12px 6px 10px' : '12px',
          }}
        >
          <p
            className="text-xs mb-1"
            style={{ color: isLight ? 'var(--color-ink-light)' : '#8e8e93' }}
          >
            Your referral link
          </p>
          <div className="flex items-center gap-2">
            <p
              className="text-sm font-medium flex-1 truncate"
              style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
            >
              {referralLink}
            </p>
            <button
              onClick={copyLink}
              className="px-3 py-1.5 text-xs font-semibold transition-all"
              style={copied ? {
                backgroundColor: 'var(--color-accent, var(--accent-primary))',
                color: isLight ? 'white' : 'black',
                borderRadius: '8px',
              } : {
                backgroundColor: isLight ? 'var(--color-gold)' : '#3a3a3c',
                color: isLight ? 'var(--color-ink)' : 'white',
                border: isLight ? '1px solid var(--border-sketch)' : 'none',
                borderRadius: '8px',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Share Icons - iOS Style Grid */}
        <div className="px-4 pb-2">
          <div className="flex justify-center gap-6">
            {/* WhatsApp */}
            <button onClick={shareWhatsApp} className="flex flex-col items-center gap-1.5 active:opacity-70">
              <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <span style={{ color: isLight ? 'var(--color-ink)' : 'white', fontSize: '10px' }}>WhatsApp</span>
            </button>

            {/* Telegram */}
            <button onClick={shareTelegram} className="flex flex-col items-center gap-1.5 active:opacity-70">
              <div className="w-14 h-14 rounded-full bg-[#0088cc] flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <span style={{ color: isLight ? 'var(--color-ink)' : 'white', fontSize: '10px' }}>Telegram</span>
            </button>

            {/* X/Twitter */}
            <button onClick={shareTwitter} className="flex flex-col items-center gap-1.5 active:opacity-70">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  backgroundColor: isLight ? 'var(--color-ink)' : 'black',
                  border: isLight ? 'none' : '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <span style={{ color: isLight ? 'var(--color-ink)' : 'white', fontSize: '10px' }}>X</span>
            </button>

            {/* More - Native Share */}
            <button onClick={shareNative} className="flex flex-col items-center gap-1.5 active:opacity-70">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  backgroundColor: isLight ? 'var(--color-paper-dark)' : '#3a3a3c',
                  border: isLight ? '1px solid var(--border-sketch)' : 'none',
                }}
              >
                <svg
                  className="w-6 h-6"
                  style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v14m0-14l-4 4m4-4l4 4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14" />
                </svg>
              </div>
              <span style={{ color: isLight ? 'var(--color-ink)' : 'white', fontSize: '10px' }}>More</span>
            </button>
          </div>
        </div>

        {/* Cancel Button */}
        <div className="p-4 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 text-base font-semibold transition-colors"
            style={{
              backgroundColor: isLight ? 'var(--color-white)' : '#2c2c2e',
              color: isLight ? 'var(--color-ink)' : 'white',
              border: isLight ? '2px solid var(--border-sketch)' : 'none',
              borderRadius: isLight ? '8px 12px 6px 10px' : '12px',
            }}
          >
            Cancel
          </button>
        </div>

        {/* Safe area */}
        <div className="h-2" />
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
      `}</style>
    </div>
  );
}

// ============================================
// EXPLORE SECTION - NFT Collections with Glow Style
// ============================================
function ExploreSection({ user }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const collections = [
    {
      id: 'pass',
      name: 'OG Pass',
      image: '/images/Pass/OG_Pass.png',
      href: 'https://opensea.io/collection/archive-of-meme-pass',
      owned: user.nfts?.hasPass,
      glowColor: 'rgba(234, 179, 8, 0.6)', // Gold
      borderOwned: 'border-yellow-400',
      shadowOwned: 'shadow-[0_0_20px_rgba(234,179,8,0.4)]',
    },
    {
      id: 'miners',
      name: 'Miners',
      image: '/images/Miners/UltraMiner.png',
      href: 'https://opensea.io/collection/archive-of-meme-miners',
      owned: user.miner?.hasNFT,
      glowColor: 'rgba(59, 130, 246, 0.6)', // Blue
      borderOwned: 'border-blue-400',
      shadowOwned: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
    },
    {
      id: 'memes',
      name: 'Memes',
      image: '/images/Memes/ArchM1.png',
      href: 'https://opensea.io/collection/archive-of-meme-arch',
      owned: user.nfts?.memeCount > 0,
      ownedCount: user.nfts?.memeCount,
      glowColor: 'rgba(16, 185, 129, 0.6)', // Green
      borderOwned: 'border-emerald-400',
      shadowOwned: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
    },
  ];

  return (
    <div>
      <h3
        className="font-semibold text-sm mb-3"
        style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
      >
        Explore NFTs
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {collections.map((col) => (
          <a
            key={col.id}
            href={col.href}
            target="_blank"
            rel="noopener noreferrer"
            className={isLight ? 'relative overflow-hidden transition-all duration-300' : `relative rounded-xl overflow-hidden transition-all duration-300 bg-transparent ${
              col.owned
                ? `border-2 ${col.borderOwned} ${col.shadowOwned}`
                : 'border border-[var(--bg-elevated)] hover:border-[var(--text-muted)]'
            }`}
            style={isLight ? {
              border: col.owned ? '3px solid var(--color-accent)' : '2px solid var(--border-sketch)',
              borderRadius: '6px 10px 8px 12px',
              boxShadow: col.owned ? '2px 2px 0px var(--color-accent)' : '2px 2px 0px var(--color-ink)',
            } : {}}
          >
            {/* NFT Image */}
            <div className="aspect-square relative">
              <img
                src={col.image}
                alt={col.name}
                className="w-full h-full object-contain"
              />

              {/* Owned Badge */}
              {col.owned && (
                <div
                  className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5"
                  style={{
                    backgroundColor: isLight ? 'var(--color-accent)' : 'var(--accent-primary)',
                    color: isLight ? 'white' : 'black',
                  }}
                >
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {col.ownedCount ? col.ownedCount : 'OWNED'}
                </div>
              )}
            </div>

            {/* Name + Link icon */}
            <div className="py-2 px-1 flex items-center justify-center gap-1">
              <p
                className="text-xs font-medium"
                style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
              >
                {col.name}
              </p>
              {!col.owned && (
                <svg
                  className="w-3 h-3"
                  style={{ color: isLight ? 'var(--color-gold)' : 'var(--text-muted)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ============================================
// LEVEL BADGE - Iconos CSS 3D personalizados
// ============================================
function LevelBadge({ level, size = 'sm' }) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  // Estilos 3D únicos por nivel
  const levelStyles = {
    Bronze: {
      base: '#92400e',
      light: '#d97706',
      dark: '#78350f',
      highlight: '#fbbf24',
      shadow: 'rgba(120, 53, 15, 0.6)',
    },
    Silver: {
      base: '#94a3b8',
      light: '#e2e8f0',
      dark: '#64748b',
      highlight: '#ffffff',
      shadow: 'rgba(100, 116, 139, 0.6)',
    },
    Gold: {
      base: '#eab308',
      light: '#fde047',
      dark: '#a16207',
      highlight: '#fef9c3',
      shadow: 'rgba(161, 98, 7, 0.6)',
    },
    Platinum: {
      base: '#67e8f9',
      light: '#ecfeff',
      dark: '#0891b2',
      highlight: '#ffffff',
      shadow: 'rgba(8, 145, 178, 0.6)',
    },
    Diamond: {
      base: '#38bdf8',
      light: '#bae6fd',
      dark: '#0284c7',
      highlight: '#f0f9ff',
      shadow: 'rgba(2, 132, 199, 0.6)',
    },
    Legend: {
      base: '#c026d3',
      light: '#f0abfc',
      dark: '#86198f',
      highlight: '#fdf4ff',
      shadow: 'rgba(134, 25, 143, 0.6)',
    },
  };

  const s = levelStyles[level] || levelStyles.Bronze;

  return (
    <div className={`${sizes[size]} relative`} style={{ filter: `drop-shadow(0 2px 3px ${s.shadow})` }}>
      {/* Capa trasera (sombra/profundidad) */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 5%, 95% 50%, 50% 95%, 5% 50%)',
          background: s.dark,
          transform: 'translateY(1px)',
        }}
      />

      {/* Capa base del diamante */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 5%, 95% 50%, 50% 95%, 5% 50%)',
          background: `linear-gradient(135deg, ${s.light} 0%, ${s.base} 50%, ${s.dark} 100%)`,
        }}
      />

      {/* Faceta superior izquierda (luz) */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 5%, 50% 50%, 5% 50%)',
          background: `linear-gradient(180deg, ${s.highlight} 0%, ${s.light} 100%)`,
          opacity: 0.9,
        }}
      />

      {/* Faceta superior derecha */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 5%, 95% 50%, 50% 50%)',
          background: `linear-gradient(180deg, ${s.light} 0%, ${s.base} 100%)`,
          opacity: 0.8,
        }}
      />

      {/* Faceta inferior izquierda */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(5% 50%, 50% 50%, 50% 95%)',
          background: `linear-gradient(0deg, ${s.dark} 0%, ${s.base} 100%)`,
          opacity: 0.9,
        }}
      />

      {/* Faceta inferior derecha (sombra) */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 50%, 95% 50%, 50% 95%)',
          background: s.dark,
          opacity: 0.95,
        }}
      />

      {/* Brillo central */}
      <div
        className="absolute"
        style={{
          top: '20%',
          left: '25%',
          width: '20%',
          height: '20%',
          background: `radial-gradient(ellipse, ${s.highlight} 0%, transparent 70%)`,
          opacity: 0.8,
        }}
      />
    </div>
  );
}
