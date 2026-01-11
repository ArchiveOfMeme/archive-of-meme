'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from '@/hooks/useTheme';

/**
 * AvatarSelector - Modal para elegir avatar de NFT
 *
 * Se abre al hacer click en el avatar del perfil.
 * Muestra todos los NFTs que el usuario posee.
 */
export default function AvatarSelector({ wallet, currentAvatar, onSelect, onClose }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  // Fetch avatar options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch(`/api/avatar?wallet=${wallet}&refresh=false`);
        const data = await res.json();

        if (!data.error) {
          setOptions(data.options || []);
          // Set currently selected
          if (data.currentAvatar?.type !== 'default') {
            setSelected({
              contract: data.currentAvatar.contract,
              tokenId: data.currentAvatar.tokenId,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching avatar options:', err);
      }
      setLoading(false);
    };

    fetchOptions();
  }, [wallet]);

  // Handle selection
  const handleSelect = (option) => {
    if (option === 'default') {
      setSelected(null);
    } else {
      setSelected({
        contract: option.contract,
        tokenId: option.tokenId,
      });
    }
  };

  // Check if option is selected
  const isSelected = (option) => {
    if (option === 'default') {
      return selected === null;
    }
    return selected?.contract === option.contract && selected?.tokenId === option.tokenId;
  };

  // Save selection
  const handleSave = async () => {
    setSaving(true);

    try {
      const selectedOption = selected
        ? options.find(o => o.contract === selected.contract && o.tokenId === selected.tokenId)
        : null;

      const res = await fetch('/api/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          avatarType: selectedOption ? selectedOption.type : 'default',
          contract: selectedOption?.contract || null,
          tokenId: selectedOption?.tokenId || null,
          imageUrl: selectedOption?.imageUrl || null,
        }),
      });

      if (res.ok) {
        onSelect(selectedOption);
        onClose();
      }
    } catch (err) {
      console.error('Error saving avatar:', err);
    }

    setSaving(false);
  };

  // Refresh NFTs from OpenSea
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/avatar?wallet=${wallet}&refresh=true`);
      const data = await res.json();
      if (!data.error) {
        setOptions(data.options || []);
      }
    } catch (err) {
      console.error('Error refreshing:', err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[var(--bg-card)] rounded-t-3xl sm:rounded-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--bg-elevated)]">
          <h2 className="text-white font-bold text-lg">Choose Avatar</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square rounded-full bg-[var(--bg-elevated)] animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Default option */}
              <p className="text-[var(--text-muted)] text-xs mb-3 uppercase tracking-wide">Default</p>
              <div className="mb-4">
                <button
                  onClick={() => handleSelect('default')}
                  className={`w-20 h-20 rounded-full border-2 transition-all overflow-hidden ${
                    isSelected('default')
                      ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30'
                      : 'border-[var(--bg-elevated)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-br from-[var(--accent-primary)]/20 to-purple-500/20 flex items-center justify-center">
                    <Image
                      src="/images/logo/Logo.png"
                      alt="Default"
                      width={48}
                      height={48}
                      className="rounded"
                    />
                  </div>
                </button>
              </div>

              {/* NFT options */}
              {options.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">Your NFTs</p>
                    <button
                      onClick={handleRefresh}
                      className="text-[var(--accent-primary)] text-xs hover:underline"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {options.map((option) => (
                      <button
                        key={`${option.contract}-${option.tokenId}`}
                        onClick={() => handleSelect(option)}
                        className={`aspect-square rounded-full border-2 transition-all overflow-hidden ${
                          isSelected(option)
                            ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30'
                            : 'border-[var(--bg-elevated)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        {option.imageUrl ? (
                          <img
                            src={option.imageUrl}
                            alt={option.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center">
                            <span className="text-2xl">
                              {option.type === 'miner' ? '⛏️' : option.type === 'pass' ? '👑' : '🖼️'}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['miner', 'pass', 'meme'].map(type => {
                      const count = options.filter(o => o.type === type).length;
                      if (count === 0) return null;
                      return (
                        <span key={type} className="text-[var(--text-muted)] text-xs">
                          {type === 'miner' ? '⛏️' : type === 'pass' ? '👑' : '🖼️'} {count} {type}
                          {count > 1 ? 's' : ''}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}

              {options.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[var(--text-muted)] text-sm mb-2">
                    No NFTs found
                  </p>
                  <p className="text-[var(--text-muted)] text-xs">
                    Buy NFTs to use them as your avatar
                  </p>
                  <a
                    href="https://opensea.io/collection/archive-of-meme-miners"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 px-4 py-2 bg-[var(--accent-primary)] text-black text-sm font-bold rounded-full"
                  >
                    Browse NFTs
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--bg-elevated)]">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full py-3 bg-[var(--accent-primary)] text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Avatar - Componente de avatar reutilizable
 * Cuadrado con esquinas redondeadas para mostrar NFTs completos
 */
export function Avatar({ user, size = 'md', onClick, showBadge = true }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const radiusClasses = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
  };

  const badgeSizes = {
    sm: 'w-4 h-4 -bottom-1 -right-1',
    md: 'w-6 h-6 -bottom-1.5 -right-1.5',
    lg: 'w-8 h-8 -bottom-2 -right-2',
  };

  const hasNFT = user?.miner?.hasNFT || user?.nfts?.hasPass || user?.nfts?.memeCount > 0;
  const avatarUrl = user?.avatar?.imageUrl;
  const avatarType = user?.avatar?.type || 'default';

  // Level icons for fallback
  const levelIcons = {
    Bronze: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Platinum: '💎',
    Diamond: '💠',
    Legend: '👑',
  };

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={!onClick}
        className={`${sizeClasses[size]} ${radiusClasses[size]} overflow-hidden transition-all ${
          onClick ? 'cursor-pointer' : ''
        }`}
        style={{
          border: isLight ? '2px solid var(--border-sketch)' : '2px solid var(--bg-elevated)',
        }}
      >
        {avatarType !== 'default' && avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-contain"
            style={{ backgroundColor: isLight ? 'var(--color-paper-dark)' : 'var(--bg-card)' }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: isLight
                ? 'linear-gradient(135deg, #ffb300 0%, #ffd54f 100%)'
                : 'linear-gradient(to bottom right, rgba(165, 180, 252, 0.3), rgba(168, 85, 247, 0.3))',
            }}
          >
            <Image
              src="/images/logo/Logo.png"
              alt="Archive of Meme"
              width={size === 'sm' ? 24 : size === 'md' ? 40 : 56}
              height={size === 'sm' ? 24 : size === 'md' ? 40 : 56}
              className="rounded"
            />
          </div>
        )}
      </button>

      {/* Verified badge */}
      {showBadge && hasNFT && (
        <div
          className={`absolute ${badgeSizes[size]} rounded-full flex items-center justify-center shadow-lg`}
          style={{
            backgroundColor: isLight ? 'var(--color-accent)' : 'var(--accent-primary)',
          }}
        >
          <svg className="w-3/5 h-3/5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}
