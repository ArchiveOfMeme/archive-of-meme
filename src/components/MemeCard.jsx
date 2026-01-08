'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MemeCard({ meme }) {
  const [expanded, setExpanded] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    // Fetch comment count
    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/comments?meme_id=${meme.id}`);
        const data = await res.json();
        setCommentCount(data.total || 0);
      } catch (err) {
        // Silently fail
      }
    };
    fetchCount();
  }, [meme.id]);

  const handleTwitterShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = `${meme.name} - from the Archive of Meme collection\n\nOwn a piece of internet history:`;
    const url = meme.opensea_url;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  return (
    <article className="overflow-hidden border-b border-[#2a2a2a]">
      {/* Clickable Image Area */}
      <Link href={`/meme/${meme.id}`} className="block">
        {/* Header */}
        <div className="p-4">
          <span className="text-white font-semibold text-lg">{meme.name}</span>
        </div>

        {/* Image */}
        <div className="w-full flex justify-center">
          <img
            src={meme.image}
            alt={meme.name}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>
      </Link>

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
          <div className="flex items-center gap-4">
            {/* Share on X */}
            <button
              onClick={handleTwitterShare}
              className="text-[#666] hover:text-white transition-colors"
              aria-label="Share on X"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>

            {/* Comments link */}
            <Link
              href={`/meme/${meme.id}`}
              className="flex items-center gap-1.5 text-[#666] hover:text-[#a5b4fc] transition-colors"
              aria-label="View comments"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {commentCount > 0 && (
                <span className="text-xs font-medium">{commentCount}</span>
              )}
            </Link>
          </div>

          <a
            href={meme.opensea_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="group flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#2081e2] to-[#1868b7] text-white text-xs font-semibold rounded-full hover:from-[#1868b7] hover:to-[#145a9e] transition-all duration-300 shadow-md shadow-[#2081e2]/20 hover:shadow-[#2081e2]/40"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.629 0 12 0ZM5.92 12.403l.051-.081 3.123-4.884a.107.107 0 0 1 .187.014c.52 1.169.972 2.623.76 3.528-.088.372-.335.876-.614 1.342a2.405 2.405 0 0 1-.117.199.106.106 0 0 1-.09.045H6.013a.106.106 0 0 1-.091-.163zm13.914 1.68a.109.109 0 0 1-.065.101c-.243.103-1.07.485-1.414.962-.878 1.222-1.548 2.97-3.048 2.97H9.053a4.019 4.019 0 0 1-4.013-4.028v-.072c0-.058.048-.106.108-.106h3.485c.07 0 .12.063.115.132-.026.226.017.459.125.67.206.42.636.682 1.099.682h1.726v-1.347H9.99a.11.11 0 0 1-.089-.173l.063-.09c.16-.231.391-.586.621-.992.156-.274.308-.566.43-.86.024-.052.043-.107.065-.16.033-.094.067-.182.091-.269a4.57 4.57 0 0 0 .065-.223c.057-.25.081-.514.081-.787 0-.108-.004-.221-.014-.327-.005-.117-.02-.235-.034-.352a3.415 3.415 0 0 0-.048-.312 6.494 6.494 0 0 0-.098-.468l-.014-.06c-.03-.108-.056-.21-.09-.317a11.824 11.824 0 0 0-.328-.972 5.212 5.212 0 0 0-.142-.355c-.072-.178-.146-.339-.213-.49a3.564 3.564 0 0 1-.094-.197 4.658 4.658 0 0 0-.103-.213c-.024-.053-.053-.104-.072-.152l-.211-.388c-.029-.053.019-.118.077-.101l1.32.357h.01l.173.05.192.054.07.019v-.783c0-.379.302-.686.679-.686a.66.66 0 0 1 .477.202.69.69 0 0 1 .2.484V6.65l.141.039c.01.005.022.01.031.017.034.024.084.062.147.11.05.038.103.086.165.137a10.351 10.351 0 0 1 .574.504c.214.199.454.432.684.691.065.074.127.146.192.226.062.079.132.156.19.232.079.104.16.212.235.324.033.053.074.108.105.161.096.142.178.288.257.435.034.067.067.141.096.213.089.197.159.396.202.598a.65.65 0 0 1 .029.132v.01c.014.057.019.12.024.184a2.057 2.057 0 0 1-.106.874c-.031.084-.06.17-.098.254-.075.17-.161.343-.264.502-.034.06-.075.122-.113.182-.043.063-.089.123-.127.18a3.89 3.89 0 0 1-.173.221c-.053.072-.106.144-.166.209-.081.098-.16.19-.245.278-.048.058-.1.118-.156.17-.052.06-.108.113-.156.161-.084.084-.15.147-.208.202l-.137.122a.102.102 0 0 1-.072.03h-1.051v1.346h1.322c.295 0 .576-.104.804-.298.077-.067.415-.36.816-.802a.094.094 0 0 1 .05-.03l3.65-1.057a.108.108 0 0 1 .138.103z" />
            </svg>
            <span>Collect</span>
          </a>
        </div>
      </div>
    </article>
  );
}
