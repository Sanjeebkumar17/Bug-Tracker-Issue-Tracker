import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RoleBadge } from './Common/Badge';
import { NotificationDropdown } from './Notifications/NotificationDropdown';
import { Plus, LogOut, CheckSquare, Sun, Moon } from 'lucide-react';

export const Navbar = ({ onOpenCreateTicket, onSelectTicket, canCreate = true }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-200">
      {/* Brand logo & name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 transition-transform hover:scale-105">
            <CheckSquare className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">IssueFlow</span>
            <span className="ml-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              PRO
            </span>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {canCreate && (
          <button
            onClick={onOpenCreateTicket}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-all hover:shadow active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Issue</span>
            <span className="sm:hidden">New</span>
          </button>
        )}

        {/* Theme Toggle Button with Sun and Moon Icons */}
        <button
          onClick={toggleTheme}
          type="button"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer relative z-10"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400 hover:text-amber-300 transition-transform rotate-0 hover:rotate-45 duration-200 pointer-events-none" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600 hover:text-indigo-700 transition-transform -rotate-12 hover:rotate-0 duration-200 pointer-events-none" />
          )}
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Notifications Dropdown */}
        <NotificationDropdown onSelectTicket={onSelectTicket} />

        {/* User profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 ml-1">
          <img
            src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || 'User'}`}
            alt={user?.full_name}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 object-cover"
          />
          <div className="flex flex-col text-left hidden md:flex">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">{user?.full_name}</span>
              <RoleBadge role={user?.role} />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{user?.email}</span>
          </div>

          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 sm:p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
