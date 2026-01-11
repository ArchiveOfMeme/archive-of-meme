'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { generateMemeSlug } from '@/utils/slug';

/**
 * HeaderSearch - Barra de búsqueda con dropdown de resultados en tiempo real
 */
export default function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allMemes, setAllMemes] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Cargar todos los memes una vez al montar
  useEffect(() => {
    const fetchMemes = async () => {
      try {
        const res = await fetch('/api/memes?limit=100');
        const data = await res.json();
        setAllMemes(data.memes || []);
      } catch (error) {
        console.error('Error fetching memes:', error);
      }
    };
    fetchMemes();
  }, []);

  // Filtrar memes cuando cambia el query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    const searchQuery = query.toLowerCase();

    const filtered = allMemes
      .filter(meme =>
        meme.name?.toLowerCase().includes(searchQuery) ||
        meme.description?.toLowerCase().includes(searchQuery)
      )
      .slice(0, 5); // Máximo 5 resultados

    setResults(filtered);
    setIsOpen(true);
    setSelectedIndex(-1);
    setLoading(false);
  }, [query, allMemes]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navegar a un meme
  const navigateToMeme = useCallback((meme) => {
    const slug = generateMemeSlug(meme.name, meme.id);
    router.push(`/meme/${slug}`);
    setQuery('');
    setIsOpen(false);
  }, [router]);

  // Navegar a explore con búsqueda
  const navigateToExplore = useCallback(() => {
    if (query.trim()) {
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setIsOpen(false);
    }
  }, [query, router]);

  // Manejar teclas
  const handleKeyDown = (e) => {
    if (!isOpen && e.key !== 'Enter') return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          navigateToMeme(results[selectedIndex]);
        } else {
          navigateToExplore();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={containerRef} className="flex-1 max-w-xl relative">
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search memes..."
          className="w-full h-10 pl-10 pr-4 bg-[var(--bg-card)] border border-[var(--bg-elevated)] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        {/* Clear button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--bg-elevated)] rounded-lg shadow-xl overflow-hidden z-50">
          {loading ? (
            <div className="p-4 text-center text-[var(--text-muted)]">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <>
              {/* Results */}
              <ul className="py-2">
                {results.map((meme, index) => (
                  <li key={`search-${meme.id}`}>
                    <button
                      onClick={() => navigateToMeme(meme)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-[var(--bg-elevated)]'
                          : 'hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <Image
                        src={meme.image}
                        alt={meme.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {meme.name}
                        </p>
                        <p className="text-[var(--text-muted)] text-xs truncate">
                          #{meme.id}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {/* View all link */}
              <div className="border-t border-[var(--bg-elevated)] p-2">
                <button
                  onClick={navigateToExplore}
                  className="w-full px-4 py-2 text-sm text-[var(--accent-primary)] hover:bg-[var(--bg-elevated)] rounded transition-colors text-center"
                >
                  View all results for "{query}"
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 text-center">
              <p className="text-[var(--text-muted)] text-sm">No memes found</p>
              <button
                onClick={navigateToExplore}
                className="mt-2 text-sm text-[var(--accent-primary)] hover:text-white transition-colors"
              >
                Search in Explore
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
