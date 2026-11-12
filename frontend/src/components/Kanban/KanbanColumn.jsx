import React, { useState } from 'react';
import { TicketCard } from './TicketCard';
import { Plus } from 'lucide-react';

export const KanbanColumn = ({
  column,
  tickets = [],
  onTicketClick,
  onTicketDrop,
  onOpenCreateTicket,
  canCreate = true,
  canDrag = true
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!canDrag) return;
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!canDrag) return;

    try {
      const ticketData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (ticketData && ticketData.id) {
        onTicketDrop(ticketData, column.id);
      }
    } catch (err) {
      console.error('Failed to parse dropped ticket data:', err);
    }
  };

  const handleDragStart = (e, ticket) => {
    e.dataTransfer.setData('application/json', JSON.stringify(ticket));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className={`flex flex-col w-80 shrink-0 bg-slate-100/90 dark:bg-slate-900/60 rounded-xl border transition-all ${
        isDragOver 
          ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-400/20 dark:border-indigo-500 dark:bg-indigo-950/30 dark:ring-indigo-500/20' 
          : 'border-slate-200 dark:border-slate-800'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${column.indicatorColor}`} />
          <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{column.title}</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {tickets.length}
          </span>
        </div>

        {canCreate && (
          <button
            onClick={() => onOpenCreateTicket(column.id)}
            title={`Add ticket to ${column.title}`}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Column Body / Drop Zone */}
      <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-14rem)] min-h-[160px]">
        {tickets.length === 0 ? (
          <div className="h-28 border border-dashed border-slate-300/80 dark:border-slate-800/80 rounded-lg flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 italic">
            No issues in {column.title}
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              isDraggable={canDrag}
              onClick={() => onTicketClick(ticket)}
              onDragStart={handleDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
};
