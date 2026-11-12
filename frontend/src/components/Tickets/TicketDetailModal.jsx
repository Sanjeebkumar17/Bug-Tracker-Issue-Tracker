import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { ticketsApi } from '../../api/tickets';
import { tagsApi } from '../../api/tags';
import { sprintsApi } from '../../api/sprints';
import { PriorityBadge, TypeBadge, StatusBadge } from '../Common/Badge';
import { TagBadge } from '../Common/TagBadge';
import { MarkdownRenderer } from '../Common/MarkdownRenderer';
import { CommentList } from '../Comments/CommentList';
import { AttachmentSection } from './AttachmentSection';
import { ActivityTrail } from './ActivityTrail';
import { WorkLogSection } from './WorkLogSection';
import { useAuth } from '../../context/AuthContext';
import { 
  Trash2, Edit2, Check, X, Loader2, Calendar, 
  MessageSquare, History, Clock, Paperclip, Eye, FileText, Tag as TagIcon, Plus
} from 'lucide-react';

export const TicketDetailModal = ({
  isOpen,
  onClose,
  ticketId,
  members = [],
  onTicketUpdated,
  onTicketDeleted,
  canEdit = true
}) => {
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comments'); // comments, activity, time, attachments
  
  // Edit states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState('');
  const [descPreviewMode, setDescPreviewMode] = useState(false);

  // Tags & Sprints options
  const [availableTags, setAvailableTags] = useState([]);
  const [availableSprints, setAvailableSprints] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const fetchTicket = async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const data = await ticketsApi.getTicket(ticketId);
      setTicket(data);
      setEditedTitle(data.title);
      setEditedDesc(data.description || '');

      // Load tags and sprints for the project
      const [tagsList, sprintsList] = await Promise.all([
        tagsApi.getProjectTags(data.project_id),
        sprintsApi.getProjectSprints(data.project_id)
      ]);
      setAvailableTags(tagsList);
      setAvailableSprints(sprintsList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchTicket();
      setIsEditingTitle(false);
      setIsEditingDesc(false);
      setDescPreviewMode(false);
      setActiveTab('comments');
    }
  }, [isOpen, ticketId]);

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) return;
    const updated = await ticketsApi.updateTicket(ticket.id, { title: editedTitle.trim() });
    setTicket(prev => ({ ...prev, title: updated.title }));
    setIsEditingTitle(false);
    onTicketUpdated(updated);
  };

  const handleSaveDesc = async () => {
    const updated = await ticketsApi.updateTicket(ticket.id, { description: editedDesc.trim() || null });
    setTicket(prev => ({ ...prev, description: updated.description }));
    setIsEditingDesc(false);
    setDescPreviewMode(false);
    onTicketUpdated(updated);
  };

  const handleFieldChange = async (field, value) => {
    const payload = { [field]: value };
    const updated = await ticketsApi.updateTicket(ticket.id, payload);
    setTicket(prev => ({ ...prev, ...updated }));
    onTicketUpdated(updated);
  };

  const handleAddTag = async (tagId) => {
    const currentTagIds = (ticket.tags || []).map(t => t.id);
    if (currentTagIds.includes(tagId)) return;
    const newTagIds = [...currentTagIds, tagId];
    const updated = await ticketsApi.updateTicket(ticket.id, { tag_ids: newTagIds });
    setTicket(prev => ({ ...prev, tags: updated.tags }));
    onTicketUpdated(updated);
  };

  const handleRemoveTag = async (tagId) => {
    const newTagIds = (ticket.tags || []).filter(t => t.id !== tagId).map(t => t.id);
    const updated = await ticketsApi.updateTicket(ticket.id, { tag_ids: newTagIds });
    setTicket(prev => ({ ...prev, tags: updated.tags }));
    onTicketUpdated(updated);
  };

  const handleCreateNewTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const colors = ['#6366f1', '#ef4444', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const created = await tagsApi.createTag(ticket.project_id, {
      name: newTagName.trim(),
      color: randomColor
    });
    setAvailableTags(prev => [...prev, created]);
    await handleAddTag(created.id);
    setNewTagName('');
    setIsAddingTag(false);
  };

  const handleAddComment = async (content, parentId) => {
    await ticketsApi.addComment(ticket.id, content, parentId);
    await fetchTicket();
  };

  const handleDeleteComment = async (commentId) => {
    await ticketsApi.deleteComment(commentId);
    await fetchTicket();
  };

  const handleUploadAttachment = async (file) => {
    await ticketsApi.uploadAttachment(ticket.id, file);
    await fetchTicket();
  };

  const handleDeleteAttachment = async (attachmentId) => {
    await ticketsApi.deleteAttachment(attachmentId);
    await fetchTicket();
  };

  const handleLogWork = async (minutes, note) => {
    await ticketsApi.logWork(ticket.id, minutes, note);
    await fetchTicket();
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ticket ${ticket.key}?`)) {
      return;
    }
    await ticketsApi.deleteTicket(ticket.id);
    onTicketDeleted(ticket.id);
    onClose();
  };

  const canDeleteTicket = user?.role === 'admin' || user?.id === ticket?.reporter_id;
  const unselectedTags = availableTags.filter(t => !(ticket?.tags || []).some(tt => tt.id === t.id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ticket ? `${ticket.key}: ${ticket.title}` : 'Issue Details'}
      maxWidth="max-w-4xl"
    >
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm">Loading issue details...</span>
        </div>
      ) : ticket ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title */}
            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-base font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-indigo-400 dark:border-indigo-500 rounded-lg focus:outline-none ring-2 ring-indigo-500/20"
                    autoFocus
                  />
                  <button onClick={handleSaveTitle} className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditedTitle(ticket.title); setIsEditingTitle(false); }} className="p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between group">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">{ticket.title}</h2>
                  {canEdit && (
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-opacity ml-2 shrink-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Tags / Labels Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <TagIcon className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  <span>Labels & Tags</span>
                </span>
                {canEdit && (
                  <button
                    onClick={() => setIsAddingTag(!isAddingTag)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Manage Tags</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(ticket.tags || []).length === 0 ? (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">No tags attached.</span>
                ) : (
                  ticket.tags.map((tag) => (
                    <TagBadge
                      key={tag.id}
                      tag={tag}
                      onRemove={canEdit ? handleRemoveTag : null}
                    />
                  ))
                )}
              </div>

              {/* Tag Selection Dropdown */}
              {isAddingTag && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2 mt-2 transition-colors">
                  <div className="flex flex-wrap gap-1.5">
                    {unselectedTags.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleAddTag(t.id)}
                        className="hover:scale-105 transition-transform"
                      >
                        <TagBadge tag={t} />
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleCreateNewTag} className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <input
                      type="text"
                      placeholder="New label name..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={!newTagName.trim()}
                      className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                    >
                      Create
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Description with Markdown toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</span>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    {isEditingDesc ? (
                      <button
                        onClick={() => setDescPreviewMode(!descPreviewMode)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        {descPreviewMode ? <FileText className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{descPreviewMode ? 'Edit Mode' : 'Markdown Preview'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditingDesc(true)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  {descPreviewMode ? (
                    <div className="p-3 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 rounded-lg min-h-[100px]">
                      <MarkdownRenderer content={editedDesc} />
                    </div>
                  ) : (
                    <textarea
                      rows={5}
                      value={editedDesc}
                      onChange={(e) => setEditedDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-400 dark:border-indigo-500 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none ring-2 ring-indigo-500/20 resize-y font-mono text-xs"
                      placeholder="Add markdown description (supports # headers, **bold**, `code`, - [ ] checklists, @mentions)..."
                    />
                  )}
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => { setEditedDesc(ticket.description || ''); setIsEditingDesc(false); setDescPreviewMode(false); }}
                      className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDesc}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80 min-h-[70px] transition-colors">
                  {ticket.description ? (
                    <MarkdownRenderer content={ticket.description} />
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">No description provided.</p>
                  )}
                </div>
              )}
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-slate-200 dark:border-slate-800 pt-2">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'comments'
                      ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discussion ({(ticket.comments || []).length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('activity')}
                  className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'activity'
                      ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Audit Trail</span>
                </button>

                <button
                  onClick={() => setActiveTab('time')}
                  className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'time'
                      ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Time Tracking</span>
                </button>

                <button
                  onClick={() => setActiveTab('attachments')}
                  className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'attachments'
                      ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attachments ({(ticket.attachments || []).length})</span>
                </button>
              </nav>
            </div>

            {/* Tab Panes */}
            <div>
              {activeTab === 'comments' && (
                <CommentList
                  comments={ticket.comments || []}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  canComment={canEdit}
                />
              )}

              {activeTab === 'activity' && (
                <ActivityTrail activities={ticket.activities || []} />
              )}

              {activeTab === 'time' && (
                <WorkLogSection
                  worklogs={ticket.worklogs || []}
                  estimatedHours={ticket.estimated_hours}
                  totalLoggedMinutes={ticket.total_logged_minutes || 0}
                  onLogWork={handleLogWork}
                  canLog={canEdit}
                />
              )}

              {activeTab === 'attachments' && (
                <AttachmentSection
                  attachments={ticket.attachments || []}
                  onUpload={handleUploadAttachment}
                  onDelete={handleDeleteAttachment}
                  canUpload={canEdit}
                />
              )}
            </div>
          </div>

          {/* Right Meta Column */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 h-fit text-sm transition-colors">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Status</span>
              <select
                disabled={!canEdit}
                value={ticket.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Agile Sprint</span>
              <select
                disabled={!canEdit}
                value={ticket.sprint_id || -1}
                onChange={(e) => handleFieldChange('sprint_id', parseInt(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={-1}>Backlog (No Sprint)</option>
                {availableSprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Points</span>
                <select
                  disabled={!canEdit}
                  value={ticket.story_points || -1}
                  onChange={(e) => handleFieldChange('story_points', parseInt(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={-1}>None</option>
                  <option value={1}>1 pt</option>
                  <option value={2}>2 pts</option>
                  <option value={3}>3 pts</option>
                  <option value={5}>5 pts</option>
                  <option value={8}>8 pts</option>
                  <option value={13}>13 pts</option>
                </select>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Est. Hours</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  disabled={!canEdit}
                  value={ticket.estimated_hours || ''}
                  onChange={(e) => handleFieldChange('estimated_hours', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 8h"
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Priority</span>
              <select
                disabled={!canEdit}
                value={ticket.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="urgent">🔥 Urgent</option>
                <option value="high">🔺 High</option>
                <option value="medium">➖ Medium</option>
                <option value="low">🔻 Low</option>
              </select>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Issue Type</span>
              <select
                disabled={!canEdit}
                value={ticket.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="bug">🐛 Bug</option>
                <option value="task">📋 Task</option>
                <option value="feature">✨ Feature</option>
              </select>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Assignee</span>
              <select
                disabled={!canEdit}
                value={ticket.assignee_id || -1}
                onChange={(e) => handleFieldChange('assignee_id', parseInt(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={-1}>Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span>Reporter:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{ticket.reporter?.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Created:</span>
                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {canDeleteTicket && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleDeleteTicket}
                  className="w-full py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Issue</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
