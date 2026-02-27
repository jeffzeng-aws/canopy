import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCreateIssue, useSprints } from '../../hooks/useApi';
import { showToast } from '../ui/Toast';
import { issueTypeConfig, priorityConfig } from '../../lib/utils';
import type { IssueType, Priority } from '@canopy/shared';

export function CreateIssueModal() {
  const { state, dispatch } = useApp();
  const createIssue = useCreateIssue();
  const { data: sprints } = useSprints(state.currentProjectId || undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const [summary, setSummary] = useState('');
  const [type, setType] = useState<string>('Task');
  const [priority, setPriority] = useState<string>('Medium');
  const [description, setDescription] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [storyPoints, setStoryPoints] = useState('');
  const [labels, setLabels] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [createAnother, setCreateAnother] = useState(false);

  const close = () => dispatch({ type: 'SET_CREATE_MODAL', payload: false });

  // Cmd+Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim() || !state.currentProjectId) return;

    try {
      await createIssue.mutateAsync({
        projectId: state.currentProjectId,
        data: {
          type: type as IssueType,
          summary: summary.trim(),
          description: description || undefined,
          priority: priority as Priority,
          sprintId: sprintId || undefined,
          storyPoints: storyPoints ? parseFloat(storyPoints) : undefined,
          labels: labels ? labels.split(',').map(l => l.trim()).filter(Boolean) : undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        },
      });
      showToast('success', 'Issue created successfully');
      if (createAnother) {
        setSummary('');
        setDescription('');
        setStoryPoints('');
        setLabels('');
        setDueDate('');
      } else {
        close();
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create issue');
    }
  };

  const types = ['Epic', 'Story', 'Bug', 'Task', 'Sub-task'] as const;
  const priorities = ['Highest', 'High', 'Medium', 'Low', 'Lowest'] as const;

  return (
    <div data-testid="create-issue-modal-overlay" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" onClick={close}>
      <div
        data-testid="create-issue-modal"
        className="bg-white dark:bg-[#242B3D] rounded-xl shadow-2xl w-full max-w-lg p-6 animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Create Issue</h2>
          <button onClick={close} className="text-[#8896A6] hover:text-[#2D3748] transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {!state.currentProjectId && (
          <div className="mb-4 p-3 bg-[#BC6C25]/10 border border-[#BC6C25]/20 rounded-lg">
            <p className="text-sm text-[#BC6C25]">Please select a project first to create an issue.</p>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="w-1/3">
              <label className="block text-xs font-medium text-[#5A6578] mb-1 uppercase tracking-wider">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
              >
                {types.map(t => (
                  <option key={t} value={t}>{issueTypeConfig[t].icon} {t}</option>
                ))}
              </select>
            </div>
            <div className="w-2/3">
              <label className="block text-xs font-medium text-[#5A6578] mb-1 uppercase tracking-wider">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
              >
                {priorities.map(p => (
                  <option key={p} value={p}>{priorityConfig[p].icon} {p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A6578] mb-1 uppercase tracking-wider">Summary *</label>
            <input
              type="text"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A6578] mb-1 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={4}
              className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 resize-none dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#5A6578] mb-1 uppercase tracking-wider">Sprint</label>
              <select
                value={sprintId}
                onChange={e => setSprintId(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
              >
                <option value="">Backlog</option>
                {sprints?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-[#5A6578] mb-1 uppercase tracking-wider">Story Points</label>
              <input
                type="number"
                value={storyPoints}
                onChange={e => setStoryPoints(e.target.value)}
                placeholder="0"
                min="0.5"
                max="100"
                step="0.5"
                className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#5A6578] mb-1 uppercase tracking-wider">Labels</label>
              <input
                type="text"
                value={labels}
                onChange={e => setLabels(e.target.value)}
                placeholder="bug, frontend, urgent"
                className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
              />
              <p className="text-[10px] text-[#8896A6] mt-0.5">Comma-separated</p>
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-[#5A6578] mb-1 uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="createAnother"
              checked={createAnother}
              onChange={e => setCreateAnother(e.target.checked)}
              className="rounded border-[#E5E1DB] accent-[#D4A373]"
            />
            <label htmlFor="createAnother" className="text-sm text-[#5A6578]">Create another</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 px-4 py-2 border border-[#E5E1DB] rounded-md text-sm text-[#5A6578] hover:bg-[#f0ede8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!summary.trim() || createIssue.isPending || !state.currentProjectId}
              className="flex-1 px-4 py-2 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-md text-sm font-medium transition-all disabled:opacity-50"
            >
              {createIssue.isPending ? 'Creating...' : <>Create <span className="text-xs opacity-60 ml-1">⌘↵</span></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
