'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import MobileCard from './MobileCard';

/**
 * MobileFeed - Feed de memes con scroll infinito
 *
 * Características:
 * - Carga inicial de memes
 * - Scroll infinito
 * - Pull-to-refresh (preparado)
 * - Loading states
 */
export default function MobileFeed() {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observerRef = useRef(null);

  const ITEMS_PER_PAGE = 10;

  // Cargar memes
  const loadMemes = useCallback(async (pageNum, append = false) => {
    try {
      const res = await fetch(`/api/memes?page=${pageNum}&limit=${ITEMS_PER_PAGE}`);
      const data = await res.json();

      if (data.memes) {
        if (append) {
          setMemes(prev => [...prev, ...data.memes]);
        } else {
          setMemes(data.memes);
        }
        // Use API's hasMore flag instead of comparing length
        setHasMore(data.hasMore === true);
      }
    } catch (err) {
      console.error('Error loading memes:', err);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadMemes(1);
      setLoading(false);
    };
    init();
  }, [loadMemes]);

  // Cargar más al hacer scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    await loadMemes(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  }, [page, loadingMore, hasMore, loadMemes]);

  // Intersection Observer para scroll infinito
  const lastMemeRef = useCallback((node) => {
    if (loading || loadingMore) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, {
      rootMargin: '200px', // Cargar antes de llegar al final
    });

    if (node) {
      observerRef.current.observe(node);
    }
  }, [loading, loadingMore, hasMore, loadMore]);

  // Loading inicial
  if (loading) {
    return (
      <div className="flex flex-col">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Sin memes
  if (memes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <span className="text-5xl mb-4">🏛️</span>
        <h2 className="text-white text-xl font-semibold mb-2">No memes yet</h2>
        <p className="text-[var(--text-muted)]">
          Check back soon for the first meme of the day!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {memes.map((meme, index) => {
        const isLast = index === memes.length - 1;
        return (
          <div
            key={`mobile-${meme.id}`}
            ref={isLast ? lastMemeRef : null}
          >
            <MobileCard meme={meme} />
          </div>
        );
      })}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="py-8 flex justify-center">
          <span className="w-6 h-6 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
        </div>
      )}

      {/* End of feed */}
      {!hasMore && memes.length > 0 && (
        <div className="py-8 text-center text-[var(--text-muted)] text-sm">
          You've seen all the memes!
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border-b border-[var(--bg-elevated)] animate-pulse">
      {/* Header */}
      <div className="px-4 py-3">
        <div className="h-5 w-32 bg-[var(--bg-card)] rounded" />
        <div className="h-3 w-20 bg-[var(--bg-card)] rounded mt-2" />
      </div>
      {/* Image */}
      <div className="w-full aspect-square bg-[var(--bg-card)]" />
      {/* Actions */}
      <div className="px-4 py-3 flex justify-between">
        <div className="flex gap-2">
          <div className="h-10 w-16 bg-[var(--bg-card)] rounded-full" />
          <div className="h-10 w-10 bg-[var(--bg-card)] rounded-full" />
        </div>
        <div className="h-10 w-24 bg-[var(--bg-card)] rounded-full" />
      </div>
    </div>
  );
}
