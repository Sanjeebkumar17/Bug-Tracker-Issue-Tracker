import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { FilterBar } from '../components/Tickets/FilterBar';
import { CreateTicketModal } from '../components/Tickets/CreateTicketModal';
import { TicketDetailModal } from '../components/Tickets/TicketDetailModal';
import { CreateProjectModal } from '../components/Projects/CreateProjectModal';
import { PriorityBadge, TypeBadge, StatusBadge } from '../components/Common/Badge';
import { projectsApi } from '../api/projects';
import { ticketsApi } from '../api/tickets';
import { useAuth } from '../context/AuthContext';
import { Loader2, MessageSquare, Paperclip, User } from 'lucide-react';

export const TicketListView = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Modals
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [detailTicketId, setDetailTicketId] = useState(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const isViewer = user?.role === 'viewer';
  const canCreate = !isViewer;

  const fetchProjects = useCallback(async () => {
    try {
      const list = await projectsApi.getProjects();
      setProjects(list);
      if (list.length > 0) {
        const match = list.find((p) => p.id === parseInt(projectId));
        setCurrentProject(match || list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [projectId]);

  const fetchTickets = useCallback(async () => {
    if (!currentProject?.id) return;
    try {
      setLoading(true);
      const [ticketsData, projectData] = await Promise.all([
        ticketsApi.getTickets({
          project_id: currentProject.id,
          search: search || undefined,
          type: typeFilter || undefined,
          priority: priorityFilter || undefined,
          assignee_id: assigneeFilter ? parseInt(assigneeFilter) : undefined
        }),
        projectsApi.getProject(currentProject.id)
      ]);

      setTickets(ticketsData);
      setMembers(projectData.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id, search, typeFilter, priorityFilter, assigneeFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar
        projects={projects}
        currentProject={currentProject}
        onSelectProject={(proj) => {
          setCurrentProject(proj);
          navigate(`/projects/${proj.id}/list`);
        }}
        onOpenCreateProject={() => setCreateProjectOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onOpenCreateTicket={() => setCreateTicketOpen(true)}
          onSelectTicket={(id) => setDetailTicketId(id)}
          canCreate={canCreate}
        />

        <main className="flex-1 p-6 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{currentProject?.name}</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {currentProject?.key}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All issues in table and list format.</p>
            </div>
          </div>

          <FilterBar
            search={search}
            setSearch={setSearch}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            assigneeFilter={assigneeFilter}
            setAssigneeFilter={setAssigneeFilter}
            members={members}
            onReset={() => {
              setSearch('');
              setTypeFilter('');
              setPriorityFilter('');
              setAssigneeFilter('');
            }}
          />

          <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm">Loading issues...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                No tickets matching current filters.
              </div>
            ) : (
              <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Key</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Assignee</th>
                      <th className="px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tickets.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => setDetailTicketId(t.id)}
                        className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          {t.key}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-md truncate">
                          <div className="flex items-center gap-2">
                            <span>{t.title}</span>
                            {t.comments_count > 0 && (
                              <span className="text-slate-400 dark:text-slate-500 flex items-center gap-0.5 text-xs">
                                <MessageSquare className="w-3 h-3" />
                                {t.comments_count}
                              </span>
                            )}
                            {t.attachments_count > 0 && (
                              <span className="text-slate-400 dark:text-slate-500 flex items-center gap-0.5 text-xs">
                                <Paperclip className="w-3 h-3" />
                                {t.attachments_count}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <TypeBadge type={t.type} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {t.assignee ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={t.assignee.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${t.assignee.full_name}`}
                                alt={t.assignee.full_name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="text-xs text-slate-800 dark:text-slate-200">{t.assignee.full_name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateTicketModal
        isOpen={createTicketOpen}
        onClose={() => setCreateTicketOpen(false)}
        projectId={currentProject?.id}
        members={members}
        onTicketCreated={(newTicket) => {
          setTickets(prev => [newTicket, ...prev]);
        }}
      />

      <TicketDetailModal
        isOpen={!!detailTicketId}
        onClose={() => setDetailTicketId(null)}
        ticketId={detailTicketId}
        members={members}
        canEdit={canCreate}
        onTicketUpdated={(updated) => {
          setTickets(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
        }}
        onTicketDeleted={(deletedId) => {
          setTickets(prev => prev.filter(t => t.id !== deletedId));
        }}
      />

      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onProjectCreated={async (newProj) => {
          await fetchProjects();
          setCurrentProject(newProj);
        }}
      />
    </div>
  );
};
