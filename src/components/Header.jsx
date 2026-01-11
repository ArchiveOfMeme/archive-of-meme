'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useTheme } from '@/hooks/useTheme';
import InstallModal from './InstallModal';

export default function Header() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { isInstallable, isIOS, install } = usePWAInstall();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate gradient colors from address for avatar
  const getAvatarGradient = (addr) => {
    if (!addr) return ['#a5b4fc', '#818cf8'];
    const hash = addr.slice(2, 10);
    const hue1 = parseInt(hash.slice(0, 4), 16) % 360;
    const hue2 = (hue1 + 40) % 360;
    return [`hsl(${hue1}, 70%, 60%)`, `hsl(${hue2}, 70%, 50%)`];
  };

  const avatarColors = getAvatarGradient(address);

  useEffect(() => {
    // Check if desktop (768px+)
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    // Only hide on scroll for desktop
    if (!isDesktop) {
      setVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isDesktop]);

  const handleInstallClick = () => {
    setShowModal(true);
  };

  const handleInstallConfirm = async () => {
    setShowModal(false);
    await install();
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-transform duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ backgroundColor: 'var(--header-bg)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Image
                src="/images/logo/Logo.png"
                alt="Arch - Archive of Meme mascot"
                width={36}
                height={36}
                className="rounded"
              />
              <span
                className="text-base tracking-wider uppercase transition-colors duration-300 hidden sm:inline"
                style={{
                  fontFamily: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
                  color: 'var(--accent-primary)',
                }}
              >
                ARCHIVE OF MEME
              </span>
            </Link>

            <nav className="flex items-center gap-2 flex-shrink-0">
              {isConnected ? (
                <div className="relative">
                  <button
                    onClick={() => setShowWalletMenu(!showWalletMenu)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderWidth: '1px',
                      borderColor: 'var(--border)',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${avatarColors[0]}, ${avatarColors[1]})`,
                      }}
                    />
                    <span className="text-xs font-medium hidden sm:inline" style={{ color: 'var(--text-primary)' }}>
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                    <svg
                      className={`w-3 h-3 transition-transform ${showWalletMenu ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--text-muted)' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Wallet Menu Dropdown */}
                  {showWalletMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowWalletMenu(false)}
                      />
                      <div
                        className="absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderWidth: '1px',
                          borderColor: 'var(--border)',
                        }}
                      >
                        {/* Header with avatar */}
                        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full"
                              style={{
                                background: `linear-gradient(135deg, ${avatarColors[0]}, ${avatarColors[1]})`,
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                              </p>
                              {balance && (
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-2">
                          {/* Copy Address */}
                          <button
                            onClick={copyAddress}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {copied ? (
                              <svg className="w-4 h-4" style={{ color: 'var(--accent-green)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                            <span>{copied ? 'Copied!' : 'Copy Address'}</span>
                          </button>

                          {/* View on Explorer */}
                          <a
                            href={`https://basescan.org/address/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            onClick={() => setShowWalletMenu(false)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span>View on Explorer</span>
                          </a>

                          {/* Divider */}
                          <div className="my-2" style={{ borderTop: '1px solid var(--border)' }} />

                          {/* Disconnect */}
                          <button
                            onClick={() => {
                              disconnect();
                              setShowWalletMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors"
                            style={{ color: 'var(--accent-red)' }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Disconnect</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: theme === 'dark' ? 'black' : 'white',
                      }}
                    >
                      Connect
                    </button>
                  )}
                </ConnectButton.Custom>
              )}
              {isInstallable && (
                <button
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 text-xs font-medium border rounded-full transition-all duration-200"
                  style={{
                    color: 'var(--accent-primary)',
                    borderColor: 'color-mix(in srgb, var(--accent-primary) 30%, transparent)',
                  }}
                >
                  Install
                </button>
              )}
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full transition-all duration-200 hover:scale-110"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
                aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {theme === 'light' ? (
                  // Moon icon for light mode (click to go dark)
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  // Sun icon for dark mode (click to go light)
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
              <a
                href="https://opensea.io/collection/archive-of-meme-arch"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-200"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="OpenSea"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.629 0 12 0ZM5.92 12.403l.051-.081 3.123-4.884a.107.107 0 0 1 .187.014c.52 1.169.972 2.623.76 3.528-.088.372-.335.876-.614 1.342a2.405 2.405 0 0 1-.117.199.106.106 0 0 1-.09.045H6.013a.106.106 0 0 1-.091-.163zm13.914 1.68a.109.109 0 0 1-.065.101c-.243.103-1.07.485-1.414.962-.878 1.222-1.548 2.97-3.048 2.97H9.053a4.019 4.019 0 0 1-4.013-4.028v-.072c0-.058.048-.106.108-.106h3.485c.07 0 .12.063.115.132-.026.226.017.459.125.67.206.42.636.682 1.099.682h1.726v-1.347H9.99a.11.11 0 0 1-.089-.173l.063-.09c.16-.231.391-.586.621-.992.156-.274.308-.566.43-.86.024-.052.043-.107.065-.16.033-.094.067-.182.091-.269a4.57 4.57 0 0 0 .065-.223c.057-.25.081-.514.081-.787 0-.108-.004-.221-.014-.327-.005-.117-.02-.235-.034-.352a3.415 3.415 0 0 0-.048-.312 6.494 6.494 0 0 0-.098-.468l-.014-.06c-.03-.108-.056-.21-.09-.317a11.824 11.824 0 0 0-.328-.972 5.212 5.212 0 0 0-.142-.355c-.072-.178-.146-.339-.213-.49a3.564 3.564 0 0 1-.094-.197 4.658 4.658 0 0 0-.103-.213c-.024-.053-.053-.104-.072-.152l-.211-.388c-.029-.053.019-.118.077-.101l1.32.357h.01l.173.05.192.054.07.019v-.783c0-.379.302-.686.679-.686a.66.66 0 0 1 .477.202.69.69 0 0 1 .2.484V6.65l.141.039c.01.005.022.01.031.017.034.024.084.062.147.11.05.038.103.086.165.137a10.351 10.351 0 0 1 .574.504c.214.199.454.432.684.691.065.074.127.146.192.226.062.079.132.156.19.232.079.104.16.212.235.324.033.053.074.108.105.161.096.142.178.288.257.435.034.067.067.141.096.213.089.197.159.396.202.598a.65.65 0 0 1 .029.132v.01c.014.057.019.12.024.184a2.057 2.057 0 0 1-.106.874c-.031.084-.06.17-.098.254-.075.17-.161.343-.264.502-.034.06-.075.122-.113.182-.043.063-.089.123-.127.18a3.89 3.89 0 0 1-.173.221c-.053.072-.106.144-.166.209-.081.098-.16.19-.245.278-.048.058-.1.118-.156.17-.052.06-.108.113-.156.161-.084.084-.15.147-.208.202l-.137.122a.102.102 0 0 1-.072.03h-1.051v1.346h1.322c.295 0 .576-.104.804-.298.077-.067.415-.36.816-.802a.094.094 0 0 1 .05-.03l3.65-1.057a.108.108 0 0 1 .138.103z" />
                </svg>
              </a>
            </nav>
          </div>
        </div>
      </header>

      <InstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onInstall={handleInstallConfirm}
        isIOS={isIOS}
      />
    </>
  );
}
