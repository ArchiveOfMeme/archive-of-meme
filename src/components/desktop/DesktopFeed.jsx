'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import DesktopCard from './DesktopCard';

/**
 * DesktopFeed - Grid de memes para desktop
 *
 * Características:
 * - Grid responsive (2-3 columnas)
 * - Scroll infinito o paginación
 * - Skeleton loaders
 */
export default function DesktopFeed() {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observerRef = useRef(null);

  const ITEMS_PER_PAGE = 12;

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

  // Cargar más
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    await loadMemes(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  }, [page, loadingMore, hasMore, loadMemes]);

  // Intersection Observer
  const lastCardRef = useCallback((node) => {
    if (loading || loadingMore) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, {
      rootMargin: '400px',
    });

    if (node) {
      observerRef.current.observe(node);
    }
  }, [loading, loadingMore, hasMore, loadMore]);

  // Loading inicial
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Sin memes
  if (memes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-6xl mb-4">🏛️</span>
        <h2 className="text-white text-2xl font-bold mb-2">No memes yet</h2>
        <p className="text-[var(--text-muted)] max-w-md">
          The archive is empty. Check back soon for the first meme of the day!
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {memes.map((meme, index) => {
          const isLast = index === memes.length - 1;
          return (
            <div
              key={`feed-${meme.id}`}
              ref={isLast ? lastCardRef : null}
            >
              <DesktopCard meme={meme} />
            </div>
          );
        })}
      </div>

      {/* Loading more */}
      {loadingMore && (
        <div className="mt-8 flex justify-center">
          <span className="w-8 h-8 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
        </div>
      )}

      {/* End of feed */}
      {!hasMore && memes.length > 0 && (
        <div className="mt-8 text-center text-[var(--text-muted)]">
          <p>You've explored the entire archive!</p>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-[var(--bg-elevated)]" />
      <div className="p-4">
        <div className="h-5 w-3/4 bg-[var(--bg-elevated)] rounded" />
        <div className="h-4 w-1/2 bg-[var(--bg-elevated)] rounded mt-2" />
      </div>
    </div>
  );
}
