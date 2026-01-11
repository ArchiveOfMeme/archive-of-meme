'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import WalletButton from '@/components/shared/WalletButton';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useTheme } from '@/hooks/useTheme';

/**
 * MobileLayout - Layout para PWA y navegadores móviles
 *
 * Estructura:
 * - Mini header (44px) con logo y wallet
 * - Contenido principal (scroll)
 * - Bottom tab bar (56px) con navegación
 */
export default function MobileLayout({ children, activeTab }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Mini Header */}
      <MobileHeader />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-[var(--tab-bar-height)]">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab={activeTab} />
    </div>
  );
}

function MobileHeader() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="p-3 pb-2">
      <header
        className="z-50 transition-all duration-300"
        style={{
          height: 'var(--header-height-mobile)',
          backgroundColor: isLight ? 'var(--color-white)' : 'var(--header-bg)',
          border: isLight ? '3px solid var(--border-sketch)' : '1px solid var(--bg-elevated)',
          borderRadius: isLight ? '5px 12px 8px 15px' : '10px',
          boxShadow: isLight ? 'var(--shadow-sketch)' : 'none',
          transform: isLight ? 'rotate(-0.3deg)' : 'none',
        }}
      >
        <div className="h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo/Logo.png"
            alt="Archive of Meme"
            width={28}
            height={28}
            className="rounded"
            style={{ filter: isLight ? 'drop-shadow(1px 1px 0 var(--color-ink))' : 'none' }}
          />
          <span
            className="whitespace-nowrap"
            style={{
              fontFamily: 'var(--font-heading), "Permanent Marker", cursive',
              fontSize: '1rem',
              color: 'var(--color-ink)',
              textShadow: isLight ? '1px 1px 0px var(--color-paper-dark)' : 'none',
              transform: isLight ? 'rotate(-1deg)' : 'none',
            }}
          >
            Archive
          </span>
        </Link>

        {/* Right side: Theme + Notifications + Wallet */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: isLight ? '1px solid var(--border-sketch)' : '1px solid var(--bg-elevated)',
            }}
            aria-label={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
          >
            {theme === 'light' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
          <NotificationBell />
          <WalletButton variant="compact" />
        </div>
        </div>
      </header>
    </div>
  );
}

function BottomTabBar({ activeTab }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const tabs = [
    { id: 'home', href: '/', icon: '🏠', label: 'Home' },
    { id: 'mine', href: '/mine', icon: '⛏️', label: 'Mine' },
    { id: 'shop', href: '/shop', icon: '🛒', label: 'Shop' },
    { id: 'dashboard', href: '/dashboard', icon: '📊', label: 'Stats' },
  ];

  // Determinar tab activo por pathname si no se especifica
  const currentTab = activeTab || tabs.find(t => t.href === pathname)?.id || 'home';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        height: 'var(--tab-bar-height)',
        backgroundColor: isLight ? 'var(--color-white)' : 'var(--header-bg)',
        borderTop: isLight ? '3px solid var(--border-sketch)' : '1px solid var(--bg-elevated)',
        boxShadow: isLight ? '0 -2px 0px var(--color-ink)' : 'none',
      }}
    >
      {/* Safe area para dispositivos con notch */}
      <div className="h-full flex items-center justify-around px-4 pb-safe">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-colors"
              style={{
                color: isActive
                  ? (isLight ? 'var(--color-accent)' : 'var(--accent-primary)')
                  : (isLight ? 'var(--color-ink-light)' : 'var(--text-muted)'),
              }}
            >
              <span className="text-xl">{tab.icon}</span>
              <span
                className="text-[10px] font-medium"
                style={{ fontFamily: isLight ? 'var(--font-sketch), cursive' : 'inherit' }}
              >
                {tab.label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ backgroundColor: isLight ? 'var(--color-accent)' : 'var(--accent-primary)' }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
