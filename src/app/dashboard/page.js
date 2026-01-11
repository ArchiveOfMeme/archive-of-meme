'use client';

import { Suspense } from 'react';
import { useDeviceMode } from '@/hooks/useDeviceMode';
import DesktopLayout from '@/components/desktop/DesktopLayout';
import MobileLayout from '@/components/mobile/MobileLayout';
import UserDashboard from '@/components/dashboard/UserDashboard';

export default function DashboardPage() {
  const mode = useDeviceMode();
  const isMobile = mode === 'mobile-pwa' || mode === 'mobile-web';

  if (isMobile) {
    return (
      <MobileLayout>
        <Suspense fallback={<DashboardLoading />}>
          <UserDashboard />
        </Suspense>
      </MobileLayout>
    );
  }

  return (
    <DesktopLayout>
      <Suspense fallback={<DashboardLoading />}>
        <UserDashboard />
      </Suspense>
    </DesktopLayout>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[var(--bg-card)] rounded-lg animate-pulse" />
      <div className="h-40 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--bg-card)] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
