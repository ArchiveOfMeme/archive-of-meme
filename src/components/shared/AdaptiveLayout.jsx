'use client';

import { useDeviceMode } from '@/hooks/useDeviceMode';
import MobileLayout from '@/components/mobile/MobileLayout';
import DesktopLayout from '@/components/desktop/DesktopLayout';

/**
 * AdaptiveLayout - Detecta el dispositivo y renderiza el layout apropiado
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido principal de la página
 * @param {React.ReactNode} props.sidebar - Contenido del sidebar derecho (solo desktop)
 * @param {string} props.activeTab - Tab activo para la navegación ('home' | 'search' | 'points' | 'profile')
 */
export default function AdaptiveLayout({
  children,
  sidebar = null,
  activeTab = 'home'
}) {
  const mode = useDeviceMode();

  // PWA o móvil web → Layout móvil
  if (mode === 'mobile-pwa' || mode === 'mobile-web') {
    return (
      <MobileLayout activeTab={activeTab}>
        {children}
      </MobileLayout>
    );
  }

  // Desktop → Layout de 3 columnas
  return (
    <DesktopLayout sidebar={sidebar}>
      {children}
    </DesktopLayout>
  );
}
