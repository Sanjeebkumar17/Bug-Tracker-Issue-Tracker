import React from 'react';
import { History, CheckCircle2, Clock, MessageSquare, AlertCircle, UserCheck } from 'lucide-react';

export const ActivityTrail = ({ activities = [] }) => {
  const getActionDetails = (act) => {
    switch (act.action) {
      case 'status_changed':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />,
          text: (
            <span>
              changed status from <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{act.old_value}</span> to{' '}
              <span className="font-semibold text-indigo-700 dark:text-indigo-300 uppercase text-[10px] bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">{act.new_value}</span>
            </span>
          )
        };
      case 'priority_changed':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />,
          text: (
            <span>
              changed priority from <span className="font-semibold text-slate-800 dark:text-slate-200">{act.old_value}</span> to <span className="font-semibold text-slate-800 dark:text-slate-200">{act.new_value}</span>
            </span>
          )
        };
      case 'assignee_changed':
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />,
          text: (
            <span>
              reassigned from <span className="font-semibold text-slate-800 dark:text-slate-200">{act.old_value}</span> to <span className="font-semibold text-slate-800 dark:text-slate-200">{act.new_value}</span>
            </span>
          )
        };
      case 'work_logged':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          text: (
            <span>
              logged work: <span className="font-semibold text-emerald-700 dark:text-emerald-300">{act.new_value}</span>
            </span>
          )
        };
      case 'comment_added':
        return {
          icon: <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />,
          text: (
            <span>
              commented: <span className="italic text-slate-600 dark:text-slate-400">"{act.new_value}"</span>
            </span>
          )
        };
      case 'created':
        return {
          icon: <History className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />,
          text: <span>created this issue</span>
        };
      default:
        return {
          icon: <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />,
          text: <span>updated {act.field_name || 'details'}</span>
        };
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span>Activity & Audit Trail ({activities.length})</span>
      </div>

      {activities.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">No activity recorded yet.</p>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {activities.map((act) => {
            const details = getActionDetails(act);
            return (
              <div key={act.id} className="relative flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400 group">
                <div className="absolute -left-6 mt-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-xs">
                  {details.icon}
                </div>

                <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{act.user?.full_name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(act.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 leading-normal">{details.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
