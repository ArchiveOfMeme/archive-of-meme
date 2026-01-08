'use client';

import { useState } from 'react';

export default function MemeCard({ meme }) {
  const [expanded, setExpanded] = useState(false);

  const handleTwitterShare = () => {
    const text = `${meme.name} - from the Archive of Meme collection\n\nOwn a piece of internet history:`;
    const url = meme.opensea_url;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  return (
    <article className="bg-[#111] rounded-2xl overflow-hidden border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
      {/* Header */}
      <div className="p-4">
        <span className="text-white font-semibold text-lg">{meme.name}</span>
      </div>

      {/* Image */}
      <div className="w-full bg-[#0a0a0a] flex justify-center">
        <img
          src={meme.image}
          alt={meme.name}
          className="w-full h-auto max-h-[70vh] object-contain"
        />
      </div>

      {/* Description - truncated with expand */}
      {meme.description && (
        <div className="px-4 pt-3 pb-2">
          <p
            className={`text-[#a0a0a0] text-sm whitespace-pre-line ${
              !expanded ? 'line-clamp-2' : ''
            }`}
          >
            {meme.description}
          </p>
          {meme.description.length > 100 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[#a5b4fc] text-sm mt-1 hover:underline"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 pt-2">
        <div className="flex items-center justify-between">
          <button
            onClick={handleTwitterShare}
            className="text-[#666] hover:text-white transition-colors"
            aria-label="Share on X"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>

          <a
            href={meme.opensea_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 bg-[#00ff88] text-black font-bold text-sm rounded-full hover:bg-[#00cc6a] transition-colors"
          >
            BUY
          </a>
        </div>
      </div>
    </article>
  );
}
