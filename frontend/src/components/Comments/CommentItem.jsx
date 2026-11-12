import React, { useState } from 'react';
import { Reply, Trash2, Send, CornerDownRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const CommentItem = ({ 
  comment, 
  onReply, 
  onDelete, 
  canComment = true 
}) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const isAuthor = user?.id === comment.author_id;
  const isAdmin = user?.role === 'admin';
  const canDelete = isAuthor || isAdmin;

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setLoading(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText('');
      setIsReplying(false);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 text-sm group">
        <img
          src={comment.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.author?.full_name}`}
          alt={comment.author?.full_name}
          className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5 object-cover"
        />

        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-lg p-3 transition-colors">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{comment.author?.full_name}</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{formatDate(comment.created_at)}</span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {canComment && !comment.parent_id && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  title="Reply"
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(comment.id)}
                  title="Delete comment"
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
            {comment.content}
          </p>
        </div>
      </div>

      {/* Reply input */}
      {isReplying && (
        <form onSubmit={handleSendReply} className="ml-10 flex gap-2 items-center">
          <CornerDownRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.author?.full_name}...`}
            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 dark:placeholder-slate-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !replyText.trim()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-2.5 border-l-2 border-slate-200 dark:border-slate-800 pl-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2.5 text-xs group">
              <img
                src={reply.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${reply.author?.full_name}`}
                alt={reply.author?.full_name}
                className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5 object-cover"
              />
              <div className="flex-1 min-w-0 bg-slate-50/70 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 rounded-lg p-2.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{reply.author?.full_name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(reply.created_at)}</span>
                  </div>

                  {(user?.id === reply.author_id || user?.role === 'admin') && (
                    <button
                      onClick={() => onDelete(reply.id)}
                      title="Delete reply"
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">
                  {reply.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
