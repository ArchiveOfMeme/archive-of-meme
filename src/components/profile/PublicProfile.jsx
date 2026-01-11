'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';

export default function PublicProfile({ wallet }) {
  const { address } = useAccount();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOwnProfile = address?.toLowerCase() === wallet?.toLowerCase();

  useEffect(() => {
    if (!wallet) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${wallet}`);
        const data = await res.json();

        if (!res.ok || !data.found) {
          setError('User not found');
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [wallet]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold mb-1">Profile</h1>
          <p className="text-[var(--text-muted)] text-sm">
            {isOwnProfile ? 'Your public profile' : 'Viewing player profile'}
          </p>
        </div>
        {isOwnProfile && (
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-[var(--bg-elevated)] text-white text-sm rounded-lg hover:bg-[var(--bg-card)] transition-colors"
          >
            Full Dashboard
          </Link>
        )}
      </header>

      {/* Profile Card */}
      <ProfileCard profile={profile} />

      {/* Level Overview */}
      <LevelOverview level={profile.level} points={profile.points} />

      {/* Stats Grid */}
      <StatsGrid profile={profile} />

      {/* NFTs Section */}
      <NFTsSection nfts={profile.nfts} />

      {/* Badges Section */}
      <BadgesSection badges={profile.badges} />

      {/* Share Profile */}
      <ShareSection wallet={wallet} />
    </div>
  );
}

// =============================================
// PROFILE CARD
// =============================================

function ProfileCard({ profile }) {
  const cosmetics = profile.cosmetics || {};

  const frameStyles = {
    frame_bronze: 'ring-2 ring-amber-600',
    frame_silver: 'ring-2 ring-slate-400',
    frame_gold: 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-yellow-500/20',
    frame_diamond: 'ring-2 ring-purple-400 ring-offset-2 ring-offset-purple-400/20 animate-pulse',
  };

  const nameColorStyles = {
    color_green: 'text-green-400',
    color_blue: 'text-blue-400',
    color_purple: 'text-purple-400',
    color_gold: 'text-yellow-400',
    color_rainbow: 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent',
  };

  const frameClass = cosmetics.frame?.id ? frameStyles[cosmetics.frame.id] || '' : '';
  const nameColorClass = cosmetics.nameColor?.id ? nameColorStyles[cosmetics.nameColor.id] || 'text-white' : 'text-white';

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--bg-elevated)]">
      <div className="flex items-center gap-4">
        {/* Avatar with Frame */}
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center ${frameClass}`}>
          <span className="text-2xl">
            {cosmetics.badge?.icon || profile.level?.icon || '👤'}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1">
          <p className={`font-bold text-lg ${nameColorClass}`}>
            {profile.shortWallet}
          </p>
          <p className="text-[var(--text-muted)] text-sm">
            {profile.level?.name || 'Bronze'} Miner
          </p>
        </div>

        {/* Equipped Items Preview */}
        {(cosmetics.frame || cosmetics.nameColor || cosmetics.badge) && (
          <div className="flex items-center gap-1">
            {cosmetics.frame && (
              <span className="text-lg" title={cosmetics.frame.name}>{cosmetics.frame.icon}</span>
            )}
            {cosmetics.nameColor && (
              <span className="text-lg" title={cosmetics.nameColor.name}>{cosmetics.nameColor.icon}</span>
            )}
            {cosmetics.badge && (
              <span className="text-lg" title={cosmetics.badge.name}>{cosmetics.badge.icon}</span>
            )}
          </div>
        )}
      </div>

      {/* Equipped Cosmetics Detail */}
      {(cosmetics.frame || cosmetics.nameColor || cosmetics.badge) && (
        <div className="mt-4 pt-4 border-t border-[var(--bg-elevated)]">
          <p className="text-[var(--text-muted)] text-xs mb-2">Equipped Cosmetics</p>
          <div className="flex flex-wrap gap-2">
            {cosmetics.frame && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--bg-elevated)] rounded-full text-xs text-white">
                {cosmetics.frame.icon} {cosmetics.frame.name}
              </span>
            )}
            {cosmetics.nameColor && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--bg-elevated)] rounded-full text-xs text-white">
                {cosmetics.nameColor.icon} {cosmetics.nameColor.name}
              </span>
            )}
            {cosmetics.badge && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--bg-elevated)] rounded-full text-xs text-white">
                {cosmetics.badge.icon} {cosmetics.badge.name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Member Since */}
      <div className="mt-4 pt-4 border-t border-[var(--bg-elevated)] flex items-center gap-2 text-[var(--text-muted)] text-xs">
        <span>Member since {new Date(profile.stats.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
      </div>
    </div>
  );
}

// =============================================
// LEVEL OVERVIEW
// =============================================

