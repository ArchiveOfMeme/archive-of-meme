'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useDeviceMode } from '@/hooks/useDeviceMode';
import CommentSection from './community/CommentSection';
import DesktopLayout from './desktop/DesktopLayout';
import TrendingSidebar from './desktop/TrendingSidebar';

export default function MemeDetail({ memeId }) {
  const mode = useDeviceMode();
  const isDesktop = mode === 'desktop';
  const [meme, setMeme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMeme = async () => {
      try {
        const res = await fetch(`/api/memes/${memeId}`);
        const data = await res.json();

        if (data.error) {
          setError(data.error);
        } else {
          setMeme(data.meme);
        }
      } catch (err) {
        setError('Error loading meme');
      }
      setLoading(false);
    };

    fetchMeme();
  }, [memeId]);

  const handleShare = () => {
    const siteUrl = typeof window !== 'undefined'
      ? window.location.href
      : `https://archiveofmeme.fun/meme/${memeId}`;
    const text = `${meme.name}\n\n📚 @Arch_AoM\n#memes #NFT`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(siteUrl)}`,
      '_blank'
    );
  };

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#a5b4fc] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !meme) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <p className="text-[#666]">{error || 'Meme not found'}</p>
        <Link href="/" className="text-[#a5b4fc] hover:underline">
          Back to Archive
        </Link>
      </div>
    );
  }

  // Formatear fecha
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  const formattedDate = formatDate(meme.date);

  // Contenido móvil del meme
  const mobileContent = (
    <>
      {/* Image - full width en móvil */}
      <div className="w-full">
        <Image
          src={meme.image}
          alt={meme.name}
          width={600}
          height={600}
          sizes="100vw"
          className="w-full h-auto"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PC9zdmc+"
          priority
        />
      </div>

      {/* Info */}
      {meme.description && (
        <div className="p-4 border-b border-[var(--bg-elevated)]">
          <p className="text-[var(--text-secondary)] text-sm whitespace-pre-line">
            {meme.description}
          </p>
        </div>
      )}

      {/* Comments */}
      <div className="p-4">
        <CommentSection memeId={memeId} />
      </div>
    </>
  );

  // Desktop layout - Header 2 columnas + Comments full width
  if (isDesktop) {
    return (
      <DesktopLayout sidebar={<TrendingSidebar />}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/" className="text-[var(--text-muted)] hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-white truncate">{meme.name}</span>
        </div>

        {/* Header: Imagen + Info lado a lado */}
        <div className="grid grid-cols-[320px_1fr] gap-6 mb-6">
          {/* Imagen */}
          <div className="rounded-xl overflow-hidden bg-[var(--bg-card)]">
            <Image
              src={meme.image}
              alt={meme.name}
              width={320}
              height={320}
              sizes="320px"
              className="w-full h-auto"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PC9zdmc+"
              priority
            />
          </div>

          {/* Info panel */}
          <div className="bg-[var(--bg-card)] rounded-xl p-6 flex flex-col">
            <div className="flex-1">
              <h1 className="text-white text-2xl font-bold mb-3">{meme.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 bg-[var(--bg-elevated)] text-[var(--accent-primary)] text-xs font-bold rounded-md">
                  #{meme.id}
                </span>
                {formattedDate && (
                  <span className="flex items-center gap-1 text-[var(--text-muted)] text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formattedDate}
                  </span>
                )}
              </div>

              {/* Descripción */}
              {meme.description && (
                <p className="text-[var(--text-secondary)] text-sm whitespace-pre-line leading-relaxed">
                  {meme.description}
                </p>
              )}
            </div>

            {/* Acciones - al fondo */}
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[var(--bg-elevated)]">
              <a
                href={meme.opensea_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-blue)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--accent-blue)]/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.629 0 12 0ZM5.92 12.403l.051-.081 3.123-4.884a.107.107 0 0 1 .187.014c.52 1.169.972 2.623.76 3.528-.088.372-.335.876-.614 1.342a2.405 2.405 0 0 1-.117.199.106.106 0 0 1-.09.045H6.013a.106.106 0 0 1-.091-.163zm13.914 1.68a.109.109 0 0 1-.065.101c-.243.103-1.07.485-1.414.962-.878 1.222-1.548 2.97-3.048 2.97H9.053a4.019 4.019 0 0 1-4.013-4.028v-.072c0-.058.048-.106.108-.106h3.485c.07 0 .12.063.115.132-.026.226.017.459.125.67.206.42.636.682 1.099.682h1.726v-1.347H9.99a.11.11 0 0 1-.089-.173l.063-.09c.16-.231.391-.586.621-.992.156-.274.308-.566.43-.86.024-.052.043-.107.065-.16.033-.094.067-.182.091-.269a4.57 4.57 0 0 0 .065-.223c.057-.25.081-.514.081-.787 0-.108-.004-.221-.014-.327-.005-.117-.02-.235-.034-.352a3.415 3.415 0 0 0-.048-.312 6.494 6.494 0 0 0-.098-.468l-.014-.06c-.03-.108-.056-.21-.09-.317a11.824 11.824 0 0 0-.328-.972 5.212 5.212 0 0 0-.142-.355c-.072-.178-.146-.339-.213-.49a3.564 3.564 0 0 1-.094-.197 4.658 4.658 0 0 0-.103-.213c-.024-.053-.053-.104-.072-.152l-.211-.388c-.029-.053.019-.118.077-.101l1.32.357h.01l.173.05.192.054.07.019v-.783c0-.379.302-.686.679-.686a.66.66 0 0 1 .477.202.69.69 0 0 1 .2.484V6.65l.141.039c.01.005.022.01.031.017.034.024.084.062.147.11.05.038.103.086.165.137a10.351 10.351 0 0 1 .574.504c.214.199.454.432.684.691.065.074.127.146.192.226.062.079.132.156.19.232.079.104.16.212.235.324.033.053.074.108.105.161.096.142.178.288.257.435.034.067.067.141.096.213.089.197.159.396.202.598a.65.65 0 0 1 .029.132v.01c.014.057.019.12.024.184a2.057 2.057 0 0 1-.106.874c-.031.084-.06.17-.098.254-.075.17-.161.343-.264.502-.034.06-.075.122-.113.182-.043.063-.089.123-.127.18a3.89 3.89 0 0 1-.173.221c-.053.072-.106.144-.166.209-.081.098-.16.19-.245.278-.048.058-.1.118-.156.17-.052.06-.108.113-.156.161-.084.084-.15.147-.208.202l-.137.122a.102.102 0 0 1-.072.03h-1.051v1.346h1.322c.295 0 .576-.104.804-.298.077-.067.415-.36.816-.802a.094.094 0 0 1 .05-.03l3.65-1.057a.108.108 0 0 1 .138.103z" />
                </svg>
                Collect on OpenSea
              </a>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm font-medium rounded-lg hover:text-white hover:bg-[var(--bg-elevated)]/80 transition-colors"
                aria-label="Share on X"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Sección de comentarios - ancho completo */}
        <div className="bg-[var(--bg-card)] rounded-xl p-6">
          <CommentSection memeId={memeId} />
        </div>
      </DesktopLayout>
    );
  }

  // Mobile layout
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--bg-elevated)]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 text-[var(--text-muted)] hover:text-white transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-white font-semibold truncate flex-1">{meme.name}</h1>
          <button
            onClick={handleShare}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 rounded-full transition-colors"
            aria-label="Share on X"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto pb-20">
        {mobileContent}
      </main>
    </div>
  );
}
