'use client';

import { Suspense } from 'react';
import { useDeviceMode } from '@/hooks/useDeviceMode';
import DesktopLayout from '@/components/desktop/DesktopLayout';
import MobileLayout from '@/components/mobile/MobileLayout';
import Shop from '@/components/shop/Shop';

export default function ShopPage() {
  const mode = useDeviceMode();
  const isMobile = mode === 'mobile-pwa' || mode === 'mobile-web';

  if (isMobile) {
    return (
      <MobileLayout>
        <Suspense fallback={<ShopLoading />}>
          <Shop />
        </Suspense>
      </MobileLayout>
    );
  }

  return (
    <DesktopLayout>
      <Suspense fallback={<ShopLoading />}>
        <Shop />
      </Suspense>
    </DesktopLayout>
  );
}

function ShopLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[var(--bg-card)] rounded animate-pulse" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-[var(--bg-card)] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
