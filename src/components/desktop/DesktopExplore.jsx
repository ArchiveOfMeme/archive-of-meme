'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DesktopCard from './DesktopCard';
import { generateMemeSlug } from '@/utils/slug';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'a-z', label: 'A - Z' },
  { value: 'z-a', label: 'Z - A' },
  { value: 'most-discussed', label: 'Most Discussed' },
];

export default function DesktopExplore() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [memes, setMemes] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('newest');

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

  // Fetch comment counts for "Most Discussed" sort
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

  // Filter and sort memes
  const filteredAndSortedMemes = useMemo(() => {
    let result = [...memes];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (meme) =>
          meme.name?.toLowerCase().includes(query) ||
          meme.description?.toLowerCase().includes(query)
      );
    }

    // Sort
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

  // Surprise me - random meme
  const handleSurpriseMe = () => {
    if (memes.length === 0) return;
    const randomMeme = memes[Math.floor(Math.random() * memes.length)];
    const slug = generateMemeSlug(randomMeme.name, randomMeme.id);
    router.push(`/meme/${slug}`);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="h-12 bg-[var(--bg-card)] rounded-xl animate-pulse" />
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-[var(--bg-card)] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-white text-2xl font-bold mb-2">Explore</h1>
        <p className="text-[var(--text-muted)] text-sm">
          Discover the complete archive of iconic memes
        </p>
      </div>

      {/* Search and Controls */}
      <div className="bg-[var(--bg-card)] rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
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
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-10 bg-[var(--bg-elevated)] border border-transparent rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 pl-4 pr-10 bg-[var(--bg-elevated)] border border-transparent rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Surprise Me Button */}
          <button
            onClick={handleSurpriseMe}
            className="h-11 px-5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Surprise me
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-muted)]">
          {searchQuery ? (
            <>
              Showing <span className="text-white font-medium">{filteredAndSortedMemes.length}</span> results for "<span className="text-white">{searchQuery}</span>"
            </>
          ) : (
            <>
              Showing <span className="text-white font-medium">{filteredAndSortedMemes.length}</span> memes
            </>
          )}
        </span>
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="text-[var(--accent-primary)] hover:text-white transition-colors"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Memes Grid */}
      {filteredAndSortedMemes.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-white font-semibold mb-2">No memes found</h3>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            Try a different search term or clear the filters
          </p>
          <button
            onClick={handleClearSearch}
            className="px-4 py-2 bg-[var(--bg-elevated)] text-white text-sm rounded-lg hover:bg-[var(--bg-elevated)]/80 transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedMemes.map((meme) => (
            <DesktopCard key={`explore-${meme.id}`} meme={meme} />
          ))}
        </div>
      )}
    </div>
  );
}
