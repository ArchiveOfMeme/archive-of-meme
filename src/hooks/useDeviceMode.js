'use client';

import { useState, useEffect } from 'react';

/**
 * Detecta el modo de visualización del dispositivo
 * @returns {'mobile-pwa' | 'mobile-web' | 'desktop'} modo actual
 */
export function useDeviceMode() {
  const [mode, setMode] = useState('desktop');

  useEffect(() => {
    const detectMode = () => {
      // 1. Detectar si es PWA instalada (standalone mode)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;

      if (isStandalone) {
        setMode('mobile-pwa');
        return;
      }

      // 2. Detectar por ancho de pantalla
      const isMobileWidth = window.innerWidth < 768;

      if (isMobileWidth) {
        setMode('mobile-web');
      } else {
        setMode('desktop');
      }
    };

    // Detectar al cargar
    detectMode();

    // Escuchar cambios de tamaño de ventana
    const handleResize = () => detectMode();
    window.addEventListener('resize', handleResize);

    // Escuchar cambios en display-mode (por si instala la PWA)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = () => detectMode();
    mediaQuery.addEventListener('change', handleDisplayChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleDisplayChange);
    };
  }, []);

  return mode;
}

/**
 * Hook auxiliar para condicionales simples
 */
export function useIsMobile() {
  const mode = useDeviceMode();
  return mode === 'mobile-pwa' || mode === 'mobile-web';
}

export function useIsDesktop() {
  const mode = useDeviceMode();
  return mode === 'desktop';
}

export function useIsPWA() {
  const mode = useDeviceMode();
  return mode === 'mobile-pwa';
}
