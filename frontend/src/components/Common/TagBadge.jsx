import React from 'react';
import { X } from 'lucide-react';

export const TagBadge = ({ tag, onRemove = null, size = 'sm' }) => {
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border transition-colors ${
        isSmall ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
      style={{
        backgroundColor: `${tag.color}15`,
        borderColor: `${tag.color}40`,
        color: tag.color
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
      <span>{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag.id);
          }}
          className="hover:opacity-75 ml-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};
