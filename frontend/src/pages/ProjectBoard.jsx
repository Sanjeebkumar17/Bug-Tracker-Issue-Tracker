import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { KanbanBoard } from '../components/Kanban/KanbanBoard';
import { FilterBar } from '../components/Tickets/FilterBar';
import { CreateTicketModal } from '../components/Tickets/CreateTicketModal';
import { TicketDetailModal } from '../components/Tickets/TicketDetailModal';
import { CreateProjectModal } from '../components/Projects/CreateProjectModal';
import { projectsApi } from '../api/projects';
import { ticketsApi } from '../api/tickets';
import { useWebSocket, WebSocketProvider } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

const BoardContent = ({
  projects,
  currentProject,
  setCurrentProject,
  fetchProjects
}) => {
  const { user } = useAuth();
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
  const [initialColumnStatus, setInitialColumnStatus] = useState('todo');
  const [detailTicketId, setDetailTicketId] = useState(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const ws = useWebSocket();

  // User project role
  const isViewer = user?.role === 'viewer';
  const canCreate = !isViewer;
  const canDrag = !isViewer;

  const fetchBoardData = useCallback(async () => {
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
      console.error('Error fetching board data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id, search, typeFilter, priorityFilter, assigneeFilter]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  // WebSocket Live Listener
  useEffect(() => {
    if (!ws?.addListener) return;

    const unsubscribe = ws.addListener((message) => {
      console.log('[Board] WebSocket Event received:', message.event);
      if (
        message.event === 'ticket_created' || 
        message.event === 'ticket_updated' || 
        message.event === 'ticket_status_changed' || 
        message.event === 'ticket_deleted'
      ) {
        // Refresh tickets silently without full page spinner
        ticketsApi.getTickets({
          project_id: currentProject.id,
          search: search || undefined,
          type: typeFilter || undefined,
          priority: priorityFilter || undefined,
          assignee_id: assigneeFilter ? parseInt(assigneeFilter) : undefined
        }).then(setTickets).catch(console.error);
      }
    });

    return unsubscribe;
  }, [ws, currentProject?.id, search, typeFilter, priorityFilter, assigneeFilter]);

  const handleStatusChange = async (ticketId, newStatus) => {
    // Optimistic UI update
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );

    try {
      await ticketsApi.updateTicket(ticketId, { status: newStatus });
    } catch (err) {
      console.error('Failed to update ticket status via drag & drop:', err);
      // Rollback on failure
      fetchBoardData();
    }
  };

  const handleOpenCreateTicket = (status = 'todo') => {
    setInitialColumnStatus(status);
    setCreateTicketOpen(true);
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setPriorityFilter('');
    setAssigneeFilter('');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar
        projects={projects}
        currentProject={currentProject}
        onSelectProject={setCurrentProject}
        onOpenCreateProject={() => setCreateProjectOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onOpenCreateTicket={() => handleOpenCreateTicket('todo')}
          onSelectTicket={(id) => setDetailTicketId(id)}
          canCreate={canCreate}
        />

        <main className="flex-1 p-6 overflow-hidden flex flex-col">
          {/* Project Title & Key */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{currentProject?.name}</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {currentProject?.key}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl truncate">
                {currentProject?.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Filters Bar */}
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
            onReset={handleResetFilters}
          />

          {/* Kanban Board Container */}
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm">Loading project board...</span>
              </div>
            ) : (
              <KanbanBoard
                tickets={tickets}
                onTicketClick={(t) => setDetailTicketId(t.id)}
                onStatusChange={handleStatusChange}
                onOpenCreateTicket={handleOpenCreateTicket}
                canCreate={canCreate}
                canDrag={canDrag}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateTicketModal
        isOpen={createTicketOpen}
        onClose={() => setCreateTicketOpen(false)}
        projectId={currentProject?.id}
        initialStatus={initialColumnStatus}
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
        canEdit={!isViewer}
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

export const ProjectBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const list = await projectsApi.getProjects();
      setProjects(list);

      if (list.length > 0) {
        if (projectId) {
          const match = list.find((p) => p.id === parseInt(projectId));
          setCurrentProject(match || list[0]);
        } else {
          setCurrentProject(list[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full text-center shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">No Projects Found</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Get started by creating your first project to organize bugs and tasks.
          </p>
          <button
            onClick={() => {
              projectsApi.createProject({
                name: 'Default Project',
                key: 'DEF',
                description: 'Default project created automatically.'
              }).then(fetchProjects);
            }}
            className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Create First Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <WebSocketProvider projectId={currentProject?.id}>
      <BoardContent
        projects={projects}
        currentProject={currentProject}
        setCurrentProject={setCurrentProject}
        fetchProjects={fetchProjects}
      />
    </WebSocketProvider>
  );
};
