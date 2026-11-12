import React from 'react';
import { PriorityBadge, TypeBadge } from '../Common/Badge';
import { TagBadge } from '../Common/TagBadge';
import { MessageSquare, Paperclip, User, Clock } from 'lucide-react';

export const TicketCard = ({ 
  ticket, 
  onClick, 
  onDragStart, 
  isDraggable = true 
}) => {
  return (
    <div
      draggable={isDraggable}
      onDragStart={(e) => onDragStart(e, ticket)}
      onClick={onClick}
      className={`group bg-white dark:bg-slate-850 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all cursor-pointer relative ${
        isDraggable ? 'hover:border-indigo-400 dark:hover:border-indigo-500/70' : 'cursor-default'
      }`}
    >
      {/* Header: Key & Type & Story Points */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide font-mono">
            {ticket.key}
          </span>
          {ticket.story_points && (
            <span className="px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold">
              {ticket.story_points} pts
            </span>
          )}
        </div>
        <TypeBadge type={ticket.type} />
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2 leading-snug">
        {ticket.title}
      </h4>

      {/* Tags / Labels */}
      {ticket.tags && ticket.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {ticket.tags.slice(0, 3).map((tag) => (
            <TagBadge key={tag.id} tag={tag} size="sm" />
          ))}
          {ticket.tags.length > 3 && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium self-center">
              +{ticket.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: Priority & Assignee / Meta */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
        <PriorityBadge priority={ticket.priority} />

        <div className="flex items-center gap-2.5">
          {ticket.total_logged_minutes > 0 && (
            <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium" title="Logged time">
              <Clock className="w-3 h-3" />
              <span>{(ticket.total_logged_minutes / 60).toFixed(1)}h</span>
            </span>
          )}

          {ticket.comments_count > 0 && (
            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{ticket.comments_count}</span>
            </span>
          )}

          {ticket.attachments_count > 0 && (
            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{ticket.attachments_count}</span>
            </span>
          )}

          {ticket.assignee ? (
            <img
              src={ticket.assignee.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${ticket.assignee.full_name}`}
              alt={ticket.assignee.full_name}
              title={`Assigned to: ${ticket.assignee.full_name}`}
              className="w-6 h-6 rounded-full border border-white dark:border-slate-700 shadow-xs object-cover"
            />
          ) : (
            <div 
              title="Unassigned"
              className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-400"
            >
              <User className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
