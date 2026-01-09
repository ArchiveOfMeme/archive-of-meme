'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CommentSection from './community/CommentSection';

export default function MemeDetail({ memeId }) {
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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 text-[#666] hover:text-white transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-white font-semibold truncate flex-1">{meme.name}</h1>
          <button
            onClick={handleShare}
            className="p-2 text-[#71767b] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-full transition-colors"
            aria-label="Share on X"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto">
        {/* Image */}
        <div>
          <img
            src={meme.image}
            alt={meme.name}
            className="w-full h-auto max-h-[70vh] object-contain mx-auto"
          />
        </div>

        {/* Info */}
        {meme.description && (
          <div className="p-4 border-b border-[#1a1a1a]">
            <p className="text-[#a0a0a0] text-sm whitespace-pre-line">
              {meme.description}
            </p>
          </div>
        )}

        {/* Comments - CommentSection handles Pass gating internally */}
        <div className="p-4">
          <CommentSection memeId={memeId} />
        </div>
      </main>
    </div>
  );
}
