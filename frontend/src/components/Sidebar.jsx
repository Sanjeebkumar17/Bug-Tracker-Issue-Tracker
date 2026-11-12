import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Kanban, ListOrdered, Settings, Layers, 
  PlusCircle, Radio
} from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';

export const Sidebar = ({ 
  projects = [], 
  currentProject, 
  onSelectProject, 
  onOpenCreateProject 
}) => {
  const navigate = useNavigate();
  const ws = useWebSocket();

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col h-[calc(100vh-4rem)] border-r border-slate-200 dark:border-slate-800 shrink-0 transition-colors duration-200">
      {/* Project Switcher */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project</span>
          <button
            onClick={onOpenCreateProject}
            title="Create new project"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <select
          value={currentProject?.id || ''}
          onChange={(e) => {
            const selected = projects.find(p => p.id === parseInt(e.target.value));
            if (selected) {
              onSelectProject(selected);
              navigate(`/projects/${selected.id}/board`);
            }
          }}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.key} - {proj.name}
            </option>
          ))}
        </select>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {currentProject && (
          <>
            <NavLink
              to={`/projects/${currentProject.id}/board`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Kanban className="w-4 h-4" />
              <span>Kanban Board</span>
            </NavLink>

            <NavLink
              to={`/projects/${currentProject.id}/backlog`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Layers className="w-4 h-4" />
              <span>Sprints & Backlog</span>
            </NavLink>

            <NavLink
              to={`/projects/${currentProject.id}/list`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <ListOrdered className="w-4 h-4" />
              <span>Issues List</span>
            </NavLink>

            <NavLink
              to={`/projects/${currentProject.id}/settings`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Settings className="w-4 h-4" />
              <span>Team & Settings</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Live sync status footer */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${ws?.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="font-medium">{ws?.isConnected ? 'Live Sync Active' : 'Connecting Sync...'}</span>
        </div>
        <Radio className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
      </div>
    </aside>
  );
};
