'use client';

import { Suspense } from 'react';
import { useDeviceMode } from '@/hooks/useDeviceMode';
import DesktopLayout from '@/components/desktop/DesktopLayout';
import TrendingSidebar from '@/components/desktop/TrendingSidebar';
import MobileLayout from '@/components/mobile/MobileLayout';
import DesktopExplore from '@/components/desktop/DesktopExplore';
import MobileSearch from '@/components/mobile/MobileSearch';

export default function ExplorePage() {
  const mode = useDeviceMode();
  const isMobile = mode === 'mobile-pwa' || mode === 'mobile-web';

  if (isMobile) {
    return (
      <MobileLayout>
        <Suspense fallback={<SearchLoading />}>
          <MobileSearch />
        </Suspense>
      </MobileLayout>
    );
  }

  return (
    <DesktopLayout sidebar={<TrendingSidebar />}>
      <Suspense fallback={<SearchLoading />}>
        <DesktopExplore />
      </Suspense>
    </DesktopLayout>
  );
}

function SearchLoading() {
  return (
    <div className="space-y-6">
      <div className="h-12 bg-[var(--bg-card)] rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-[var(--bg-card)] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
