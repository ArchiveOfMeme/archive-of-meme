'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function Comment({ comment, onVote, onReply, canInteract, currentWallet }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [voting, setVoting] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  const handleVote = async (voteType) => {
    if (!canInteract || voting) return;
    setVoting(true);
    await onVote(comment.id, voteType);
    setVoting(false);
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    await onReply(comment.id, replyContent);
    setReplyContent('');
    setShowReplyForm(false);
  };

  return (
    <div className="border-l-2 border-[#2a2a2a] pl-3 py-2">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-[#666]">
        <span className="text-[#a5b4fc] font-medium">{comment.author.displayName}</span>
        <span>•</span>
        <span>{timeAgo}</span>
      </div>

      {/* Content */}
      <p className="text-white text-sm mt-1 whitespace-pre-wrap break-words">
        {comment.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-2">
        {/* Votes */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleVote(1)}
            disabled={!canInteract || voting}
            className={`p-1 rounded transition-colors ${
              canInteract ? 'hover:bg-[#2a2a2a]' : 'opacity-50 cursor-not-allowed'
            }`}
            title="Upvote"
          >
            <svg className="w-4 h-4 text-[#666] hover:text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <span className={`text-xs min-w-[20px] text-center ${
            comment.votes.up - comment.votes.down > 0 ? 'text-[#00ff88]' :
            comment.votes.up - comment.votes.down < 0 ? 'text-red-500' : 'text-[#666]'
          }`}>
            {comment.votes.up - comment.votes.down}
          </span>
          <button
            onClick={() => handleVote(-1)}
            disabled={!canInteract || voting}
            className={`p-1 rounded transition-colors ${
              canInteract ? 'hover:bg-[#2a2a2a]' : 'opacity-50 cursor-not-allowed'
            }`}
            title="Downvote"
          >
            <svg className="w-4 h-4 text-[#666] hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Reply button */}
        {canInteract && !comment.parentId && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-xs text-[#666] hover:text-[#a5b4fc] transition-colors"
          >
            Reply
          </button>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            maxLength={500}
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#a5b4fc]"
          />
          <button
            onClick={handleReply}
            disabled={!replyContent.trim()}
            className="px-3 py-2 bg-[#a5b4fc] text-black text-xs font-bold rounded-lg hover:bg-[#8b9cf0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      )}

      {/* Nested replies */}
      {comment.replies?.length > 0 && (
        <div className="mt-3 space-y-2">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onVote={onVote}
              onReply={onReply}
              canInteract={canInteract}
              currentWallet={currentWallet}
            />
          ))}
        </div>
      )}
    </div>
  );
}
