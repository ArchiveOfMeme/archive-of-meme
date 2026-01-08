'use client';

import { useState, useEffect } from 'react';
import MemeCard from './MemeCard';

export default function Feed() {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState(null);

  useEffect(() => {
    async function fetchMemes() {
      try {
        setLoading(true);

        // Llamar a nuestra API route (server-side, sin CORS)
        const response = await fetch('/api/memes');
        const data = await response.json();

        setMemes(data.memes || []);
        setSource(data.source);
      } catch (err) {
        console.error('Error loading memes:', err);
        setMemes([]);
        setSource('error');
      } finally {
        setLoading(false);
      }
    }

    fetchMemes();
  }, []);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-2 border-[#a5b4fc] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#666]">Loading memes...</p>
        </div>
      </div>
    );
  }

  if (memes.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <div className="text-center">
          <p className="text-[#666] text-lg mb-2">No memes yet</p>
          <p className="text-[#444] text-sm">The archive is waiting for its first meme...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {memes.map((meme) => (
        <MemeCard key={meme.id} meme={meme} />
      ))}
    </div>
  );
}
