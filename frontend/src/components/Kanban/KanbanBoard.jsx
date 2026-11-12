import React from 'react';
import { KanbanColumn } from './KanbanColumn';

const COLUMNS = [
  { id: 'todo', title: 'To Do', indicatorColor: 'bg-slate-400' },
  { id: 'in_progress', title: 'In Progress', indicatorColor: 'bg-blue-500' },
  { id: 'in_review', title: 'In Review', indicatorColor: 'bg-amber-500' },
  { id: 'done', title: 'Done', indicatorColor: 'bg-emerald-500' },
];

export const KanbanBoard = ({
  tickets = [],
  onTicketClick,
  onStatusChange,
  onOpenCreateTicket,
  canCreate = true,
  canDrag = true
}) => {
  const handleTicketDrop = (ticket, newStatus) => {
    if (ticket.status === newStatus) return;
    onStatusChange(ticket.id, newStatus);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start h-full">
      {COLUMNS.map((column) => {
        const columnTickets = tickets.filter((t) => t.status === column.id);
        return (
          <KanbanColumn
            key={column.id}
            column={column}
            tickets={columnTickets}
            onTicketClick={onTicketClick}
            onTicketDrop={handleTicketDrop}
            onOpenCreateTicket={onOpenCreateTicket}
            canCreate={canCreate}
            canDrag={canDrag}
          />
        );
      })}
    </div>
  );
};
