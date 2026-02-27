import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { useIssues, useSprints, useUpdateIssue, useCreateSprint } from '../hooks/useApi';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { issueTypeConfig, priorityConfig, statusConfig, cn, formatDate } from '../lib/utils';
import { showToast } from '../components/ui/Toast';
import type { Issue, Sprint } from '@canopy/shared';

function IssueRow({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 hover:bg-[#f0ede8] dark:hover:bg-[#2a3144] cursor-pointer border-b border-[#E5E1DB]/50 dark:border-[#3D4556]/50 transition-colors group"
    >
      <GripVertical size={14} className="text-[#8896A6] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
      <span style={{ color: issueTypeConfig[issue.type]?.color }} className="text-sm flex-shrink-0">
        {issueTypeConfig[issue.type]?.icon}
      </span>
      <span className="text-xs font-mono text-[#8896A6] w-20 flex-shrink-0">{issue.key}</span>
      <span className="text-sm text-[#2D3748] dark:text-[#E8ECF4] flex-1 truncate">{issue.summary}</span>
      <span
        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ color: statusConfig[issue.status]?.color, backgroundColor: statusConfig[issue.status]?.bg }}
      >
        {statusConfig[issue.status]?.label || issue.status}
      </span>
      {issue.storyPoints != null && (
        <span className="text-xs bg-[#f0ede8] dark:bg-[#1A1F2E] text-[#5A6578] px-1.5 py-0.5 rounded font-mono flex-shrink-0">
          {issue.storyPoints}
        </span>
      )}
      <span className="text-xs flex-shrink-0" style={{ color: priorityConfig[issue.priority]?.color }}>
        {priorityConfig[issue.priority]?.icon}
      </span>
    </div>
  );
}

function SprintSection({
  sprint,
  issues,
  onIssueClick,
  onUpdateSprint,
}: {
  sprint: Sprint;
  issues: Issue[];
  onIssueClick: (id: string) => void;
  onUpdateSprint: (id: string, data: any) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const donePoints = issues.filter(i => i.status === 'done').reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  return (
    <div className="border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg overflow-hidden mb-3">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-[#242B3D]">
        <button onClick={() => setCollapsed(!collapsed)} className="text-[#8896A6]">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
        <h3 className="font-display font-semibold text-sm text-[#2D3748] dark:text-[#E8ECF4]">{sprint.name}</h3>
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full font-medium',
          sprint.status === 'active' ? 'bg-[#e8f5e9] text-[#40916C]' :
          sprint.status === 'completed' ? 'bg-[#e3f2fd] text-[#2196F3]' :
          'bg-[#f0ede8] text-[#8896A6]'
        )}>
          {sprint.status}
        </span>
        <span className="text-xs text-[#8896A6]">{issues.length} issues</span>
        <span className="text-xs text-[#8896A6]">{donePoints}/{totalPoints} pts</span>
        <div className="flex-1" />
        {sprint.status === 'future' && (
          <button
            onClick={() => onUpdateSprint(sprint.id, { status: 'active' })}
            className="text-xs text-[#D4A373] hover:text-[#c49363] font-medium"
          >
            Start Sprint
          </button>
        )}
        {sprint.status === 'active' && (
          <button
            onClick={() => onUpdateSprint(sprint.id, { status: 'completed' })}
            className="text-xs text-[#40916C] hover:text-[#2D6A4F] font-medium"
          >
            Complete Sprint
          </button>
        )}
      </div>

      {!collapsed && (
        <div>
          {issues.map(issue => (
            <IssueRow key={issue.id} issue={issue} onClick={() => onIssueClick(issue.id)} />
          ))}
          {issues.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-[#8896A6]">
              No issues in this sprint. Drag issues here to plan.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BacklogView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: issues, isLoading: issuesLoading } = useIssues(projectId);
  const { data: sprints } = useSprints(projectId);
  const { selectIssue, toggleCreateModal, setCurrentProject } = useApp();
  const updateIssue = useUpdateIssue();
  const createSprintMutation = useCreateSprint();
  const [filter, setFilter] = useState('');

  React.useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const filteredIssues = useMemo(() => {
    if (!issues) return [];
    return issues.filter(issue => {
      if (!filter) return true;
      const term = filter.toLowerCase();
      return issue.summary.toLowerCase().includes(term) ||
        issue.key.toLowerCase().includes(term) ||
        issue.type.toLowerCase().includes(term);
    });
  }, [issues, filter]);

  const backlogIssues = useMemo(() => {
    return filteredIssues.filter(i => !i.sprintId).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [filteredIssues]);

  const sprintIssues = useMemo(() => {
    const map: Record<string, Issue[]> = {};
    sprints?.forEach(s => {
      map[s.id] = filteredIssues.filter(i => i.sprintId === s.id);
    });
    return map;
  }, [filteredIssues, sprints]);

  const handleUpdateSprint = async (id: string, data: any) => {
    try {
      await api.sprints.update(id, data);
      showToast('success', data.status === 'active' ? 'Sprint started!' : 'Sprint completed!');
      window.location.reload();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleCreateSprint = async () => {
    if (!projectId) return;
    const name = `Sprint ${(sprints?.length || 0) + 1}`;
    try {
      await createSprintMutation.mutateAsync({ projectId, data: { name } });
      showToast('success', 'Sprint created');
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const totalBacklogPoints = backlogIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  if (issuesLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3,4,5].map(i => <div key={i} className="h-10 animate-shimmer rounded" />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Backlog</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8896A6]" />
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter issues..."
              className="pl-9 pr-3 py-1.5 border border-[#E5E1DB] rounded-md text-sm w-64 focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
            />
          </div>
          <button
            onClick={handleCreateSprint}
            className="flex items-center gap-1.5 border border-[#E5E1DB] hover:bg-[#f0ede8] rounded-md px-3 py-1.5 text-sm text-[#5A6578] transition-colors"
          >
            <Plus size={14} /> Sprint
          </button>
          <button
            onClick={toggleCreateModal}
            className="flex items-center gap-1.5 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-md px-3 py-1.5 text-sm font-medium transition-all"
          >
            <Plus size={16} /> Issue
          </button>
        </div>
      </div>

      {sprints?.filter(s => s.status !== 'completed').sort((a, b) => {
        if (a.status === 'active') return -1;
        if (b.status === 'active') return 1;
        return 0;
      }).map(sprint => (
        <SprintSection
          key={sprint.id}
          sprint={sprint}
          issues={sprintIssues[sprint.id] || []}
          onIssueClick={id => selectIssue(id)}
          onUpdateSprint={handleUpdateSprint}
        />
      ))}

      <div className="border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-[#242B3D]">
          <h3 className="font-display font-semibold text-sm text-[#2D3748] dark:text-[#E8ECF4]">Backlog</h3>
          <span className="text-xs text-[#8896A6]">{backlogIssues.length} issues</span>
          <span className="text-xs text-[#8896A6]">{totalBacklogPoints} pts</span>
        </div>
        <div>
          {backlogIssues.map(issue => (
            <IssueRow key={issue.id} issue={issue} onClick={() => selectIssue(issue.id)} />
          ))}
          {backlogIssues.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-[#8896A6] text-sm mb-3">Your backlog is empty</p>
              <button
                onClick={toggleCreateModal}
                className="text-sm text-[#D4A373] hover:text-[#c49363] font-medium"
              >
                Create your first issue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
