import React, { useState } from 'react';
import { CommentItem } from './CommentItem';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

export const CommentList = ({ 
  comments = [], 
  onAddComment, 
  onDeleteComment, 
  canComment = true 
}) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await onAddComment(content.trim(), null);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span>Discussion ({comments.length})</span>
      </div>

      {/* Post comment input */}
      {canComment ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment or update (supports @mentions)..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800/90 resize-y transition-colors"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Comment</span>
            </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">Viewers have read-only access to comments.</p>
      )}

      {/* Comments List */}
      <div className="space-y-3 pt-2">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No comments yet. Start the conversation!</p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={onAddComment}
              onDelete={onDeleteComment}
              canComment={canComment}
            />
          ))
        )}
      </div>
    </div>
  );
};
