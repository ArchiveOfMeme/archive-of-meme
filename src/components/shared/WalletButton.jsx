'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { useTheme } from '@/hooks/useTheme';

/**
 * WalletButton - Botón de conexión de wallet reutilizable
 *
 * @param {Object} props
 * @param {'compact' | 'full'} props.variant - compact para móvil, full para desktop
 */
export default function WalletButton({ variant = 'compact' }) {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Para usar Portal necesitamos estar en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generar colores de avatar desde la dirección
  const getAvatarGradient = (addr) => {
    if (!addr) return ['#a5b4fc', '#818cf8'];
    const hash = addr.slice(2, 10);
    const hue1 = parseInt(hash.slice(0, 4), 16) % 360;
    const hue2 = (hue1 + 40) % 360;
    return [`hsl(${hue1}, 70%, 60%)`, `hsl(${hue2}, 70%, 50%)`];
  };

  const avatarColors = getAvatarGradient(address);

  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button
            onClick={openConnectModal}
            className={`font-medium transition-all flex items-center justify-center ${
              variant === 'compact'
                ? 'p-1.5'
                : 'px-4 py-2 text-sm'
            }`}
            style={isLight ? {
              backgroundColor: 'var(--color-gold)',
              color: 'var(--color-ink)',
              border: variant === 'compact' ? '1px solid var(--border-sketch)' : '2px solid var(--border-sketch)',
              borderRadius: variant === 'compact' ? '8px' : '5px 12px 8px 15px',
              boxShadow: variant === 'compact' ? 'none' : '2px 2px 0px var(--color-ink)',
              fontFamily: 'var(--font-sketch), "Kalam", cursive',
            } : {
              backgroundColor: 'var(--accent-primary)',
              color: 'black',
              borderRadius: '9999px',
            }}
          >
            {variant === 'compact' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            ) : 'Connect Wallet'}
          </button>
        )}
      </ConnectButton.Custom>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 transition-all ${
          variant === 'compact'
            ? 'p-1.5'
            : 'px-3 py-1.5'
        }`}
        style={isLight ? {
          backgroundColor: 'var(--color-white)',
          border: variant === 'compact' ? '1px solid var(--border-sketch)' : '2px solid var(--border-sketch)',
          borderRadius: variant === 'compact' ? '8px' : '5px 12px 8px 15px',
          boxShadow: variant === 'compact' ? 'none' : '2px 2px 0px var(--color-ink)',
        } : {
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--bg-elevated)',
          borderRadius: '9999px',
        }}
      >
        {/* Avatar */}
        <div
          className={`rounded-full ${variant === 'compact' ? 'w-5 h-5' : 'w-7 h-7'}`}
          style={{
            background: `linear-gradient(135deg, ${avatarColors[0]}, ${avatarColors[1]})`,
            border: isLight && variant !== 'compact' ? '1px solid var(--color-ink)' : 'none',
          }}
        />
        {variant === 'full' && (
          <>
            <span
              className="text-xs font-medium"
              style={{
                color: isLight ? 'var(--color-ink)' : 'white',
                fontFamily: isLight ? 'var(--font-sketch), "Kalam", cursive' : 'inherit',
              }}
            >
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <svg
              className={`w-3 h-3 transition-transform ${showMenu ? 'rotate-180' : ''}`}
              style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown Menu - Portal para evitar problemas de z-index */}
      {showMenu && mounted && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowMenu(false)}
          />
          <div
            className="fixed w-64 bg-[var(--bg-card)] border border-[var(--bg-elevated)] rounded-2xl shadow-2xl z-[9999] overflow-hidden"
            style={{
              top: variant === 'compact' ? '60px' : '80px',
              right: '16px',
            }}
          >
            {/* Header con avatar */}
            <div className="p-4 border-b border-[var(--bg-elevated)]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${avatarColors[0]}, ${avatarColors[1]})`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                  {balance && (
                    <p className="text-[var(--text-muted)] text-xs">
                      {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="p-2">
              {/* Copiar dirección */}
              <button
                onClick={copyAddress}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] rounded-xl transition-colors"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-[var(--accent-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                <span>{copied ? 'Copied!' : 'Copy Address'}</span>
              </button>

              {/* Ver en Explorer */}
              <a
                href={`https://basescan.org/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] rounded-xl transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>View on Explorer</span>
              </a>

              <div className="my-2 border-t border-[var(--bg-elevated)]" />

              {/* Desconectar */}
              <button
                onClick={() => {
                  disconnect();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
