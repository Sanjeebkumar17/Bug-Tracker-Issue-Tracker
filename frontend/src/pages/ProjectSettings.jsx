import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { RoleBadge } from '../components/Common/Badge';
import { CreateProjectModal } from '../components/Projects/CreateProjectModal';
import { projectsApi } from '../api/projects';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { 
  Users, UserPlus, ShieldAlert, Trash2, 
  Settings as SettingsIcon, Save, Loader2 
} from 'lucide-react';

export const ProjectSettings = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('developer');
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const [list, users] = await Promise.all([
        projectsApi.getProjects(),
        authApi.getUsers()
      ]);
      setProjects(list);
      setAllUsers(users);

      const targetId = projectId || (list[0]?.id);
      if (targetId) {
        const fullProj = await projectsApi.getProject(targetId);
        setCurrentProject(fullProj);
        setName(fullProj.name);
        setDescription(fullProj.description || '');
        setMembers(fullProj.members || []);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load project settings.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Determine user's role in this project
  const userMember = members.find(m => m.user_id === user?.id);
  const isAdmin = user?.role === 'admin' || userMember?.role === 'admin' || currentProject?.owner_id === user?.id;

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsSaving(true);
    setMessage({ text: '', type: '' });
    try {
      await projectsApi.updateProject(currentProject.id, {
        name: name.trim(),
        description: description.trim() || null
      });
      setMessage({ text: 'Project details updated successfully!', type: 'success' });
      fetchProjectData();
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to update project.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !isAdmin) return;

    setIsAddingMember(true);
    setMessage({ text: '', type: '' });
    try {
      await projectsApi.addMember(currentProject.id, {
        user_id: parseInt(selectedUserId),
        role: newMemberRole
      });
      setSelectedUserId('');
      setMessage({ text: 'Member added successfully!', type: 'success' });
      fetchProjectData();
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to add member.', type: 'error' });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      await projectsApi.updateMemberRole(currentProject.id, targetUserId, newRole);
      fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update role.');
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await projectsApi.removeMember(currentProject.id, targetUserId);
      fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove member.');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`DANGER: Are you sure you want to delete "${currentProject.name}"? All tickets will be erased.`)) {
      return;
    }
    try {
      await projectsApi.deleteProject(currentProject.id);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete project.');
    }
  };

  // Filter users not already in project
  const memberUserIds = new Set(members.map(m => m.user_id));
  const availableUsers = allUsers.filter(u => !memberUserIds.has(u.id));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar
        projects={projects}
        currentProject={currentProject}
        onSelectProject={(proj) => {
          setCurrentProject(proj);
          navigate(`/projects/${proj.id}/settings`);
        }}
        onOpenCreateProject={() => setCreateProjectOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar canCreate={false} />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SettingsIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span>Project Settings & Team</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage project details, access controls, and team member permissions.
              </p>
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl text-sm font-medium ${
                message.type === 'error' 
                  ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900' 
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
              }`}>
                {message.text}
              </div>
            )}

            {/* General Info Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
                General Information
              </h2>

              <form onSubmit={handleUpdateProject} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Project Key (Read-only)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentProject?.key || ''}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-500 dark:text-slate-400 uppercase cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    disabled={!isAdmin}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 resize-y transition-colors"
                  />
                </div>

                {isAdmin && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Team Members Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Team Members ({members.length})
                  </h2>
                </div>
              </div>

              {/* Add member form */}
              {isAdmin && availableUsers.length > 0 && (
                <form onSubmit={handleAddMember} className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
                  <div className="flex-1 min-w-[200px]">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a user to invite...</option>
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="developer">Developer</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>

                  <button
                    type="submit"
                    disabled={isAddingMember || !selectedUserId}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {isAddingMember ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    <span>Add Member</span>
                  </button>
                </form>
              )}

              {/* Members table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="text-xs text-slate-400 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5">User</th>
                      <th className="py-2.5">Email</th>
                      <th className="py-2.5">Role</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {members.map((m) => {
                      const isOwner = currentProject?.owner_id === m.user_id;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={m.user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${m.user.full_name}`}
                                alt={m.user.full_name}
                                className="w-7 h-7 rounded-full object-cover"
                              />
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-slate-100 block">{m.user.full_name}</span>
                                {isOwner && (
                                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Project Owner</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-slate-500 dark:text-slate-400 text-xs">{m.user.email}</td>
                          <td className="py-3">
                            {isAdmin && !isOwner ? (
                              <select
                                value={m.role}
                                onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="admin">Admin</option>
                                <option value="developer">Developer</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            ) : (
                              <RoleBadge role={m.role} />
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {isAdmin && !isOwner && (
                              <button
                                onClick={() => handleRemoveMember(m.user_id)}
                                title="Remove member"
                                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Danger Zone */}
            {isAdmin && (
              <div className="bg-red-50/60 dark:bg-red-950/30 p-6 rounded-2xl border border-red-200 dark:border-red-900/60 space-y-3 transition-colors">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Danger Zone</h3>
                </div>
                <p className="text-xs text-red-600 dark:text-red-300">
                  Permanently delete this project along with all tickets, comments, and uploaded attachments. This action cannot be reversed.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleDeleteProject}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    Delete This Project
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onProjectCreated={async (newProj) => {
          await fetchProjectData();
          navigate(`/projects/${newProj.id}/board`);
        }}
      />
    </div>
  );
};
