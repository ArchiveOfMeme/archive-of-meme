'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileCard from './MobileCard';
import { generateMemeSlug } from '@/utils/slug';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'a-z', label: 'A - Z' },
  { value: 'z-a', label: 'Z - A' },
  { value: 'most-discussed', label: 'Most Discussed' },
];

export default function MobileSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [memes, setMemes] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Sync with URL params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Fetch memes
  useEffect(() => {
    const fetchMemes = async () => {
      try {
        const res = await fetch('/api/memes?limit=100');
        const data = await res.json();
        setMemes(data.memes || []);
      } catch (error) {
        console.error('Error fetching memes:', error);
      }
      setLoading(false);
    };
    fetchMemes();
  }, []);

  // Fetch comment counts
  useEffect(() => {
    const fetchCommentCounts = async () => {
      if (memes.length === 0) return;

      const counts = {};
      await Promise.all(
        memes.map(async (meme) => {
          try {
            const res = await fetch(`/api/comments?meme_id=${meme.id}`);
            const data = await res.json();
            counts[meme.id] = data.total || 0;
          } catch {
            counts[meme.id] = 0;
          }
        })
      );
      setCommentCounts(counts);
    };
    fetchCommentCounts();
  }, [memes]);

  // Filter and sort
  const filteredAndSortedMemes = useMemo(() => {
    let result = [...memes];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (meme) =>
          meme.name?.toLowerCase().includes(query) ||
          meme.description?.toLowerCase().includes(query)
      );
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => Number(b.id) - Number(a.id));
        break;
      case 'oldest':
        result.sort((a, b) => Number(a.id) - Number(b.id));
        break;
      case 'a-z':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'z-a':
        result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'most-discussed':
        result.sort((a, b) => (commentCounts[b.id] || 0) - (commentCounts[a.id] || 0));
        break;
    }

    return result;
  }, [memes, searchQuery, sortBy, commentCounts]);

  // Surprise me
  const handleSurpriseMe = () => {
    if (memes.length === 0) return;
    const randomMeme = memes[Math.floor(Math.random() * memes.length)];
    const slug = generateMemeSlug(randomMeme.name, randomMeme.id);
    router.push(`/meme/${slug}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-12 bg-[var(--bg-card)] rounded-lg animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-[var(--bg-card)] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Sticky Search Header */}
      <div className="sticky top-0 z-40 bg-[var(--bg-primary)] border-b border-[var(--bg-elevated)]">
        <div className="p-4 space-y-3">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search memes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-10 bg-[var(--bg-card)] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 w-11 flex items-center justify-center rounded-lg transition-colors ${
                showFilters ? 'bg-[var(--accent-primary)] text-black' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    sortBy === option.value
                      ? 'bg-[var(--accent-primary)] text-black'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* Surprise Me Button */}
          <button
            onClick={handleSurpriseMe}
            className="w-full h-11 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-black font-semibold rounded-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Surprise me!
          </button>
        </div>

        {/* Results Count */}
        <div className="px-4 py-2 text-sm text-[var(--text-muted)] border-t border-[var(--bg-elevated)]">
          {searchQuery ? (
            <span>{filteredAndSortedMemes.length} results for "{searchQuery}"</span>
          ) : (
            <span>{filteredAndSortedMemes.length} memes</span>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredAndSortedMemes.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-white font-semibold mb-2">No memes found</h3>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            Try a different search term
          </p>
          <button
            onClick={handleClearSearch}
            className="px-4 py-2 bg-[var(--bg-card)] text-white text-sm rounded-lg"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div>
          {filteredAndSortedMemes.map((meme) => (
            <MobileCard key={`search-${meme.id}`} meme={meme} />
          ))}
        </div>
      )}
    </div>
  );
}
