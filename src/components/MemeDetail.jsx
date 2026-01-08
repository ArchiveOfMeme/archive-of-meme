'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useHasPass } from '@/hooks/useHasPass';
import CommentSection from './community/CommentSection';

const PASS_TOKEN_ID = process.env.NEXT_PUBLIC_PASS_TOKEN_ID || '8';

export default function MemeDetail({ memeId }) {
  const { address, isConnected } = useAccount();
  const { hasPass, loading: passLoading } = useHasPass();
  const [meme, setMeme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passImage, setPassImage] = useState('/images/logo/Logo.png');

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

  // Fetch Pass NFT image
  useEffect(() => {
    const fetchPassImage = async () => {
      try {
        const res = await fetch(`/api/memes/${PASS_TOKEN_ID}`);
        const data = await res.json();
        if (data.meme?.image) {
          setPassImage(data.meme.image);
        }
      } catch (err) {
        // Keep default image
      }
    };
    fetchPassImage();
  }, []);

  const handleShare = () => {
    const text = `${meme.name} - from the Archive of Meme collection\n\nOwn a piece of internet history:`;
    const url = window.location.href;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  if (loading || passLoading) {
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

  // If not connected or no Pass, show Pass purchase screen
  if (!isConnected || !hasPass) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
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
            <h1 className="text-white font-semibold truncate flex-1">Community Access</h1>
          </div>
        </header>

        {/* Pass Purchase Screen */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm w-full">
            {/* NFT Pass Card */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-3xl overflow-hidden border border-[#2a2a2a] shadow-2xl">
              {/* Pass Image */}
              <div className="aspect-square bg-[#0a0a0a] p-6">
                <img
                  src={passImage}
                  alt="Community Pass NFT"
                  className="w-full h-full object-contain rounded-2xl"
                />
              </div>

              {/* Pass Info */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-white text-2xl font-bold mb-2">Community Pass</h2>
                  <p className="text-[#888] text-sm leading-relaxed">
                    Get access to comment, vote and participate in the Archive of Meme community.
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-[#a5b4fc]/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#a5b4fc]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[#ccc]">Comment on any meme</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-[#a5b4fc]/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#a5b4fc]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[#ccc]">Upvote & downvote</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-[#a5b4fc]/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#a5b4fc]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[#ccc]">Lifetime access</span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 pt-2">
                  <span className="text-white text-3xl font-bold">0.0005</span>
                  <span className="text-[#888]">ETH</span>
                </div>

                {/* Action Button */}
                {!isConnected ? (
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <button
                        onClick={openConnectModal}
                        className="w-full py-4 bg-[#a5b4fc] text-black font-bold text-base rounded-xl hover:bg-[#8b9cf0] transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Connect Wallet
                      </button>
                    )}
                  </ConnectButton.Custom>
                ) : (
                  <a
                    href="https://opensea.io/assets/base/0xa11233cd58e76d1a149c86bac503742636c8f60c/8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-[#a5b4fc] text-black font-bold text-base rounded-xl hover:bg-[#8b9cf0] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Get Pass on OpenSea</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Back link */}
            <div className="text-center mt-6">
              <Link href="/" className="text-[#666] text-sm hover:text-white transition-colors">
                Back to Archive
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // User has Pass - show meme with comments
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

        {/* Comments */}
        <div className="p-4">
          <CommentSection memeId={memeId} />
        </div>
      </main>
    </div>
  );
}