function LevelOverview({ level, points }) {
  const levelColors = {
    Bronze: 'from-amber-700/20 to-amber-900/20',
    Silver: 'from-slate-400/20 to-slate-500/20',
    Gold: 'from-yellow-500/20 to-amber-500/20',
    Platinum: 'from-cyan-400/20 to-blue-500/20',
    Diamond: 'from-purple-400/20 to-pink-500/20',
    Legend: 'from-red-500/20 to-orange-500/20',
  };

  const levelBorders = {
    Bronze: 'border-amber-700/30',
    Silver: 'border-slate-400/30',
    Gold: 'border-yellow-500/30',
    Platinum: 'border-cyan-400/30',
    Diamond: 'border-purple-400/30',
    Legend: 'border-red-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${levelColors[level?.name] || levelColors.Bronze} rounded-2xl p-5 border ${levelBorders[level?.name] || levelBorders.Bronze}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center">
            <span className="text-2xl">{level?.icon || '🥉'}</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{level?.name || 'Bronze'}</h2>
            <p className="text-[var(--text-muted)] text-xs">
              {level?.bonus > 0 ? `+${(level.bonus * 100).toFixed(0)}% mining bonus` : 'Starting tier'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-bold text-xl">{points?.lifetime?.toLocaleString() || 0}</p>
          <p className="text-[var(--text-muted)] text-xs">lifetime pts</p>
        </div>
      </div>

      {/* Progress bar */}
      {level?.nextLevel && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--text-muted)]">
              {level.nextLevelIcon} {level.nextLevel}
            </span>
            <span className="text-[var(--text-muted)]">
              {Math.round(level.progress || 0)}%
            </span>
          </div>
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(level.progress || 0, 100)}%` }}
            />
          </div>
        </div>
      )}

      {!level?.nextLevel && (
        <p className="text-yellow-400 text-xs text-center">Maximum level achieved!</p>
      )}
    </div>
  );
}

// =============================================
// STATS GRID
// =============================================

function StatsGrid({ profile }) {
  const minerLevel = profile.nfts?.minerLevel || 'Free';

  const stats = [
    {
      label: 'Season Rank',
      value: profile.stats.rank ? `#${profile.stats.rank}` : '—',
      icon: '🏆',
      color: 'from-amber-500/20 to-yellow-500/20',
    },
    {
      label: 'Current Streak',
      value: profile.stats.currentStreak || 0,
      suffix: 'days',
      icon: '🔥',
      color: 'from-red-500/20 to-orange-500/20',
    },
    {
      label: 'Max Streak',
      value: profile.stats.maxStreak || 0,
      suffix: 'days',
      icon: '⚡',
      color: 'from-purple-500/20 to-pink-500/20',
    },
    {
      label: 'Total Mines',
      value: profile.stats.totalMines || 0,
      icon: '⛏️',
      color: 'from-green-500/20 to-emerald-500/20',
    },
  ];

  return (
    <section>
      <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
        <span className="text-lg">📊</span>
        Stats
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 border border-white/5`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-[var(--text-muted)] text-xs">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-white text-xl font-bold">{stat.value}</span>
              {stat.suffix && (
                <span className="text-[var(--text-muted)] text-sm">{stat.suffix}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// =============================================
// NFTs SECTION
// =============================================

function NFTsSection({ nfts }) {
  const minerConfig = {
    Basic: { icon: '🔨', color: 'from-gray-500 to-gray-600', name: 'Basic' },
    Pro: { icon: '⚡', color: 'from-blue-500 to-cyan-500', name: 'Pro' },
    Ultra: { icon: '💎', color: 'from-purple-500 to-pink-500', name: 'Ultra' },
  };

  const miner = nfts?.minerLevel ? minerConfig[nfts.minerLevel] : null;

  return (
    <section className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--bg-elevated)]">
      <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="text-lg">🖼️</span>
        NFTs
      </h2>

      <div className="grid grid-cols-3 gap-3">
        {/* Miner NFT */}
        <div className="bg-[var(--bg-elevated)] rounded-xl p-4 text-center">
          <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2 ${
            miner ? `bg-gradient-to-br ${miner.color}` : 'bg-[var(--bg-card)]'
          }`}>
            <span className="text-2xl">{miner ? miner.icon : '👤'}</span>
          </div>
          <p className="text-white text-sm font-medium">{miner ? miner.name : 'Free'}</p>
          <p className="text-[var(--text-muted)] text-xs">Miner</p>
        </div>

        {/* Meme NFTs */}
        <div className="bg-[var(--bg-elevated)] rounded-xl p-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center mb-2">
            <span className="text-2xl">🖼️</span>
          </div>
          <p className="text-white text-sm font-medium">{nfts?.memeCount || 0}</p>
          <p className="text-[var(--text-muted)] text-xs">Memes</p>
        </div>

        {/* OG Pass */}
        <div className="bg-[var(--bg-elevated)] rounded-xl p-4 text-center">
          <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2 ${
            nfts?.hasPass
              ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
              : 'bg-[var(--bg-card)]'
          }`}>
            <span className="text-2xl">{nfts?.hasPass ? '🎫' : '🔒'}</span>
          </div>
          <p className="text-white text-sm font-medium">{nfts?.hasPass ? 'Yes' : 'No'}</p>
          <p className="text-[var(--text-muted)] text-xs">OG Pass</p>
        </div>
      </div>
    </section>
  );
}

// =============================================
// BADGES SECTION
// =============================================

function BadgesSection({ badges }) {
  const colorMap = {
    'gray-500': '#6b7280', 'gray-600': '#4b5563',
    'blue-500': '#3b82f6', 'blue-600': '#2563eb',
    'orange-500': '#f97316', 'orange-600': '#ea580c',
    'red-500': '#ef4444', 'red-600': '#dc2626',
    'yellow-500': '#eab308', 'yellow-400': '#facc15',
    'amber-400': '#fbbf24', 'amber-500': '#f59e0b',
    'purple-500': '#a855f7', 'purple-600': '#9333ea',
    'pink-400': '#f472b6', 'pink-500': '#ec4899', 'pink-600': '#db2777',
    'fuchsia-500': '#d946ef',
    'cyan-400': '#22d3ee', 'cyan-500': '#06b6d4',
    'teal-400': '#2dd4bf', 'teal-500': '#14b8a6', 'teal-600': '#0d9488',
    'emerald-500': '#10b981', 'emerald-600': '#059669',
    'green-400': '#4ade80', 'green-500': '#22c55e',
    'sky-400': '#38bdf8', 'sky-500': '#0ea5e9',
    'indigo-400': '#818cf8', 'indigo-500': '#6366f1',
    'violet-500': '#8b5cf6', 'violet-600': '#7c3aed',
    'rose-500': '#f43f5e',
    'slate-300': '#cbd5e1', 'slate-400': '#94a3b8',
  };

  const getGradient = (badge) => {
    const from = colorMap[badge.colorFrom] || '#6b7280';
    const to = colorMap[badge.colorTo] || '#4b5563';
    return `linear-gradient(to bottom right, ${from}, ${to})`;
  };

  if (!badges || badges.length === 0) {
    return (
      <section className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--bg-elevated)]">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span className="text-lg">🏅</span>
          Badges
        </h2>
        <p className="text-[var(--text-muted)] text-sm text-center py-4">
          No badges earned yet
        </p>
      </section>
    );
  }

  return (
    <section className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--bg-elevated)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <span className="text-lg">🏅</span>
          Badges
        </h2>
        <span className="text-[var(--text-muted)] text-xs px-2 py-1 bg-[var(--bg-elevated)] rounded-full">
          {badges.length} earned
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="aspect-square rounded-xl flex flex-col items-center justify-center p-2 shadow-lg"
            style={{ background: getGradient(badge) }}
            title={`${badge.name}: ${badge.description}`}
          >
            <span className="text-2xl mb-1">{badge.icon}</span>
            <span className="text-[10px] font-medium text-center leading-tight text-white">
              {badge.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// =============================================
// SHARE SECTION
// =============================================

function ShareSection({ wallet }) {
  const [copied, setCopied] = useState(false);
  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/profile/${wallet}`
    : `https://archiveofmeme.com/profile/${wallet}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <section className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--bg-elevated)]">
      <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
        <span className="text-lg">🔗</span>
        Share Profile
      </h2>
      <div className="flex gap-2">
        <div className="flex-1 bg-[var(--bg-elevated)] rounded-lg px-3 py-2 text-[var(--text-muted)] text-sm truncate">
          {profileUrl}
        </div>
        <button
          onClick={copyLink}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-[var(--accent-primary)] text-black hover:brightness-110'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </section>
  );
}

// =============================================
// STATES
// =============================================

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[var(--bg-card)] rounded-lg animate-pulse" />
      <div className="h-32 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
      <div className="h-40 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--bg-card)] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-white text-2xl font-bold mb-1">Profile</h1>
      </header>

      <div className="bg-[var(--bg-card)] rounded-2xl p-8 text-center border border-[var(--bg-elevated)]">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center">
          <span className="text-4xl">😕</span>
        </div>
        <h2 className="text-white text-xl font-semibold mb-2">User Not Found</h2>
        <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto mb-6">
          {message || 'This profile does not exist or has not started mining yet.'}
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[var(--bg-elevated)] text-white font-medium rounded-xl hover:bg-[var(--bg-card)] transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
