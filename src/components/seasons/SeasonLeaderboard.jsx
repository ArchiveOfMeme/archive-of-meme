'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';

/**
 * SeasonLeaderboard - Ranking de la temporada activa
 */
export default function SeasonLeaderboard({ limit = 10, showUserRank = true }) {
  const { address, isConnected } = useAccount();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = `/api/seasons?active=true&leaderboard=true&limit=${limit}`;
        if (address) {
          url += `&wallet=${address}`;
        }

        const res = await fetch(url);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching season data:', err);
      }
      setLoading(false);
    };

    fetchData();
  }, [address, limit]);

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-[var(--bg-elevated)] rounded w-1/3" />
          <div className="h-4 bg-[var(--bg-elevated)] rounded w-full" />
          <div className="h-4 bg-[var(--bg-elevated)] rounded w-full" />
          <div className="h-4 bg-[var(--bg-elevated)] rounded w-full" />
        </div>
      </div>
    );
  }

  // No hay temporada activa
  if (!data?.activeSeason && !data?.pendingSeason) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Season Leaderboard</h3>

        {data?.usersForSeasonOne ? (
          <div className="text-center py-4">
            <p className="text-[var(--text-secondary)] mb-3">
              Season 1 will start when we reach 100 active miners
            </p>
            <div className="mb-2">
              <div className="h-3 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-purple-500 transition-all"
                  style={{ width: `${data.usersForSeasonOne.progress}%` }}
                />
              </div>
            </div>
            <p className="text-white font-bold">
              {data.usersForSeasonOne.current} / {data.usersForSeasonOne.required}
            </p>
            <p className="text-[var(--text-muted)] text-xs mt-1">
              active miners
            </p>
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-center py-4">
            No active season
          </p>
        )}
      </div>
    );
  }

  // Temporada pendiente (esperando fecha de inicio)
  if (data?.pendingSeason && !data?.activeSeason) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">
          {data.pendingSeason.name}
        </h3>
        <div className="text-center py-4">
          <p className="text-[var(--accent-primary)] font-bold text-lg">
            Coming Soon
          </p>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Starts {new Date(data.pendingSeason.startDate).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  const season = data.activeSeason;
  const leaderboard = data.leaderboard || [];
  const userRank = data.userRank;

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <span className="text-xl">🏆</span>
            {season.name}
          </h3>
          <p className="text-[var(--text-muted)] text-xs">
            {season.daysRemaining} days remaining
          </p>
        </div>
        <Link
          href="/leaderboard?tab=season"
          className="text-[var(--accent-primary)] text-xs hover:underline"
        >
          View All
        </Link>
      </div>

      {/* Leaderboard */}
      {leaderboard.length === 0 ? (
        <p className="text-[var(--text-muted)] text-center py-4 text-sm">
          No participants yet. Be the first!
        </p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => {
            const isUser = address && entry.wallet.toLowerCase() === address.toLowerCase();
            const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

            return (
              <div
                key={entry.wallet}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isUser
                    ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30'
                    : 'hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center">
                  {rankIcon ? (
                    <span className="text-lg">{rankIcon}</span>
                  ) : (
                    <span className="text-[var(--text-muted)] text-sm font-mono">
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/profile/${entry.wallet}`}
                    className="text-white text-sm font-medium hover:text-[var(--accent-primary)] truncate block"
                  >
                    {entry.shortWallet}
                    {isUser && <span className="text-[var(--accent-primary)] ml-1">(You)</span>}
                  </Link>
                  <p className="text-[var(--text-muted)] text-xs">
                    {entry.level}
                  </p>
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className="text-white font-bold text-sm">
                    {entry.seasonPoints.toLocaleString()}
                  </p>
                  <p className="text-[var(--text-muted)] text-xs">pts</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User's rank if not in top */}
      {showUserRank && userRank && userRank.rank > limit && (
        <div className="mt-4 pt-4 border-t border-[var(--bg-elevated)]">
          <div className="flex items-center gap-3 p-2 bg-[var(--accent-primary)]/10 rounded-lg">
            <div className="w-8 text-center">
              <span className="text-[var(--text-muted)] text-sm font-mono">
                #{userRank.rank}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">
                {userRank.shortWallet}
                <span className="text-[var(--accent-primary)] ml-1">(You)</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-sm">
                {userRank.seasonPoints.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prize info */}
      <div className="mt-4 pt-4 border-t border-[var(--bg-elevated)]">
        <p className="text-[var(--text-muted)] text-xs text-center">
          Top 10 earn exclusive badges + mining bonus for next season
        </p>
      </div>
    </div>
  );
}

/**
 * SeasonProgress - Mini widget de progreso de temporada
 */
export function SeasonProgress() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/seasons?active=true')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data?.activeSeason) return null;

  const season = data.activeSeason;
  const totalDays = Math.ceil(
    (new Date(season.endDate) - new Date(season.startDate)) / (1000 * 60 * 60 * 24)
  );
  const progress = ((totalDays - season.daysRemaining) / totalDays) * 100;

  return (
    <div className="bg-[var(--bg-elevated)] rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-sm font-medium">{season.name}</span>
        <span className="text-[var(--text-muted)] text-xs">
          {season.daysRemaining}d left
        </span>
      </div>
      <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-purple-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
