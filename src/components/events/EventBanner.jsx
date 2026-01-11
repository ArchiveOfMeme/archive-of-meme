'use client';

import { useState, useEffect } from 'react';

/**
 * EventBanner - Muestra banner cuando hay evento activo
 *
 * Se muestra en la parte superior de la página de mining
 * cuando hay un evento con multiplicador activo.
 */
export default function EventBanner() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Fetch active event
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();

        if (data.hasActiveEvent && data.mainEvent) {
          setEvent(data.mainEvent);
        } else {
          setEvent(null);
        }
      } catch (err) {
        console.error('Error fetching event:', err);
      }
      setLoading(false);
    };

    fetchEvent();
    // Refresh every 5 minutes
    const interval = setInterval(fetchEvent, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update countdown
  useEffect(() => {
    if (!event?.endsAt) return;

    const updateCountdown = () => {
      const end = new Date(event.endsAt);
      const now = new Date();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('Ending soon...');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${minutes}m remaining`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [event]);

  if (loading || !event) return null;

  // Colores según tipo de evento
  const getBannerStyle = () => {
    switch (event.type) {
      case 'weekly':
        return 'from-blue-600/20 to-purple-600/20 border-blue-500/30';
      case 'anniversary':
        return 'from-yellow-600/20 to-orange-600/20 border-yellow-500/30';
      case 'special':
        return 'from-green-600/20 to-emerald-600/20 border-green-500/30';
      default:
        return 'from-[var(--accent-primary)]/20 to-purple-600/20 border-[var(--accent-primary)]/30';
    }
  };

  const getMultiplierText = () => {
    const mult = event.multiplier;
    if (mult === 2) return 'DOUBLE POINTS';
    if (mult === 1.5) return '+50% POINTS';
    if (mult === 3) return 'TRIPLE POINTS';
    return `${mult}x POINTS`;
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-r ${getBannerStyle()} p-4 mb-4`}
    >
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />

      <div className="relative flex items-center justify-between gap-4">
        {/* Left: Event info */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">{event.icon}</span>
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              {event.name}
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold uppercase">
                {getMultiplierText()}
              </span>
            </h3>
            <p className="text-[var(--text-secondary)] text-sm">
              {event.description}
            </p>
          </div>
        </div>

        {/* Right: Timer */}
        <div className="text-right shrink-0">
          <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">
            Time Left
          </p>
          <p className="text-white font-mono font-bold">
            {timeRemaining}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * EventBannerCompact - Versión compacta para mobile
 */
export function EventBannerCompact() {
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.hasActiveEvent && data.mainEvent) {
          setEvent(data.mainEvent);
        }
      } catch (err) {
        console.error('Error fetching event:', err);
      }
    };

    fetchEvent();
    const interval = setInterval(fetchEvent, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!event) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[var(--accent-primary)]/20 to-purple-600/20 rounded-full">
      <span className="text-lg">{event.icon}</span>
      <span className="text-white text-sm font-medium">{event.name}</span>
      <span className="text-[var(--accent-primary)] text-xs font-bold">
        {event.multiplier}x
      </span>
    </div>
  );
}
