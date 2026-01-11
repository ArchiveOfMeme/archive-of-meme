'use client';

import { useDeviceMode } from '@/hooks/useDeviceMode';
import MobileLayout from '@/components/mobile/MobileLayout';
import MobileHome from '@/components/mobile/MobileHome';
import DesktopLayout from '@/components/desktop/DesktopLayout';
import DesktopFeed from '@/components/desktop/DesktopFeed';
import TrendingSidebar from '@/components/desktop/TrendingSidebar';

export default function Home() {
  const mode = useDeviceMode();

  // Móvil (PWA o web) - Nuevo diseño app-like
  if (mode === 'mobile-pwa' || mode === 'mobile-web') {
    return (
      <MobileLayout activeTab="home">
        <MobileHome />
      </MobileLayout>
    );
  }

  // Desktop - Se rediseñará después
  return (
    <DesktopLayout sidebar={<TrendingSidebar />}>
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">The Archive</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Explore the digital museum of iconic memes
        </p>
      </div>
      <DesktopFeed />
    </DesktopLayout>
  );
}
