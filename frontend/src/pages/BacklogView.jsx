import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { PriorityBadge, TypeBadge, StatusBadge } from '../components/Common/Badge';
import { TagBadge } from '../components/Common/TagBadge';
import { CreateTicketModal } from '../components/Tickets/CreateTicketModal';
import { TicketDetailModal } from '../components/Tickets/TicketDetailModal';
import { CreateProjectModal } from '../components/Projects/CreateProjectModal';
import { projectsApi } from '../api/projects';
import { ticketsApi } from '../api/tickets';
import { sprintsApi } from '../api/sprints';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, Plus, Play, CheckCircle2, Calendar, 
  ChevronRight, ArrowRight, Loader2, Sparkles, User, Hash
} from 'lucide-react';

export const BacklogView = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sprint Creation
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');

  // Modals
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [detailTicketId, setDetailTicketId] = useState(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const isViewer = user?.role === 'viewer';
  const canEdit = !isViewer;

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const list = await projectsApi.getProjects();
      setProjects(list);

      const targetId = projectId || list[0]?.id;
      if (targetId) {
        const [proj, sprintList, ticketList] = await Promise.all([
          projectsApi.getProject(targetId),
          sprintsApi.getProjectSprints(targetId),
          ticketsApi.getTickets({ project_id: targetId })
        ]);
        setCurrentProject(proj);
        setMembers(proj.members || []);
        setSprints(sprintList);
        setTickets(ticketList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;
    await sprintsApi.createSprint(currentProject.id, {
      name: newSprintName.trim(),
      goal: newSprintGoal.trim() || null
    });
    setNewSprintName('');
    setNewSprintGoal('');
    setIsCreatingSprint(false);
    fetchAll();
  };

  const handleSprintStatus = async (sprintId, status) => {
    await sprintsApi.updateSprint(sprintId, { status });
    fetchAll();
  };

  const handleMoveToSprint = async (ticketId, sprintId) => {
    await ticketsApi.updateTicket(ticketId, { sprint_id: sprintId === 'backlog' ? -1 : sprintId });
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, sprint_id: sprintId === 'backlog' ? null : sprintId } : t));
  };

  // Group tickets
  const activeSprints = sprints.filter(s => s.status === 'active');
  const futureSprints = sprints.filter(s => s.status === 'future');
  const completedSprints = sprints.filter(s => s.status === 'completed');
  const backlogTickets = tickets.filter(t => !t.sprint_id);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar
        projects={projects}
        currentProject={currentProject}
        onSelectProject={(proj) => {
          setCurrentProject(proj);
          navigate(`/projects/${proj.id}/backlog`);
        }}
        onOpenCreateProject={() => setCreateProjectOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onOpenCreateTicket={() => setCreateTicketOpen(true)}
          onSelectTicket={(id) => setDetailTicketId(id)}
          canCreate={canEdit}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <span>Sprint Planning & Backlog</span>
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {currentProject?.key}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Plan iterations, estimate story points, and commit issues to sprints.
              </p>
            </div>

            {canEdit && (
              <button
                onClick={() => setIsCreatingSprint(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Sprint</span>
              </button>
            )}
          </div>

          {/* New Sprint Modal */}
          {isCreatingSprint && (
            <form onSubmit={handleCreateSprint} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm space-y-3 mb-6 transition-colors">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Sprint</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Sprint Name (e.g. Sprint 3 - Performance & Auth)"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Sprint Goal (optional)"
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingSprint(false)}
                  className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm">Loading sprints & backlog...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active & Future Sprints */}
              {sprints.map((sprint) => {
                const sprintTickets = tickets.filter(t => t.sprint_id === sprint.id);
                const totalPoints = sprintTickets.reduce((acc, t) => acc + (t.story_points || 0), 0);
                const isActive = sprint.status === 'active';

                return (
                  <div key={sprint.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                    {/* Sprint Header */}
                    <div className={`p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 ${
                      isActive ? 'bg-indigo-50/50 dark:bg-indigo-950/40' : 'bg-slate-50 dark:bg-slate-850'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{sprint.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isActive ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {sprint.status}
                          </span>
                        </div>

                        {sprint.goal && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline truncate max-w-md">
                            — {sprint.goal}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
                          {totalPoints} pts ({sprintTickets.length} issues)
                        </span>

                        {canEdit && (
                          <>
                            {sprint.status === 'future' && (
                              <button
                                onClick={() => handleSprintStatus(sprint.id, 'active')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded flex items-center gap-1 transition-colors"
                              >
                                <Play className="w-3 h-3 fill-white" />
                                <span>Start Sprint</span>
                              </button>
                            )}
                            {sprint.status === 'active' && (
                              <button
                                onClick={() => handleSprintStatus(sprint.id, 'completed')}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold rounded flex items-center gap-1 transition-colors"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Complete Sprint</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Sprint Issue List */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {sprintTickets.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                          No issues committed to this sprint. Move issues from Backlog below.
                        </div>
                      ) : (
                        sprintTickets.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setDetailTicketId(t.id)}
                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <TypeBadge type={t.type} />
                              <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {t.key}
                              </span>
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                {t.title}
                              </span>
                              {t.tags && t.tags.length > 0 && (
                                <div className="hidden sm:flex gap-1">
                                  {t.tags.map(tag => (
                                    <TagBadge key={tag.id} tag={tag} size="sm" />
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <StatusBadge status={t.status} />
                              <PriorityBadge priority={t.priority} />
                              {t.story_points && (
                                <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold">
                                  {t.story_points} pts
                                </span>
                              )}
                              {canEdit && (
                                <select
                                  value={sprint.id}
                                  onChange={(e) => handleMoveToSprint(t.id, e.target.value)}
                                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                                >
                                  <option value={sprint.id}>In {sprint.name}</option>
                                  <option value="backlog">Move to Backlog</option>
                                  {sprints.filter(s => s.id !== sprint.id).map(s => (
                                    <option key={s.id} value={s.id}>Move to {s.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Product Backlog Section */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                <div className="p-4 bg-slate-50 dark:bg-slate-850 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Product Backlog</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {backlogTickets.length} issues
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {backlogTickets.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                      Backlog is empty. All issues are assigned to sprints!
                    </div>
                  ) : (
                    backlogTickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setDetailTicketId(t.id)}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <TypeBadge type={t.type} />
                          <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {t.key}
                          </span>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {t.title}
                          </span>
                          {t.tags && t.tags.length > 0 && (
                            <div className="hidden sm:flex gap-1">
                              {t.tags.map(tag => (
                                <TagBadge key={tag.id} tag={tag} size="sm" />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <StatusBadge status={t.status} />
                          <PriorityBadge priority={t.priority} />
                          {t.story_points && (
                            <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold">
                              {t.story_points} pts
                            </span>
                          )}
                          {canEdit && (
                            <select
                              value="backlog"
                              onChange={(e) => handleMoveToSprint(t.id, e.target.value)}
                              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                            >
                              <option value="backlog">Backlog</option>
                              {sprints.map((s) => (
                                <option key={s.id} value={s.id}>Move to {s.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <CreateTicketModal
        isOpen={createTicketOpen}
        onClose={() => setCreateTicketOpen(false)}
        projectId={currentProject?.id}
        members={members}
        onTicketCreated={() => fetchAll()}
      />

      <TicketDetailModal
        isOpen={!!detailTicketId}
        onClose={() => setDetailTicketId(null)}
        ticketId={detailTicketId}
        members={members}
        canEdit={canEdit}
        onTicketUpdated={() => fetchAll()}
        onTicketDeleted={() => fetchAll()}
      />

      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onProjectCreated={async (newProj) => {
          await fetchAll();
          setCurrentProject(newProj);
        }}
      />
    </div>
  );
};
