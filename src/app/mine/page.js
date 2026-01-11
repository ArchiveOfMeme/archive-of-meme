'use client';

import { Suspense } from 'react';
import { useDeviceMode } from '@/hooks/useDeviceMode';
import DesktopLayout from '@/components/desktop/DesktopLayout';
import MobileLayout from '@/components/mobile/MobileLayout';
import MiningDashboard from '@/components/mining/MiningDashboard';

export default function MinePage() {
  const mode = useDeviceMode();
  const isMobile = mode === 'mobile-pwa' || mode === 'mobile-web';

  if (isMobile) {
    return (
      <MobileLayout>
        <Suspense fallback={<MiningLoading />}>
          <MiningDashboard />
        </Suspense>
      </MobileLayout>
    );
  }

  return (
    <DesktopLayout>
      <Suspense fallback={<MiningLoading />}>
        <MiningDashboard />
      </Suspense>
    </DesktopLayout>
  );
}

function MiningLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[var(--bg-card)] rounded animate-pulse" />
      <div className="h-64 bg-[var(--bg-card)] rounded-xl animate-pulse" />
      <div className="h-48 bg-[var(--bg-card)] rounded-xl animate-pulse" />
    </div>
  );
}
