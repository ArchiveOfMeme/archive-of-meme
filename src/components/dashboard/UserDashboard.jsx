'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import SeasonLeaderboard from '@/components/seasons/SeasonLeaderboard';
import { useMiningData } from '@/hooks/useMining';

export default function UserDashboard() {
  const { address, isConnected } = useAccount();
  const { user, loading } = useMiningData();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch transaction history (separado)
  const fetchHistory = useCallback(async () => {
    if (!address) return;

    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/mining/history?wallet=${address}&limit=10`);
      const data = await res.json();
      setHistory(data.transactions || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchHistory();
    }
  }, [isConnected, address, fetchHistory]);

  if (!isConnected) {
    return <NotConnectedState />;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (!user?.registered) {
    return <NotRegisteredState />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-[var(--text-muted)] text-sm">
            Your mining stats and activity
          </p>
        </div>
        <Link
          href={`/profile/${address}`}
          className="px-3 py-1.5 bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm rounded-lg hover:text-white transition-colors"
        >
          Public Profile
        </Link>
      </header>

      {/* Profile Card with Cosmetics */}
      <ProfileCard user={user} />

      {/* Level Overview - V2 */}
      <LevelOverview user={user} />

      {/* Points Overview */}
      <PointsOverview user={user} />

      {/* Quick Actions */}
      <QuickActions user={user} />

      {/* Stats Grid */}
      <StatsGrid user={user} />

      {/* NFTs Section */}
      <NFTsSection user={user} />

      {/* Badges Section */}
      <BadgesSection user={user} />

      {/* Season Leaderboard */}
      <SeasonLeaderboard limit={5} showUserRank={true} />

      {/* Referral Section */}
      <ReferralSection wallet={address} />

      {/* Transaction History */}
      <HistorySection
        history={history}
        loading={historyLoading}
      />
    </div>
  );
}

// =============================================
// PROFILE CARD WITH COSMETICS
// =============================================

function ProfileCard({ user }) {
  const cosmetics = user.cosmetics;
  const wallet = user.wallet;
  const shortWallet = wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : '';

  // Frame styles based on equipped frame
  const frameStyles = {
    frame_bronze: 'ring-2 ring-amber-600',
    frame_silver: 'ring-2 ring-slate-400',
    frame_gold: 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-yellow-500/20',
    frame_diamond: 'ring-2 ring-purple-400 ring-offset-2 ring-offset-purple-400/20 animate-pulse',
  };

  // Name color styles
  const nameColorStyles = {
    color_green: 'text-green-400',
    color_blue: 'text-blue-400',
    color_purple: 'text-purple-400',
    color_gold: 'text-yellow-400',
    color_rainbow: 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent',
  };

  const frameClass = cosmetics?.frame?.id ? frameStyles[cosmetics.frame.id] || '' : '';
  const nameColorClass = cosmetics?.nameColor?.id ? nameColorStyles[cosmetics.nameColor.id] || 'text-white' : 'text-white';

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--bg-elevated)]">
      <div className="flex items-center gap-4">
        {/* Avatar with Frame */}
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center ${frameClass}`}>
          <span className="text-2xl">
            {cosmetics?.badge?.icon || user.level?.icon || '👤'}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1">
          <p className={`font-bold text-lg ${nameColorClass}`}>
            {shortWallet}
          </p>
          <p className="text-[var(--text-muted)] text-sm">
            {user.level?.name || 'Bronze'} Miner
          </p>
        </div>

        {/* Equipped Items Preview */}
        {cosmetics && (cosmetics.frame || cosmetics.nameColor || cosmetics.badge) && (
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
      {cosmetics && (cosmetics.frame || cosmetics.nameColor || cosmetics.badge) && (
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

      {/* No cosmetics - CTA */}
      {(!cosmetics || (!cosmetics.frame && !cosmetics.nameColor && !cosmetics.badge)) && (
        <div className="mt-4 pt-4 border-t border-[var(--bg-elevated)]">
          <Link
            href="/shop"
            className="text-[var(--accent-primary)] text-sm hover:underline flex items-center gap-1"
          >
            <span>🎨</span>
            Customize your profile in the Shop →
          </Link>
        </div>
      )}
    </div>
  );
}

// =============================================
// LEVEL OVERVIEW - V2
// =============================================

function LevelOverview({ user }) {
  const level = user.level || {
    name: 'Bronze',
    icon: '🥉',
    bonus: 0,
    progress: 0,
    nextLevel: 'Silver',
    nextLevelIcon: '🥈',
    pointsToNext: 1000,
  };

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
    <div className={`bg-gradient-to-br ${levelColors[level.name] || levelColors.Bronze} rounded-2xl p-5 border ${levelBorders[level.name] || levelBorders.Bronze}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center">
            <span className="text-2xl">{level.icon}</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{level.name}</h2>
            <p className="text-[var(--text-muted)] text-xs">
              {level.bonus > 0 ? `+${(level.bonus * 100).toFixed(0)}% mining bonus` : 'Starting tier'}
            </p>
          </div>
        </div>
        <Link
          href="/mine"
          className="text-[var(--accent-primary)] text-sm font-medium hover:underline"
        >
          Mine →
        </Link>
      </div>

      {/* Progress bar */}
      {level.nextLevel && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--text-muted)]">
              {level.nextLevelIcon} {level.nextLevel}
            </span>
            <span className="text-[var(--text-muted)]">
              {level.pointsToNext?.toLocaleString()} pts to go
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

      {!level.nextLevel && (
        <p className="text-yellow-400 text-xs text-center">🎉 Maximum level achieved!</p>
      )}
    </div>
  );
}

// =============================================
// POINTS OVERVIEW
// =============================================

function PointsOverview({ user }) {
  return (
    <div className="bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--accent-secondary)]/10 rounded-2xl p-6 border border-[var(--accent-primary)]/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <span className="text-xl">💰</span>
          Your Points
        </h2>
        <Link
          href="/mine"
          className="text-[var(--accent-primary)] text-sm font-medium hover:underline"
        >
          Mine more →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/20 rounded-xl p-4">
          <p className="text-[var(--text-muted)] text-xs mb-1">Season Points</p>
          <p className="text-white text-3xl font-bold">
            {user.points?.season?.toLocaleString() || '0'}
          </p>
          <p className="text-[var(--accent-primary)] text-xs mt-1">
            {user.season?.name || 'Current Season'}
          </p>
        </div>
        <div className="bg-black/20 rounded-xl p-4">
          <p className="text-[var(--text-muted)] text-xs mb-1">Lifetime Points</p>
          <p className="text-white text-3xl font-bold">
            {user.points?.lifetime?.toLocaleString() || '0'}
          </p>
          <p className="text-[var(--text-muted)] text-xs mt-1">
            All time earnings
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================
// QUICK ACTIONS
// =============================================

function QuickActions({ user }) {
  const canMine = user.mining?.canMine;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        href="/mine"
        className={`p-4 rounded-xl text-center transition-all ${
          canMine
            ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-black font-bold hover:opacity-90'
            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--bg-elevated)]'
        }`}
      >
        <span className="text-2xl block mb-1">{canMine ? '⛏️' : '⏳'}</span>
        <span className="text-sm">{canMine ? 'Mine Now!' : 'On Cooldown'}</span>
      </Link>

      <Link
        href="/leaderboard"
        className="p-4 rounded-xl text-center bg-[var(--bg-card)] border border-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] transition-colors"
      >
        <span className="text-2xl block mb-1">🏆</span>
        <span className="text-sm text-[var(--text-secondary)]">
          {user.rank ? `Rank #${user.rank}` : 'Leaderboard'}
        </span>
      </Link>
    </div>
  );
}

// =============================================
// STATS GRID
// =============================================

function StatsGrid({ user }) {
  // V2: Determinar minerLevel
  const minerLevel = user.miner?.level || 'Free';
  const minerDisplay = minerLevel === 'Free' ? 'Free' : minerLevel;

  const stats = [
    {
      label: 'Mining Tier',
      value: minerDisplay,
      icon: minerLevel === 'Free' ? '👤' : minerLevel === 'Basic' ? '🔨' : minerLevel === 'Pro' ? '⚡' : '💎',
      color: minerLevel === 'Free' ? 'from-slate-500/20 to-slate-600/20' :
             minerLevel === 'Basic' ? 'from-gray-500/20 to-gray-600/20' :
             minerLevel === 'Pro' ? 'from-blue-500/20 to-cyan-500/20' :
             'from-purple-500/20 to-pink-500/20',
    },
    {
      label: 'Current Streak',
      value: user.streak?.current || 0,
      suffix: 'days',
      icon: '🔥',
      color: 'from-red-500/20 to-orange-500/20',
    },
    {
      label: 'Season Rank',
      value: user.rank ? `#${user.rank}` : '—',
      icon: '🏆',
      color: 'from-amber-500/20 to-yellow-500/20',
    },
    {
      label: 'Total Bonus',
      value: `+${((user.mining?.bonuses?.total || 0) * 100).toFixed(0)}%`,
      icon: '✨',
      color: user.mining?.bonuses?.capped
        ? 'from-yellow-500/20 to-orange-500/20'
        : 'from-purple-500/20 to-pink-500/20',
    },
  ];

  return (
    <section>
      <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
        <span className="text-lg">📊</span>
        Your Stats
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

function NFTsSection({ user }) {
  const minerConfig = {
    Basic: { icon: '🔨', color: 'from-gray-500 to-gray-600' },
    Pro: { icon: '⚡', color: 'from-blue-500 to-cyan-500' },
    Ultra: { icon: '💎', color: 'from-purple-500 to-pink-500' },
  };

  const miner = user.miner?.level ? minerConfig[user.miner.level] : null;

  return (
    <section className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--bg-elevated)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <span className="text-lg">🖼️</span>
          Your NFTs
        </h2>
        <a
          href="https://opensea.io/collection/archive-of-meme-arch"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent-primary)] text-sm font-medium hover:underline"
        >
          View on OpenSea →
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Miner NFT */}
        <div className="bg-[var(--bg-elevated)] rounded-xl p-4">
          <p className="text-[var(--text-muted)] text-xs mb-2">Miner</p>
          {miner ? (
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${miner.color} flex items-center justify-center`}>
                <span className="text-2xl">{miner.icon}</span>
              </div>
              <div>
                <p className="text-white font-semibold">{user.miner.level}</p>
                <p className="text-[var(--text-muted)] text-xs">
                  {user.miner.basePoints} pts/mine
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-card)] flex items-center justify-center">
                <span className="text-2xl opacity-30">⛏️</span>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">No miner</p>
                <Link href="/mine" className="text-[var(--accent-primary)] text-xs hover:underline">
                  Get one →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Meme NFTs */}
        <div className="bg-[var(--bg-elevated)] rounded-xl p-4">
          <p className="text-[var(--text-muted)] text-xs mb-2">Meme NFTs</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
              <span className="text-2xl">🖼️</span>
            </div>
            <div>
              <p className="text-white font-semibold">{user.nfts?.memeCount || 0}</p>
              <p className="text-[var(--text-muted)] text-xs">
                {user.nfts?.memeCount > 0
                  ? `+${((user.mining?.bonuses?.memes || 0) * 100).toFixed(0)}% bonus`
                  : 'No bonus yet'}
              </p>
            </div>
          </div>
        </div>

        {/* OG Pass */}
        <div className="bg-[var(--bg-elevated)] rounded-xl p-4 col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                user.nfts?.hasPass
                  ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
                  : 'bg-[var(--bg-card)]'
              }`}>
                <span className="text-2xl">{user.nfts?.hasPass ? '🎫' : '🔒'}</span>
              </div>
              <div>
                <p className="text-white font-semibold">OG Pass</p>
                <p className="text-[var(--text-muted)] text-xs">
                  {user.nfts?.hasPass ? '+5% mining bonus + comments + badge' : 'Not owned'}
                </p>
              </div>
            </div>
            {!user.nfts?.hasPass && (
              <a
                href="https://opensea.io/collection/archive-of-meme-pass"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[var(--bg-card)] text-[var(--accent-primary)] text-sm rounded-lg hover:bg-[var(--accent-primary)]/10 transition-colors"
              >
                Get Pass
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================
// BADGES SECTION
// =============================================

function BadgesSection({ user }) {
  // Usar badges de la API (persistidos en BD)
  const badges = user?.badges || [];
  const unlockedCount = badges.filter(b => b.unlocked).length;

  // Mapeo de colores Tailwind a hex
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

  return (
    <section className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--bg-elevated)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <span className="text-lg">🏅</span>
          Badges
        </h2>
        <span className="text-[var(--text-muted)] text-xs px-2 py-1 bg-[var(--bg-elevated)] rounded-full">
          {unlockedCount} / {badges.length}
        </span>
      </div>

      {badges.length === 0 ? (
        <p className="text-[var(--text-muted)] text-xs text-center py-4">
          Loading badges...
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all ${
                badge.unlocked ? 'shadow-lg' : 'bg-[var(--bg-elevated)] opacity-40'
              }`}
              style={badge.unlocked ? { background: getGradient(badge) } : undefined}
              title={badge.unlocked ? `${badge.name}: ${badge.description}` : `${badge.name} - Locked`}
            >
              <span className="text-2xl mb-1">{badge.icon}</span>
              <span className={`text-[10px] font-medium text-center leading-tight ${badge.unlocked ? 'text-white' : 'text-[var(--text-muted)]'}`}>
                {badge.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {badges.length > 0 && unlockedCount === 0 && (
        <p className="text-[var(--text-muted)] text-xs text-center mt-3">
          Complete achievements to earn badges
        </p>
      )}
    </section>
  );
}

// =============================================
// REFERRAL SECTION
// =============================================

function ReferralSection({ wallet }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [applyingCode, setApplyingCode] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!wallet) return;

    const fetchReferrals = async () => {
      try {
        const res = await fetch(`/api/referrals?wallet=${wallet}`);
        const result = await res.json();
        if (!result.error) {
          setData(result);
        }
      } catch (err) {
        console.error('Error fetching referrals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [wallet]);

  const copyLink = async () => {
    if (!data?.referralLink) return;
    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const applyCode = async () => {
    if (!codeInput.trim() || applyingCode) return;

    setApplyingCode(true);
    setMessage(null);

    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, referralCode: codeInput.trim() }),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: result.message || result.error });
      } else {
        setMessage({ type: 'success', text: 'Referral code applied!' });
        setCodeInput('');
        // Refresh data
        const refreshRes = await fetch(`/api/referrals?wallet=${wallet}`);
        const refreshData = await refreshRes.json();
        if (!refreshData.error) setData(refreshData);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to apply code' });
    } finally {
      setApplyingCode(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--bg-elevated)]">
        <div className="h-32 bg-[var(--bg-elevated)] rounded-lg animate-pulse" />
      </section>
    );
  }

  return (
    <section className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--bg-elevated)]">
      <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="text-lg">👥</span>
        Referrals
      </h2>

      {/* Referral Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[var(--bg-elevated)] rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-white">{data?.stats?.totalReferrals || 0}</p>
          <p className="text-xs text-[var(--text-muted)]">Total</p>
        </div>
        <div className="bg-[var(--bg-elevated)] rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{data?.stats?.activeReferrals || 0}</p>
          <p className="text-xs text-[var(--text-muted)]">Active</p>
        </div>
        <div className="bg-[var(--bg-elevated)] rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-[var(--accent-primary)]">{data?.stats?.totalPointsEarned || 0}</p>
          <p className="text-xs text-[var(--text-muted)]">Pts Earned</p>
        </div>
      </div>

      {/* Your Referral Link */}
      <div className="mb-4">
        <p className="text-[var(--text-muted)] text-xs mb-2">Your Referral Link</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-[var(--bg-elevated)] rounded-lg px-3 py-2 text-white text-sm overflow-hidden">
            <span className="text-[var(--text-muted)]">archiveofmeme.com?ref=</span>
            <span className="font-mono text-[var(--accent-primary)]">{data?.referralCode || '...'}</span>
          </div>
          <button
            onClick={copyLink}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-[var(--accent-primary)] text-black hover:brightness-110'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Apply Referral Code (if not already referred) */}
      {!data?.referredBy && (
        <div className="mb-4">
          <p className="text-[var(--text-muted)] text-xs mb-2">Have a referral code?</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 bg-[var(--bg-elevated)] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              maxLength={8}
            />
            <button
              onClick={applyCode}
              disabled={!codeInput.trim() || applyingCode}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500 text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {applyingCode ? '...' : 'Apply'}
            </button>
          </div>
          {message && (
            <p className={`text-xs mt-2 ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
              {message.text}
            </p>
          )}
        </div>
      )}

      {/* Referred By */}
      {data?.referredBy && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm">
            Referred by: <span className="font-mono">{data.referredBy.shortWallet}</span>
          </p>
        </div>
      )}

      {/* Referral Rewards Info */}
      <div className="text-[var(--text-muted)] text-xs space-y-1 border-t border-[var(--bg-elevated)] pt-3">
        <p>• Earn <span className="text-[var(--accent-primary)]">100 pts</span> when your referral mines 10 times</p>
        <p>• Earn <span className="text-[var(--accent-primary)]">5%</span> of what your referrals mine (30 days)</p>
      </div>

      {/* Recent Referrals List */}
      {data?.referrals?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--bg-elevated)]">
          <p className="text-[var(--text-muted)] text-xs mb-2">Your Referrals</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {data.referrals.slice(0, 5).map((ref, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-mono text-white">{ref.shortWallet}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${ref.isActive ? 'text-green-400' : 'text-[var(--text-muted)]'}`}>
                    {ref.isActive ? 'Active' : 'Pending'}
                  </span>
                  <span className="text-[var(--accent-primary)] text-xs">+{ref.pointsEarned} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// =============================================
// HISTORY SECTION
// =============================================

function HistorySection({ history, loading }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <section className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--bg-elevated)]">
      <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="text-lg">📜</span>
        Recent Activity
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-[var(--bg-elevated)] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-4xl block mb-2 opacity-30">📭</span>
          <p className="text-[var(--text-muted)] text-sm">No activity yet</p>
          <Link
            href="/mine"
            className="text-[var(--accent-primary)] text-sm hover:underline"
          >
            Start mining →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 bg-[var(--bg-elevated)] rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <span className="text-lg">⛏️</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    {tx.description || 'Mining'}
                  </p>
                  <p className="text-[var(--text-muted)] text-xs">
                    {formatDate(tx.created_at)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-semibold">+{tx.amount}</p>
                <p className="text-[var(--text-muted)] text-xs">points</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// =============================================
// STATES
// =============================================

function NotConnectedState() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-white text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-[var(--text-muted)] text-sm">
          Connect your wallet to view your dashboard
        </p>
      </header>

      <div className="bg-[var(--bg-card)] rounded-2xl p-8 text-center border border-[var(--bg-elevated)]">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 flex items-center justify-center">
          <span className="text-4xl">🔗</span>
        </div>
        <h2 className="text-white text-xl font-semibold mb-2">Connect Wallet</h2>
        <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto">
          Connect your wallet to see your points, NFTs, and activity history.
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[var(--bg-card)] rounded-lg animate-pulse" />
      <div className="h-40 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--bg-card)] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-48 bg-[var(--bg-card)] rounded-xl animate-pulse" />
    </div>
  );
}

function NotRegisteredState() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-white text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-[var(--text-muted)] text-sm">
          Start mining to see your stats
        </p>
      </header>

      <div className="bg-[var(--bg-card)] rounded-2xl p-8 text-center border border-[var(--bg-elevated)]">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 flex items-center justify-center">
          <span className="text-4xl">⛏️</span>
        </div>
        <h2 className="text-white text-xl font-semibold mb-2">Start Mining</h2>
        <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto mb-6">
          Get a miner NFT to start earning points and tracking your progress.
        </p>
        <Link
          href="/mine"
          className="inline-block px-6 py-3 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-black font-bold rounded-xl hover:opacity-90 transition-all"
        >
          Go to Mining →
        </Link>
      </div>
    </div>
  );
}
