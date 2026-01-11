'use client';

import { Suspense } from 'react';
import { useDeviceMode } from '@/hooks/useDeviceMode';
import DesktopLayout from '@/components/desktop/DesktopLayout';
import MobileLayout from '@/components/mobile/MobileLayout';
import Leaderboard from '@/components/leaderboard/Leaderboard';

export default function LeaderboardPage() {
  const mode = useDeviceMode();
  const isMobile = mode === 'mobile-pwa' || mode === 'mobile-web';

  if (isMobile) {
    return (
      <MobileLayout>
        <Suspense fallback={<LeaderboardLoading />}>
          <Leaderboard />
        </Suspense>
      </MobileLayout>
    );
  }

  return (
    <DesktopLayout>
      <Suspense fallback={<LeaderboardLoading />}>
        <Leaderboard />
      </Suspense>
    </DesktopLayout>
  );
}

function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[var(--bg-card)] rounded-lg animate-pulse" />
      <div className="h-12 bg-[var(--bg-card)] rounded-xl animate-pulse" />
      <div className="h-64 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
      <div className="h-96 bg-[var(--bg-card)] rounded-xl animate-pulse" />
    </div>
  );
}
