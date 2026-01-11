'use client';

import { use } from 'react';
import { useDeviceMode } from '@/hooks/useDeviceMode';
import MobileLayout from '@/components/mobile/MobileLayout';
import DesktopLayout from '@/components/desktop/DesktopLayout';
import PublicProfile from '@/components/profile/PublicProfile';

export default function ProfilePage({ params }) {
  const { wallet } = use(params);
  const mode = useDeviceMode();

  // Mobile
  if (mode === 'mobile-pwa' || mode === 'mobile-web') {
    return (
      <MobileLayout activeTab="profile">
        <PublicProfile wallet={wallet} />
      </MobileLayout>
    );
  }

  // Desktop
  return (
    <DesktopLayout>
      <div className="max-w-2xl mx-auto">
        <PublicProfile wallet={wallet} />
      </div>
    </DesktopLayout>
  );
}
