import React, { useState, useEffect } from 'react';
import { X, Copy, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useIssue, useUpdateIssue, useDeleteIssue } from '../../hooks/useApi';
import { showToast } from '../ui/Toast';
import { issueTypeConfig, priorityConfig, statusConfig, formatDate } from '../../lib/utils';

export function IssueDetailPanel() {
  const { state, selectIssue } = useApp();
  const { data: issue, isLoading } = useIssue(state.selectedIssueId || undefined);
  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();

  const [editSummary, setEditSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (issue) {
      setSummary(issue.summary);
      setDescription(issue.description || '');
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

  const close = () => selectIssue(null);

  const statuses = Object.keys(statusConfig);
  const types = ['Epic', 'Story', 'Bug', 'Task', 'Sub-task'] as const;
  const priorities = ['Highest', 'High', 'Medium', 'Low', 'Lowest'] as const;

  return (
    <div className="fixed top-14 right-0 bottom-0 w-[680px] bg-white dark:bg-[#242B3D] shadow-[-4px_0_24px_rgba(0,0,0,0.1)] z-40 flex flex-col animate-slide-in-right overflow-hidden">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#D4A373] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : issue ? (
        <>
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E5E1DB] dark:border-[#3D4556]">
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
            <button onClick={handleDelete} className="p-1.5 text-[#8896A6] hover:text-[#BC6C25] transition-colors" title="Delete">
              <Trash2 size={16} />
            </button>
            <button onClick={close} className="p-1.5 text-[#8896A6] hover:text-[#2D3748] transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-5">
              {editSummary ? (
                <input
                  type="text"
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  onBlur={() => { handleUpdateField('summary', summary); setEditSummary(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') { handleUpdateField('summary', summary); setEditSummary(false); } }}
                  autoFocus
                  className="w-full text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4] border-b-2 border-[#D4A373] focus:outline-none bg-transparent"
                />
              ) : (
                <h2
                  onClick={() => setEditSummary(true)}
                  className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4] cursor-pointer hover:text-[#D4A373] transition-colors"
                >
                  {issue.summary}
                </h2>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <select
                  value={issue.status}
                  onChange={e => handleUpdateField('status', e.target.value)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium border-0 cursor-pointer"
                  style={{
                    color: statusConfig[issue.status]?.color || '#8896A6',
                    backgroundColor: statusConfig[issue.status]?.bg || '#f0ede8',
                  }}
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{statusConfig[s]?.label || s}</option>
                  ))}
                </select>
              </div>

              <div className="mt-6">
                <label className="block text-xs font-semibold text-[#8896A6] uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onBlur={() => handleUpdateField('description', description)}
                  placeholder="Add a description..."
                  rows={6}
                  className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] resize-none dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
                />
              </div>
            </div>

            <div className="px-5 pb-5 border-t border-[#E5E1DB] dark:border-[#3D4556] pt-4">
              <h3 className="text-xs font-semibold text-[#8896A6] uppercase tracking-wider mb-3">Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8896A6] mb-1">Type</label>
                  <select
                    value={issue.type}
                    onChange={e => handleUpdateField('type', e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#E5E1DB] rounded text-sm dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
                  >
                    {types.map(t => <option key={t} value={t}>{issueTypeConfig[t]?.icon} {t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#8896A6] mb-1">Priority</label>
                  <select
                    value={issue.priority}
                    onChange={e => handleUpdateField('priority', e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#E5E1DB] rounded text-sm dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
                  >
                    {priorities.map(p => <option key={p} value={p}>{priorityConfig[p]?.icon} {p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#8896A6] mb-1">Story Points</label>
                  <input
                    type="number"
                    value={issue.storyPoints ?? ''}
                    onChange={e => handleUpdateField('storyPoints', e.target.value ? parseFloat(e.target.value) : undefined)}
                    min="0.5"
                    max="100"
                    step="0.5"
                    className="w-full px-2 py-1.5 border border-[#E5E1DB] rounded text-sm dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8896A6] mb-1">Status</label>
                  <select
                    value={issue.status}
                    onChange={e => handleUpdateField('status', e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#E5E1DB] rounded text-sm dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
                  >
                    {statuses.map(s => <option key={s} value={s}>{statusConfig[s]?.label || s}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E1DB] dark:border-[#3D4556] text-xs text-[#8896A6]">
                <p>Created {formatDate(issue.createdAt)}</p>
                <p>Updated {formatDate(issue.updatedAt)}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#8896A6]">Issue not found</div>
      )}
    </div>
  );
}
