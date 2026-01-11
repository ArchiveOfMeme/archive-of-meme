'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { generateMemeSlug } from '@/utils/slug';
import ActivityFeed from '@/components/ActivityFeed';

// Formatear fecha de forma segura
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
};

/**
 * TrendingSidebar - Panel derecho con trending memes y leaderboard
 */
export default function TrendingSidebar() {
  return (
    <div className="space-y-6">
      {/* Live Activity Feed */}
      <ActivityFeed compact />

      {/* Top Memes */}
      <TopMemes />

      {/* CTA */}
      <CtaCard />
    </div>
  );
}

function TopMemes() {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemes = async () => {
      try {
        const res = await fetch('/api/memes?limit=5');
        const data = await res.json();
        setMemes(data.memes?.slice(0, 5) || []);
      } catch {
        // Silently fail
      }
      setLoading(false);
    };
    fetchMemes();
  }, []);

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl p-4">
        <div className="h-5 w-24 bg-[var(--bg-elevated)] rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-12 h-12 bg-[var(--bg-elevated)] rounded-lg" />
              <div className="flex-1">
                <div className="h-4 w-20 bg-[var(--bg-elevated)] rounded" />
                <div className="h-3 w-16 bg-[var(--bg-elevated)] rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-4">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="text-lg">🔥</span>
        Recent Memes
      </h3>
      <div className="space-y-3">
        {memes.map((meme, idx) => {
          const memeSlug = generateMemeSlug(meme.name, meme.id);
          return (
          <Link
            key={`trending-${meme.id}`}
            href={`/meme/${memeSlug}`}
            className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors group"
          >
            <span className="text-[var(--text-muted)] text-sm w-4">{idx + 1}</span>
            <Image
              src={meme.image}
              alt={meme.name}
              width={48}
              height={48}
              className="w-12 h-12 object-cover rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate group-hover:text-[var(--accent-primary)] transition-colors">
                {meme.name}
              </p>
              {formatDate(meme.date) && (
                <p className="text-[var(--text-muted)] text-xs">
                  {formatDate(meme.date)}
                </p>
              )}
            </div>
          </Link>
          );
        })}
      </div>
      <Link
        href="/"
        className="block mt-4 text-center text-sm text-[var(--accent-primary)] hover:text-white transition-colors"
      >
        View all memes →
      </Link>
    </div>
  );
}

function CtaCard() {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-4 text-center">
      <span className="text-3xl block mb-2">🏛️</span>
      <h3 className="text-white font-semibold mb-1">Join the Archive</h3>
      <p className="text-[var(--text-muted)] text-sm mb-4">
        Connect your wallet to collect memes and earn points.
      </p>
      <a
        href="https://opensea.io/collection/archive-of-meme-arch"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--accent-blue)]/80 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.629 0 12 0ZM5.92 12.403l.051-.081 3.123-4.884a.107.107 0 0 1 .187.014c.52 1.169.972 2.623.76 3.528-.088.372-.335.876-.614 1.342a2.405 2.405 0 0 1-.117.199.106.106 0 0 1-.09.045H6.013a.106.106 0 0 1-.091-.163zm13.914 1.68a.109.109 0 0 1-.065.101c-.243.103-1.07.485-1.414.962-.878 1.222-1.548 2.97-3.048 2.97H9.053a4.019 4.019 0 0 1-4.013-4.028v-.072c0-.058.048-.106.108-.106h3.485c.07 0 .12.063.115.132-.026.226.017.459.125.67.206.42.636.682 1.099.682h1.726v-1.347H9.99a.11.11 0 0 1-.089-.173l.063-.09c.16-.231.391-.586.621-.992.156-.274.308-.566.43-.86.024-.052.043-.107.065-.16.033-.094.067-.182.091-.269a4.57 4.57 0 0 0 .065-.223c.057-.25.081-.514.081-.787 0-.108-.004-.221-.014-.327-.005-.117-.02-.235-.034-.352a3.415 3.415 0 0 0-.048-.312 6.494 6.494 0 0 0-.098-.468l-.014-.06c-.03-.108-.056-.21-.09-.317a11.824 11.824 0 0 0-.328-.972 5.212 5.212 0 0 0-.142-.355c-.072-.178-.146-.339-.213-.49a3.564 3.564 0 0 1-.094-.197 4.658 4.658 0 0 0-.103-.213c-.024-.053-.053-.104-.072-.152l-.211-.388c-.029-.053.019-.118.077-.101l1.32.357h.01l.173.05.192.054.07.019v-.783c0-.379.302-.686.679-.686a.66.66 0 0 1 .477.202.69.69 0 0 1 .2.484V6.65l.141.039c.01.005.022.01.031.017.034.024.084.062.147.11.05.038.103.086.165.137a10.351 10.351 0 0 1 .574.504c.214.199.454.432.684.691.065.074.127.146.192.226.062.079.132.156.19.232.079.104.16.212.235.324.033.053.074.108.105.161.096.142.178.288.257.435.034.067.067.141.096.213.089.197.159.396.202.598a.65.65 0 0 1 .029.132v.01c.014.057.019.12.024.184a2.057 2.057 0 0 1-.106.874c-.031.084-.06.17-.098.254-.075.17-.161.343-.264.502-.034.06-.075.122-.113.182-.043.063-.089.123-.127.18a3.89 3.89 0 0 1-.173.221c-.053.072-.106.144-.166.209-.081.098-.16.19-.245.278-.048.058-.1.118-.156.17-.052.06-.108.113-.156.161-.084.084-.15.147-.208.202l-.137.122a.102.102 0 0 1-.072.03h-1.051v1.346h1.322c.295 0 .576-.104.804-.298.077-.067.415-.36.816-.802a.094.094 0 0 1 .05-.03l3.65-1.057a.108.108 0 0 1 .138.103z" />
        </svg>
        Browse Collection
      </a>
    </div>
  );
}
