'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function Leaderboard() {
  const { address, isConnected } = useAccount();
  const [type, setType] = useState('season');
  const [leaderboard, setLeaderboard] = useState([]);
  const [podium, setPodium] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        limit: '50',
        ...(address && { wallet: address }),
      });

      const res = await fetch(`/api/mining/leaderboard?${params}`);
      const data = await res.json();

      if (!data.error) {
        setLeaderboard(data.leaderboard || []);
        setPodium(data.podium || []);
        setUserData(data.userData);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [type, address]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header>
        <h1 className="text-white text-2xl font-bold mb-1">Leaderboard</h1>
        <p className="text-[var(--text-muted)] text-sm">
          Top miners competing for glory
        </p>
      </header>

      {/* Type Toggle */}
      <div className="flex gap-2 p-1 bg-[var(--bg-card)] rounded-xl">
        <button
          onClick={() => setType('season')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            type === 'season'
              ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-black'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          Season
        </button>
        <button
          onClick={() => setType('lifetime')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            type === 'lifetime'
              ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-black'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          All Time
        </button>
      </div>

      {/* User's Position (if logged in and ranked) */}
      {isConnected && userData && (
        <UserPositionCard user={userData} type={type} />
      )}

      {/* Podium */}
      {!loading && podium.length >= 3 && (
        <Podium podium={podium} type={type} currentWallet={address} />
      )}

      {/* Leaderboard List */}
      <LeaderboardList
        entries={leaderboard}
        loading={loading}
        type={type}
        currentWallet={address}
        total={total}
      />
    </div>
  );
}

// =============================================
// USER POSITION CARD
// =============================================

function UserPositionCard({ user, type }) {
  return (
    <div className="bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-secondary)]/10 rounded-xl p-4 border border-[var(--accent-primary)]/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center">
            <span className="text-[var(--accent-primary)] font-bold text-lg">
              #{user.rank}
            </span>
          </div>
          <div>
            <p className="text-white font-medium">Your Position</p>
            <p className="text-[var(--text-muted)] text-sm">
              {type === 'season' ? 'Season' : 'All Time'} Ranking
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-bold text-xl">
            {user.points?.toLocaleString()}
          </p>
          <p className="text-[var(--text-muted)] text-sm">points</p>
        </div>
      </div>
    </div>
  );
}

// =============================================
// PODIUM
// =============================================

function Podium({ podium, type, currentWallet }) {
  // Reorder for display: 2nd, 1st, 3rd
  const displayOrder = [podium[1], podium[0], podium[2]];

  const podiumConfig = [
    { height: 'h-20', bg: 'from-gray-400 to-gray-500', medal: '🥈', rank: 2 },
    { height: 'h-28', bg: 'from-yellow-400 to-yellow-500', medal: '🥇', rank: 1 },
    { height: 'h-16', bg: 'from-amber-600 to-amber-700', medal: '🥉', rank: 3 },
  ];

  const getMinerIcon = (level) => {
    switch (level) {
      case 'Ultra': return '💎';
      case 'Pro': return '⚡';
      default: return '🔨';
    }
  };

  const formatWallet = (wallet) => {
    if (!wallet) return '???';
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--bg-elevated)]">
      <h2 className="text-white font-semibold text-center mb-6">
        {type === 'season' ? 'Season Champions' : 'All-Time Legends'}
      </h2>

      <div className="flex items-end justify-center gap-2">
        {displayOrder.map((entry, index) => {
          const config = podiumConfig[index];
          const isCurrentUser = entry?.wallet?.toLowerCase() === currentWallet?.toLowerCase();

          const content = (
            <>
              {/* Avatar/Miner */}
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${config.bg} flex items-center justify-center mb-2 shadow-lg ${
                isCurrentUser ? 'ring-2 ring-[var(--accent-primary)]' : ''
              }`}>
                <span className="text-2xl">{entry ? getMinerIcon(entry.cached_miner_level) : '?'}</span>
              </div>

              {/* Medal */}
              <span className="text-2xl mb-1">{config.medal}</span>

              {/* Wallet */}
              <p className={`text-xs font-medium mb-1 ${isCurrentUser ? 'text-[var(--accent-primary)]' : 'text-white'}`}>
                {entry ? formatWallet(entry.wallet) : '—'}
              </p>

              {/* Points */}
              <p className="text-[var(--text-muted)] text-xs mb-2">
                {entry?.points?.toLocaleString() || 0} pts
              </p>

              {/* Podium Block */}
              <div className={`w-20 ${config.height} bg-gradient-to-t ${config.bg} rounded-t-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">#{config.rank}</span>
              </div>
            </>
          );

          if (entry?.wallet) {
            return (
              <Link key={config.rank} href={`/profile/${entry.wallet}`} className="flex flex-col items-center hover:opacity-80 transition-opacity">
                {content}
              </Link>
            );
          }

          return (
            <div key={config.rank} className="flex flex-col items-center">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================
// LEADERBOARD LIST
// =============================================

function LeaderboardList({ entries, loading, type, currentWallet, total }) {
  const getMinerIcon = (level) => {
    switch (level) {
      case 'Ultra': return '💎';
      case 'Pro': return '⚡';
      case 'Basic': return '🔨';
      default: return '👤';
    }
  };

  const getMinerColor = (level) => {
    switch (level) {
      case 'Ultra': return 'from-purple-500/20 to-pink-500/20';
      case 'Pro': return 'from-blue-500/20 to-cyan-500/20';
      default: return 'from-gray-500/20 to-gray-600/20';
    }
  };

  const formatWallet = (wallet) => {
    if (!wallet) return '???';
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const getRankDisplay = (rank) => {
    if (rank === 1) return { icon: '🥇', color: 'text-yellow-400' };
    if (rank === 2) return { icon: '🥈', color: 'text-gray-300' };
    if (rank === 3) return { icon: '🥉', color: 'text-amber-600' };
    return { icon: `#${rank}`, color: 'text-[var(--text-muted)]' };
  };

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--bg-elevated)]">
        <div className="p-4 border-b border-[var(--bg-elevated)]">
          <div className="h-5 w-32 bg-[var(--bg-elevated)] rounded animate-pulse" />
        </div>
        <div className="divide-y divide-[var(--bg-elevated)]">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="w-8 h-8 bg-[var(--bg-elevated)] rounded-lg animate-pulse" />
              <div className="w-10 h-10 bg-[var(--bg-elevated)] rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-[var(--bg-elevated)] rounded animate-pulse mb-2" />
                <div className="h-3 w-16 bg-[var(--bg-elevated)] rounded animate-pulse" />
              </div>
              <div className="h-5 w-16 bg-[var(--bg-elevated)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl p-8 text-center border border-[var(--bg-elevated)]">
        <span className="text-4xl block mb-2 opacity-30">🏆</span>
        <p className="text-[var(--text-muted)]">No miners on the leaderboard yet</p>
        <p className="text-[var(--accent-primary)] text-sm mt-1">Be the first!</p>
      </div>
    );
  }

  // Skip first 3 if we have podium
  const listEntries = entries.length >= 3 ? entries.slice(3) : entries;

  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--bg-elevated)] overflow-hidden">
      <div className="p-4 border-b border-[var(--bg-elevated)] flex items-center justify-between">
        <h3 className="text-white font-semibold">
          {type === 'season' ? 'Season Rankings' : 'All-Time Rankings'}
        </h3>
        <span className="text-[var(--text-muted)] text-sm">
          {total} miners
        </span>
      </div>

      <div className="divide-y divide-[var(--bg-elevated)]">
        {listEntries.map((entry) => {
          const isCurrentUser = entry.wallet?.toLowerCase() === currentWallet?.toLowerCase();
          const rankDisplay = getRankDisplay(entry.rank);

          return (
            <Link
              key={entry.wallet}
              href={`/profile/${entry.wallet}`}
              className={`p-4 flex items-center gap-4 transition-colors ${
                isCurrentUser
                  ? 'bg-[var(--accent-primary)]/5'
                  : 'hover:bg-[var(--bg-elevated)]/50'
              }`}
            >
              {/* Rank */}
              <div className={`w-10 text-center font-bold ${rankDisplay.color}`}>
                {rankDisplay.icon}
              </div>

              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMinerColor(entry.cached_miner_level)} flex items-center justify-center`}>
                <span className="text-lg">{getMinerIcon(entry.cached_miner_level)}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isCurrentUser ? 'text-[var(--accent-primary)]' : 'text-white'}`}>
                  {formatWallet(entry.wallet)}
                  {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  {entry.cached_miner_level && (
                    <span>{entry.cached_miner_level} Miner</span>
                  )}
                  {entry.current_streak > 0 && (
                    <span className="flex items-center gap-1">
                      <span>🔥</span> {entry.current_streak}d
                    </span>
                  )}
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <p className="text-white font-bold">
                  {entry.points?.toLocaleString()}
                </p>
                <p className="text-[var(--text-muted)] text-xs">pts</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Show "Top 3 above" message if we're showing list without first 3 */}
      {entries.length >= 3 && listEntries.length > 0 && (
        <div className="p-3 bg-[var(--bg-elevated)]/50 text-center">
          <p className="text-[var(--text-muted)] text-xs">
            Top 3 shown in podium above
          </p>
        </div>
      )}
    </div>
  );
}
