'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useHasPass } from '@/hooks/useHasPass';
import Comment from './Comment';

export default function CommentSection({ memeId }) {
  const { address, isConnected } = useAccount();
  const { hasPass } = useHasPass();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch comments
  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?meme_id=${memeId}`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [memeId]);

  // Submit new comment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !address || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memeId,
          content: newComment.trim(),
          wallet: address
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error posting comment');
      } else {
        setNewComment('');
        fetchComments(); // Refresh comments
      }
    } catch (err) {
      setError('Error posting comment');
    }

    setSubmitting(false);
  };

  // Vote on comment
  const handleVote = async (commentId, voteType) => {
    if (!address) return;

    try {
      await fetch('/api/comments/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          wallet: address,
          voteType
        })
      });
      fetchComments(); // Refresh to show updated votes
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  // Reply to comment
  const handleReply = async (parentId, content) => {
    if (!address || !content.trim()) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memeId,
          content: content.trim(),
          parentId,
          wallet: address
        })
      });

      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error('Error replying:', err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span>Comments</span>
          <span className="text-[#666] font-normal text-sm">({comments.length})</span>
        </h3>
      </div>

      {/* Comment form */}
      {!isConnected ? (
        <div className="bg-[#1a1a1a] rounded-xl p-4 text-center">
          <p className="text-[#666] text-sm mb-3">Connect wallet to join the conversation</p>
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={openConnectModal}
                className="px-4 py-2 bg-[#a5b4fc] text-black text-sm font-bold rounded-full hover:bg-[#8b9cf0] transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      ) : !hasPass ? (
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-5 border border-[#2a2a2a]">
          <div className="flex gap-4 items-start">
            {/* OG Pass Icon */}
            <div className="relative flex-shrink-0">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-yellow-500/20 to-orange-500/20 ring-2 ring-yellow-500/30 shadow-lg shadow-yellow-500/10 flex items-center justify-center">
                <span className="text-4xl">👑</span>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-base mb-1">OG Pass Required</h4>
              <p className="text-[#888] text-xs mb-3 leading-relaxed">
                Only OG Pass holders can comment. Get yours to join the conversation and unlock exclusive benefits.
              </p>

              <div className="flex items-center gap-3">
                <a
                  href="https://opensea.io/collection/archive-of-meme-pass"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-sm font-bold rounded-full hover:opacity-90 transition-all hover:scale-105"
                >
                  <span>Get OG Pass</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <span className="text-[#666] text-xs">0.003 ETH</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              maxLength={500}
              disabled={submitting}
              className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#a5b4fc] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-4 py-3 bg-[#a5b4fc] text-black text-sm font-bold rounded-xl hover:bg-[#8b9cf0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '...' : 'Send'}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          <p className="text-[#444] text-xs mt-1">{newComment.length}/500</p>
        </form>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-[#a5b4fc] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-[#666] text-sm text-center py-8">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onVote={handleVote}
              onReply={handleReply}
              canInteract={hasPass}
              currentWallet={address}
            />
          ))
        )}
      </div>
    </div>
  );
}
