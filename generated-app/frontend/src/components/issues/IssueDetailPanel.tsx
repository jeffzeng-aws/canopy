import React, { useState, useEffect } from 'react';
import { X, Trash2, Clock, Zap, MessageSquare, Send, User, Tag, Calendar, Timer } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useIssue, useUpdateIssue, useDeleteIssue, useSprints, useAddComment } from '../../hooks/useApi';
import { showToast } from '../ui/Toast';
import { issueTypeConfig, priorityConfig, statusConfig, formatDate } from '../../lib/utils';
import { api } from '../../api/client';
import type { Comment } from '@canopy/shared';

export function IssueDetailPanel() {
  const { state, selectIssue } = useApp();
  const { data: issue, isLoading } = useIssue(state.selectedIssueId || undefined);
  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();
  const addComment = useAddComment();
  const { data: sprints } = useSprints(issue?.projectId);

  const [editSummary, setEditSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (issue) {
      setSummary(issue.summary);
      setDescription(issue.description || '');
      setShowDeleteConfirm(false);
      // Load comments
      const loadComments = async () => {
        try {
          // comments are localStorage-backed, fetch them directly
          const stored = localStorage.getItem(`canopy:comments`);
          if (stored) {
            const all: Comment[] = JSON.parse(stored);
            setComments(all.filter(c => c.issueId === issue.id).sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
          } else {
            setComments([]);
          }
        } catch {
          setComments([]);
        }
      };
      loadComments();
    }
  }, [issue]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') selectIssue(null);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectIssue]);

  const handleUpdateField = async (field: string, value: any) => {
    if (!issue) return;
    try {
      await updateIssue.mutateAsync({ id: issue.id, data: { [field]: value } });
      showToast('success', 'Issue updated');
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDelete = async () => {
    if (!issue) return;
    try {
      await deleteIssue.mutateAsync(issue.id);
      showToast('success', 'Issue deleted');
      selectIssue(null);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleAddComment = async () => {
    if (!issue || !commentBody.trim()) return;
    try {
      const newComment = await api.comments.add(issue.id, { body: commentBody.trim() });
      setComments(prev => [newComment, ...prev]);
      setCommentBody('');
      showToast('success', 'Comment added');
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const close = () => selectIssue(null);

  const statuses = Object.keys(statusConfig);
  const types = ['Epic', 'Story', 'Bug', 'Task', 'Sub-task'] as const;
  const priorities = ['Highest', 'High', 'Medium', 'Low', 'Lowest'] as const;

  // Compute time tracking info
  const timeSpentHrs = issue?.timeSpent ? Math.round(issue.timeSpent / 60 * 10) / 10 : 0;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/10 z-30"
        onClick={close}
      />
      <div data-testid="issue-detail-panel" className="fixed top-14 right-0 bottom-0 w-[680px] max-w-[calc(100vw-60px)] bg-white dark:bg-[#242B3D] shadow-[-4px_0_24px_rgba(0,0,0,0.12)] z-40 flex flex-col animate-slide-in-right overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#D4A373] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : issue ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E5E1DB] dark:border-[#3D4556] bg-[#f8f6f2] dark:bg-[#1E2536]">
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
                style={{ color: issueTypeConfig[issue.type]?.color, backgroundColor: `${issueTypeConfig[issue.type]?.color}15` }}
              >
                {issueTypeConfig[issue.type]?.icon} {issue.type}
              </span>
              <span
                className="font-mono text-sm text-[#8896A6] cursor-pointer hover:text-[#D4A373] transition-colors"
                onClick={() => { navigator.clipboard.writeText(issue.key); showToast('info', 'Copied issue key'); }}
                title="Click to copy"
              >
                {issue.key}
              </span>
              <div className="flex-1" />
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 text-[#8896A6] hover:text-[#BC6C25] transition-colors" title="Delete issue">
                  <Trash2 size={16} />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button onClick={handleDelete} className="text-[10px] font-medium px-2 py-1 bg-[#BC6C25] text-white rounded hover:bg-[#a55e20] transition-colors">
                    Confirm Delete
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="text-[10px] text-[#8896A6] hover:text-[#2D3748] px-1.5 py-1">
                    Cancel
                  </button>
                </div>
              )}
              <button onClick={close} className="p-1.5 text-[#8896A6] hover:text-[#2D3748] dark:hover:text-[#E8ECF4] transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Title + Status */}
              <div className="p-5 pb-0">
                {editSummary ? (
                  <input
                    type="text"
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    onBlur={() => { handleUpdateField('summary', summary); setEditSummary(false); }}
                    onKeyDown={e => { if (e.key === 'Enter') { handleUpdateField('summary', summary); setEditSummary(false); } }}
                    autoFocus
                    className="w-full text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4] border-b-2 border-[#D4A373] focus:outline-none bg-transparent pb-1"
                  />
                ) : (
                  <h2
                    onClick={() => setEditSummary(true)}
                    className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4] cursor-pointer hover:text-[#D4A373] transition-colors leading-tight"
                  >
                    {issue.summary}
                  </h2>
                )}

                {/* Status badges row */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={issue.status}
                    onChange={e => handleUpdateField('status', e.target.value)}
                    className="px-3 py-1.5 rounded-md text-sm font-medium border-0 cursor-pointer appearance-none"
                    style={{
                      color: statusConfig[issue.status]?.color || '#8896A6',
                      backgroundColor: statusConfig[issue.status]?.bg || '#f0ede8',
                    }}
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{statusConfig[s]?.label || s}</option>
                    ))}
                  </select>

                  <select
                    value={issue.priority}
                    onChange={e => handleUpdateField('priority', e.target.value)}
                    className="px-3 py-1.5 rounded-md text-sm font-medium border border-[#E5E1DB] dark:border-[#3D4556] cursor-pointer bg-white dark:bg-[#1A1F2E] dark:text-[#E8ECF4]"
                  >
                    {priorities.map(p => <option key={p} value={p}>{priorityConfig[p]?.icon} {p}</option>)}
                  </select>

                  {issue.storyPoints != null && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-[#52796F] bg-[#e8f5e9] dark:bg-[#1B4332] dark:text-[#A3B18A] px-2 py-1 rounded-md">
                      <Zap size={10} /> {issue.storyPoints} pts
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="p-5">
                <label className="block text-xs font-semibold text-[#8896A6] uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onBlur={() => handleUpdateField('description', description)}
                  placeholder="Add a description..."
                  rows={5}
                  className="w-full px-3 py-2 border border-[#E5E1DB] rounded-lg text-sm focus:outline-none focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373]/20 resize-none dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4] transition-colors"
                />
              </div>

              {/* Details Grid */}
              <div className="px-5 pb-5">
                <h3 className="text-xs font-semibold text-[#8896A6] uppercase tracking-wider mb-3">Details</h3>
                <div className="bg-[#f8f6f2] dark:bg-[#1A1F2E] rounded-lg divide-y divide-[#E5E1DB] dark:divide-[#3D4556]">
                  {/* Type */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-[#8896A6] w-28">Type</span>
                    <select
                      value={issue.type}
                      onChange={e => handleUpdateField('type', e.target.value)}
                      className="flex-1 px-2 py-1 rounded text-sm bg-transparent border-0 cursor-pointer dark:text-[#E8ECF4] focus:outline-none"
                    >
                      {types.map(t => <option key={t} value={t}>{issueTypeConfig[t]?.icon} {t}</option>)}
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-[#8896A6] w-28">Priority</span>
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: priorityConfig[issue.priority]?.color }}>
                      {priorityConfig[issue.priority]?.icon} {issue.priority}
                    </span>
                  </div>

                  {/* Story Points */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-[#8896A6] w-28">Story Points</span>
                    <input
                      type="number"
                      value={issue.storyPoints ?? ''}
                      onChange={e => handleUpdateField('storyPoints', e.target.value ? parseFloat(e.target.value) : undefined)}
                      min="0.5"
                      max="100"
                      step="0.5"
                      placeholder="Unestimated"
                      className="flex-1 px-2 py-1 rounded text-sm bg-transparent border-0 dark:text-[#E8ECF4] focus:outline-none"
                    />
                  </div>

                  {/* Sprint */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-[#8896A6] w-28">Sprint</span>
                    <select
                      value={issue.sprintId || ''}
                      onChange={e => handleUpdateField('sprintId', e.target.value || undefined)}
                      className="flex-1 px-2 py-1 rounded text-sm bg-transparent border-0 cursor-pointer dark:text-[#E8ECF4] focus:outline-none"
                    >
                      <option value="">No sprint</option>
                      {sprints?.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.status === 'active' ? '●' : s.status === 'completed' ? '✓' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assignee */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-[#8896A6] w-28 flex items-center gap-1"><User size={10} /> Assignee</span>
                    <input
                      type="text"
                      value={issue.assigneeId || ''}
                      onChange={e => handleUpdateField('assigneeId', e.target.value || undefined)}
                      placeholder="Unassigned"
                      className="flex-1 px-2 py-1 rounded text-sm bg-transparent border-0 dark:text-[#E8ECF4] focus:outline-none"
                    />
                  </div>

                  {/* Labels */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-[#8896A6] w-28 flex items-center gap-1"><Tag size={10} /> Labels</span>
                    <div className="flex-1 flex flex-wrap gap-1">
                      {issue.labels && issue.labels.length > 0 ? (
                        issue.labels.map((label: string) => (
                          <span key={label} className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-[#D4A373]/15 text-[#D4A373]">
                            {label}
                            <button onClick={() => handleUpdateField('labels', issue.labels.filter((l: string) => l !== label))} className="ml-0.5 hover:text-[#BC6C25]">×</button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#c4c0b8]">No labels</span>
                      )}
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-[#8896A6] w-28 flex items-center gap-1"><Calendar size={10} /> Due Date</span>
                    <input
                      type="date"
                      value={issue.dueDate ? new Date(issue.dueDate).toISOString().slice(0, 10) : ''}
                      onChange={e => handleUpdateField('dueDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                      className="flex-1 px-2 py-1 rounded text-sm bg-transparent border-0 dark:text-[#E8ECF4] focus:outline-none cursor-pointer"
                    />
                  </div>

                  {/* Time Estimate */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-[#8896A6] w-28 flex items-center gap-1"><Timer size={10} /> Estimate</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={issue.timeEstimate ?? ''}
                        onChange={e => handleUpdateField('timeEstimate', e.target.value ? parseInt(e.target.value) : undefined)}
                        min="0"
                        step="15"
                        placeholder="—"
                        className="w-20 px-2 py-1 rounded text-sm bg-transparent border-0 dark:text-[#E8ECF4] focus:outline-none"
                      />
                      <span className="text-xs text-[#8896A6]">min</span>
                    </div>
                  </div>

                  {/* Time Tracking */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-[#8896A6] w-28 flex items-center gap-1"><Clock size={10} /> Time Spent</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={issue.timeSpent ?? ''}
                        onChange={e => handleUpdateField('timeSpent', e.target.value ? parseInt(e.target.value) : 0)}
                        min="0"
                        step="15"
                        placeholder="0"
                        className="w-20 px-2 py-1 rounded text-sm bg-transparent border-0 dark:text-[#E8ECF4] focus:outline-none"
                      />
                      <span className="text-xs text-[#8896A6]">min {timeSpentHrs > 0 && `(${timeSpentHrs}h)`}</span>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="mt-4 flex items-center gap-6 text-xs text-[#8896A6]">
                  <span>Created {formatDate(issue.createdAt)}</span>
                  <span>Updated {formatDate(issue.updatedAt)}</span>
                </div>
              </div>

              {/* Comments / Activity */}
              <div className="px-5 pb-5 border-t border-[#E5E1DB] dark:border-[#3D4556] pt-4">
                <h3 className="text-xs font-semibold text-[#8896A6] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MessageSquare size={12} /> Comments {comments.length > 0 && `(${comments.length})`}
                </h3>

                {/* Add Comment */}
                <div className="flex gap-2 mb-4">
                  <div className="w-7 h-7 rounded-full bg-[#D4A373] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    U
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={commentBody}
                      onChange={e => setCommentBody(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment(); }}
                      placeholder="Write a comment..."
                      rows={2}
                      className="w-full px-3 py-2 border border-[#E5E1DB] rounded-lg text-sm focus:outline-none focus:border-[#D4A373] resize-none dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-[#c4c0b8]">⌘ + Enter to submit</span>
                      <button
                        onClick={handleAddComment}
                        disabled={!commentBody.trim()}
                        className="flex items-center gap-1 text-xs font-medium text-[#D4A373] hover:text-[#c49363] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send size={12} /> Send
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                {comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map(comment => (
                      <div key={comment.id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#52796F] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                          U
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-[#2D3748] dark:text-[#E8ECF4]">User</span>
                            <span className="text-[10px] text-[#8896A6]">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-[#5A6578] dark:text-[#A0AEC0] whitespace-pre-wrap break-words">{comment.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#c4c0b8] text-center py-3">No comments yet. Be the first to add one!</p>
                )}
              </div>
            </div>

            {/* Footer with keyboard hint */}
            <div className="px-5 py-2 border-t border-[#E5E1DB] dark:border-[#3D4556] bg-[#f8f6f2] dark:bg-[#1E2536] flex items-center gap-4">
              <span className="text-[10px] text-[#8896A6]">
                Press <kbd className="px-1 py-0.5 bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded text-[9px] font-mono">Esc</kbd> to close
              </span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#8896A6]">Issue not found</div>
        )}
      </div>
    </>
  );
}
