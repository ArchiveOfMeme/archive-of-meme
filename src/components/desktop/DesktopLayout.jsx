'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import WalletButton from '@/components/shared/WalletButton';
import HeaderSearch from './HeaderSearch';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useTheme } from '@/hooks/useTheme';

/**
 * DesktopLayout - Layout de 3 columnas para escritorio
 *
 * Estructura:
 * - Header completo (64px, fijo)
 * - Sidebar izquierdo (240px) - Navegación (fijo)
 * - Contenido principal (scroll independiente)
 * - Sidebar derecho (320px) - Trending (scroll independiente)
 */
export default function DesktopLayout({ children, sidebar = null }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header - fijo */}
      <DesktopHeader />

      {/* Main container - altura fija */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Navigation (fijo, no scroll) */}
        <Sidebar />

        {/* Main Content - scroll independiente */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-6 pb-16">
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          </div>
        </main>

        {/* Right Sidebar - scroll independiente */}
        {sidebar && (
          <aside
            className="hidden xl:block border-l border-[var(--bg-elevated)] overflow-y-auto"
            style={{ width: 'var(--trending-width)' }}
          >
            <div className="p-4 pb-16">
              {sidebar}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function DesktopHeader() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="p-5 pb-3">
      <header
        className="z-50 transition-all duration-300"
        style={{
          height: 'var(--header-height-desktop)',
          backgroundColor: isLight ? 'var(--color-white)' : 'var(--header-bg)',
          border: isLight ? '3px solid var(--border-sketch)' : '1px solid var(--bg-elevated)',
          borderRadius: isLight ? '5px 15px 10px 20px' : '12px',
          boxShadow: isLight ? 'var(--shadow-sketch)' : 'none',
          transform: isLight ? 'rotate(-0.5deg)' : 'none',
        }}
      >
        <div className="h-full px-6 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/images/logo/Logo.png"
            alt="Archive of Meme"
            width={40}
            height={40}
            className="rounded transition-transform duration-200 hover:rotate-[10deg]"
            style={{ filter: 'drop-shadow(2px 2px 0 var(--color-ink))' }}
          />
          <span
            className="hidden lg:block whitespace-nowrap"
            style={{
              fontFamily: 'var(--font-heading), "Permanent Marker", cursive',
              fontSize: '1.5rem',
              color: 'var(--color-ink)',
              textShadow: '2px 2px 0px var(--color-paper-dark)',
              transform: 'rotate(-2deg)',
            }}
          >
            Archive of Meme
          </span>
        </Link>

        {/* Search bar */}
        <HeaderSearch />

        {/* Right side - Links & Wallet */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-all duration-200 hover:scale-110"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '2px solid var(--border-sketch, transparent)',
            }}
            aria-label={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          {/* OpenSea link */}
          <a
            href="https://opensea.io/collection/archive-of-meme-arch"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="OpenSea"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.629 0 12 0ZM5.92 12.403l.051-.081 3.123-4.884a.107.107 0 0 1 .187.014c.52 1.169.972 2.623.76 3.528-.088.372-.335.876-.614 1.342a2.405 2.405 0 0 1-.117.199.106.106 0 0 1-.09.045H6.013a.106.106 0 0 1-.091-.163zm13.914 1.68a.109.109 0 0 1-.065.101c-.243.103-1.07.485-1.414.962-.878 1.222-1.548 2.97-3.048 2.97H9.053a4.019 4.019 0 0 1-4.013-4.028v-.072c0-.058.048-.106.108-.106h3.485c.07 0 .12.063.115.132-.026.226.017.459.125.67.206.42.636.682 1.099.682h1.726v-1.347H9.99a.11.11 0 0 1-.089-.173l.063-.09c.16-.231.391-.586.621-.992.156-.274.308-.566.43-.86.024-.052.043-.107.065-.16.033-.094.067-.182.091-.269a4.57 4.57 0 0 0 .065-.223c.057-.25.081-.514.081-.787 0-.108-.004-.221-.014-.327-.005-.117-.02-.235-.034-.352a3.415 3.415 0 0 0-.048-.312 6.494 6.494 0 0 0-.098-.468l-.014-.06c-.03-.108-.056-.21-.09-.317a11.824 11.824 0 0 0-.328-.972 5.212 5.212 0 0 0-.142-.355c-.072-.178-.146-.339-.213-.49a3.564 3.564 0 0 1-.094-.197 4.658 4.658 0 0 0-.103-.213c-.024-.053-.053-.104-.072-.152l-.211-.388c-.029-.053.019-.118.077-.101l1.32.357h.01l.173.05.192.054.07.019v-.783c0-.379.302-.686.679-.686a.66.66 0 0 1 .477.202.69.69 0 0 1 .2.484V6.65l.141.039c.01.005.022.01.031.017.034.024.084.062.147.11.05.038.103.086.165.137a10.351 10.351 0 0 1 .574.504c.214.199.454.432.684.691.065.074.127.146.192.226.062.079.132.156.19.232.079.104.16.212.235.324.033.053.074.108.105.161.096.142.178.288.257.435.034.067.067.141.096.213.089.197.159.396.202.598a.65.65 0 0 1 .029.132v.01c.014.057.019.12.024.184a2.057 2.057 0 0 1-.106.874c-.031.084-.06.17-.098.254-.075.17-.161.343-.264.502-.034.06-.075.122-.113.182-.043.063-.089.123-.127.18a3.89 3.89 0 0 1-.173.221c-.053.072-.106.144-.166.209-.081.098-.16.19-.245.278-.048.058-.1.118-.156.17-.052.06-.108.113-.156.161-.084.084-.15.147-.208.202l-.137.122a.102.102 0 0 1-.072.03h-1.051v1.346h1.322c.295 0 .576-.104.804-.298.077-.067.415-.36.816-.802a.094.094 0 0 1 .05-.03l3.65-1.057a.108.108 0 0 1 .138.103z" />
            </svg>
          </a>

          {/* Notifications */}
          <NotificationBell />

          {/* Wallet Button */}
          <WalletButton variant="full" />
        </div>
        </div>
      </header>
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/', icon: '🏠', label: 'Home' },
    { href: '/explore', icon: '🔍', label: 'Explore' },
    { href: '/mine', icon: '⛏️', label: 'Mining' },
    { href: '/shop', icon: '🛒', label: 'Shop' },
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
  ];

  return (
    <aside
      className="hidden lg:block border-r border-[var(--bg-elevated)] p-4"
      style={{ width: 'var(--sidebar-width)' }}
    >
      <nav className="sticky top-[calc(var(--header-height-desktop)+1rem)] space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-white'
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function DesktopFooter() {
  return (
    <footer className="border-t border-[var(--bg-elevated)] py-4">
      <div className="max-w-screen-2xl mx-auto px-6 flex items-center justify-between text-sm text-[var(--text-muted)]">
        <p>&copy; 2026 Archive of Meme</p>
        <div className="flex items-center gap-6">
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <a
            href="https://twitter.com/archiveofmeme"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Twitter
          </a>
          <a
            href="https://opensea.io/collection/archive-of-meme"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            OpenSea
          </a>
        </div>
      </div>
    </footer>
  );
}
