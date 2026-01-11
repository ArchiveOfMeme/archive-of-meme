'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ActivityFeed({ compact = false }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(`/api/activity?limit=${compact ? 5 : 15}`);
        const data = await res.json();
        if (!data.error) {
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error('Error fetching activity:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();

    // Refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, [compact]);

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--bg-elevated)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--bg-elevated)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-sm font-medium">LIVE</span>
        </div>
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-[var(--bg-elevated)] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--bg-elevated)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--bg-elevated)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-sm font-medium">LIVE</span>
        </div>
        <div className="p-8 text-center">
          <p className="text-[var(--text-muted)] text-sm">No activity yet</p>
          <Link href="/mine" className="text-[var(--accent-primary)] text-sm hover:underline">
            Be the first to mine →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--bg-elevated)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--bg-elevated)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-sm font-medium">LIVE</span>
          <span className="text-[var(--text-muted)] text-xs">Community Activity</span>
        </div>
        {compact && (
          <Link href="/" className="text-[var(--text-muted)] text-xs hover:text-white transition-colors">
            See all →
          </Link>
        )}
      </div>

      {/* Events */}
      <div className={`divide-y divide-[var(--bg-elevated)] ${compact ? 'max-h-[280px]' : 'max-h-[400px]'} overflow-y-auto`}>
        {events.map((event) => (
          <ActivityEvent key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

function ActivityEvent({ event }) {
  return (
    <div className={`px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-elevated)]/50 transition-colors ${event.highlight ? 'bg-yellow-500/5' : ''}`}>
      {/* Icon */}
      <span className="text-xl shrink-0">{event.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">
          <span className="font-mono text-white">{event.wallet}</span>
          {' '}
          <span className={event.color || 'text-[var(--text-muted)]'}>{event.message}</span>
        </p>
      </div>

      {/* Time */}
      <span className="text-[var(--text-muted)] text-xs shrink-0">{event.timeAgo}</span>
    </div>
  );
}

// Compact horizontal ticker version for mobile
export function ActivityTicker() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/activity?limit=10');
        const data = await res.json();
        if (!data.error) {
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error('Error fetching activity:', err);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  if (events.length === 0) return null;

  return (
    <div className="bg-[var(--bg-card)] border-b border-[var(--bg-elevated)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
        <div className="overflow-hidden flex-1">
          <div className="flex gap-6 animate-scroll-x">
            {events.map((event) => (
              <span key={event.id} className="text-sm whitespace-nowrap">
                <span className="mr-1">{event.icon}</span>
                <span className="font-mono text-white">{event.wallet}</span>
                {' '}
                <span className={event.color}>{event.message}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
