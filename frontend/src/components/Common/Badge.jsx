import React from 'react';
import { 
  Bug, Sparkles, CheckSquare, 
  Flame, ArrowUp, Minus, ArrowDown, 
  ShieldAlert, Code, Eye
} from 'lucide-react';

export const PriorityBadge = ({ priority }) => {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60">
          <Flame className="w-3 h-3 text-red-600 dark:text-red-400" />
          Urgent
        </span>
      );
    case 'high':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
          <ArrowUp className="w-3 h-3 text-orange-600 dark:text-orange-400" />
          High
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          <Minus className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          Medium
        </span>
      );
    case 'low':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
          <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Low
        </span>
      );
    default:
      return null;
  }
};

export const TypeBadge = ({ type }) => {
  switch (type?.toLowerCase()) {
    case 'bug':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
          <Bug className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          Bug
        </span>
      );
    case 'feature':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
          <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          Feature
        </span>
      );
    case 'task':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-indigo-950/50 text-blue-700 dark:text-indigo-300 border border-blue-200 dark:border-indigo-800/60">
          <CheckSquare className="w-3 h-3 text-blue-600 dark:text-indigo-400" />
          Task
        </span>
      );
    default:
      return null;
  }
};

export const StatusBadge = ({ status }) => {
  switch (status?.toLowerCase()) {
    case 'todo':
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">To Do</span>;
    case 'in_progress':
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">In Progress</span>;
    case 'in_review':
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">In Review</span>;
    case 'done':
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">Done</span>;
    default:
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{status}</span>;
  }
};

export const RoleBadge = ({ role }) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
          <ShieldAlert className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          Admin
        </span>
      );
    case 'developer':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-indigo-950/60 text-blue-800 dark:text-indigo-300 border border-blue-200 dark:border-indigo-800/60">
          <Code className="w-3 h-3 text-blue-600 dark:text-indigo-400" />
          Developer
        </span>
      );
    case 'viewer':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Eye className="w-3 h-3 text-slate-500 dark:text-slate-400" />
          Viewer
        </span>
      );
    default:
      return null;
  }
};
