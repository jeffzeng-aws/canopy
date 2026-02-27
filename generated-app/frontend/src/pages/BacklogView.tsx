import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, GripVertical, ChevronDown, ChevronRight, Filter, ArrowUpDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#f0ede8] dark:hover:bg-[#2a3144] cursor-pointer border-b border-[#E5E1DB]/50 dark:border-[#3D4556]/50 transition-colors group"
    >
      <GripVertical size={14} className="text-[#c4c0b8] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0" />
      <span style={{ color: issueTypeConfig[issue.type]?.color }} className="text-sm flex-shrink-0" title={issue.type}>
        {issueTypeConfig[issue.type]?.icon}
      </span>
      <span className="text-xs font-mono text-[#8896A6] w-16 flex-shrink-0">{issue.key}</span>
      <span className="text-sm text-[#2D3748] dark:text-[#E8ECF4] flex-1 truncate group-hover:text-[#D4A373] transition-colors">
        {issue.summary}
      </span>
      <span
        className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
        style={{ color: statusConfig[issue.status]?.color, backgroundColor: statusConfig[issue.status]?.bg }}
      >
        {statusConfig[issue.status]?.label || issue.status}
      </span>
      {issue.storyPoints != null && (
        <span className="text-[10px] bg-[#f0ede8] dark:bg-[#1A1F2E] text-[#5A6578] dark:text-[#A0AEC0] w-6 h-5 flex items-center justify-center rounded font-mono flex-shrink-0">
          {issue.storyPoints}
        </span>
      )}
      <span className="text-xs flex-shrink-0 w-5 text-center" style={{ color: priorityConfig[issue.priority]?.color }} title={issue.priority}>
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
  const progress = totalPoints > 0 ? (donePoints / totalPoints) * 100 : 0;

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden mb-3",
      sprint.status === 'active'
        ? "border-[#40916C]/40 dark:border-[#40916C]/30"
        : "border-[#E5E1DB] dark:border-[#3D4556]"
    )}>
      <div className={cn(
        "flex items-center gap-3 px-4 py-2.5",
        sprint.status === 'active'
          ? "bg-[#f0f8f3] dark:bg-[#1B4332]/20"
          : "bg-white dark:bg-[#242B3D]"
      )}>
        <button onClick={() => setCollapsed(!collapsed)} className="text-[#8896A6] hover:text-[#2D3748] dark:hover:text-[#E8ECF4] transition-colors">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
        <h3 className="font-display font-semibold text-sm text-[#2D3748] dark:text-[#E8ECF4]">{sprint.name}</h3>
        <span className={cn(
          'text-[10px] px-2 py-0.5 rounded-full font-medium',
          sprint.status === 'active' ? 'bg-[#e8f5e9] text-[#40916C]' :
          sprint.status === 'completed' ? 'bg-[#e3f2fd] text-[#2196F3]' :
          'bg-[#f0ede8] text-[#8896A6]'
        )}>
          {sprint.status}
        </span>
        <span className="text-xs text-[#8896A6]">{issues.length} issues</span>
        <span className="text-xs text-[#8896A6] font-mono">{donePoints}/{totalPoints} pts</span>
        {/* Mini progress bar */}
        {totalPoints > 0 && (
          <div className="w-16 bg-[#f0ede8] dark:bg-[#1A1F2E] rounded-full h-1.5">
            <div className="bg-[#40916C] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        <div className="flex-1" />
        {sprint.goal && (
          <span className="text-xs text-[#8896A6] italic hidden lg:block max-w-[200px] truncate" title={sprint.goal}>
            {sprint.goal}
          </span>
        )}
        {sprint.status === 'future' && (
          <button
            onClick={() => onUpdateSprint(sprint.id, { status: 'active' })}
            className="text-xs text-[#D4A373] hover:text-[#c49363] font-medium transition-colors"
          >
            Start Sprint
          </button>
        )}
        {sprint.status === 'active' && (
          <button
            onClick={() => onUpdateSprint(sprint.id, { status: 'completed' })}
            className="text-xs text-[#40916C] hover:text-[#2D6A4F] font-medium transition-colors"
          >
            Complete Sprint
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="bg-white dark:bg-[#242B3D]">
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
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'sortOrder' | 'priority' | 'created'>('sortOrder');

  React.useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const filteredIssues = useMemo(() => {
    if (!issues) return [];
    return issues.filter(issue => {
      if (filter) {
        const term = filter.toLowerCase();
        if (!issue.summary.toLowerCase().includes(term) &&
            !issue.key.toLowerCase().includes(term) &&
            !issue.type.toLowerCase().includes(term)) return false;
      }
      if (typeFilter !== 'all' && issue.type !== typeFilter) return false;
      if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
      return true;
    });
  }, [issues, filter, typeFilter, statusFilter]);

  const priorityOrder: Record<string, number> = { Highest: 0, High: 1, Medium: 2, Low: 3, Lowest: 4 };

  const sortIssues = (items: Issue[]) => {
    return [...items].sort((a, b) => {
      if (sortBy === 'priority') return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
      if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return a.sortOrder - b.sortOrder;
    });
  };

  const backlogIssues = useMemo(() => {
    return sortIssues(filteredIssues.filter(i => !i.sprintId));
  }, [filteredIssues, sortBy]);

  const sprintIssues = useMemo(() => {
    const map: Record<string, Issue[]> = {};
    sprints?.forEach(s => {
      map[s.id] = sortIssues(filteredIssues.filter(i => i.sprintId === s.id));
    });
    return map;
  }, [filteredIssues, sprints, sortBy]);

  const handleUpdateSprint = async (id: string, data: any) => {
    try {
      await api.sprints.update(id, data);
      showToast('success', data.status === 'active' ? 'Sprint started!' : 'Sprint completed!');
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
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
  const totalIssueCount = issues?.length || 0;
  const activeFilterCount = (typeFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  if (issuesLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3,4,5].map(i => <div key={i} className="h-10 animate-shimmer rounded" />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Backlog</h1>
          <span className="text-xs text-[#8896A6] bg-[#f0ede8] dark:bg-[#1A1F2E] px-2 py-0.5 rounded-full font-mono">
            {totalIssueCount} issues
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateSprint}
            className="flex items-center gap-1.5 border border-[#E5E1DB] dark:border-[#3D4556] hover:bg-[#f0ede8] dark:hover:bg-[#2a3144] rounded-md px-3 py-1.5 text-sm text-[#5A6578] dark:text-[#A0AEC0] transition-colors"
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

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8896A6]" />
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter issues by name, key, or type..."
            className="w-full pl-9 pr-3 py-1.5 border border-[#E5E1DB] dark:border-[#3D4556] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:text-[#E8ECF4] transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-1.5 border rounded-md px-3 py-1.5 text-sm transition-colors",
            showFilters || activeFilterCount > 0
              ? "border-[#D4A373] text-[#D4A373] bg-[#D4A373]/5"
              : "border-[#E5E1DB] dark:border-[#3D4556] text-[#8896A6] hover:text-[#5A6578]"
          )}
        >
          <Filter size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 bg-[#D4A373] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-1 border border-[#E5E1DB] dark:border-[#3D4556] rounded-md px-2 py-1">
          <ArrowUpDown size={12} className="text-[#8896A6]" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="text-xs bg-transparent border-0 text-[#5A6578] dark:text-[#A0AEC0] focus:outline-none cursor-pointer"
          >
            <option value="sortOrder">Manual order</option>
            <option value="priority">Priority</option>
            <option value="created">Newest first</option>
          </select>
        </div>
      </div>

      {/* Filter dropdowns */}
      {showFilters && (
        <div className="flex items-center gap-3 mb-4 bg-[#f8f6f2] dark:bg-[#1E2536] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#8896A6] font-medium">Type:</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="text-xs px-2 py-1 border border-[#E5E1DB] dark:border-[#3D4556] rounded bg-white dark:bg-[#242B3D] dark:text-[#E8ECF4] focus:outline-none focus:border-[#D4A373]"
            >
              <option value="all">All types</option>
              {Object.entries(issueTypeConfig).map(([type, cfg]) => (
                <option key={type} value={type}>{cfg.icon} {type}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#8896A6] font-medium">Status:</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs px-2 py-1 border border-[#E5E1DB] dark:border-[#3D4556] rounded bg-white dark:bg-[#242B3D] dark:text-[#E8ECF4] focus:outline-none focus:border-[#D4A373]"
            >
              <option value="all">All statuses</option>
              {Object.entries(statusConfig).map(([status, cfg]) => (
                <option key={status} value={status}>{cfg.label}</option>
              ))}
            </select>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setTypeFilter('all'); setStatusFilter('all'); }}
              className="text-xs text-[#D4A373] hover:text-[#c49363] font-medium ml-2"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Sprint sections */}
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

      {/* Backlog section */}
      <div className="border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-[#242B3D]">
          <h3 className="font-display font-semibold text-sm text-[#2D3748] dark:text-[#E8ECF4]">Backlog</h3>
          <span className="text-xs text-[#8896A6]">{backlogIssues.length} issues</span>
          <span className="text-xs text-[#8896A6] font-mono">{totalBacklogPoints} pts</span>
        </div>
        <div>
          {backlogIssues.map(issue => (
            <IssueRow key={issue.id} issue={issue} onClick={() => selectIssue(issue.id)} />
          ))}
          {backlogIssues.length === 0 && filteredIssues.length > 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-[#8896A6] text-sm">All matching issues are assigned to sprints</p>
            </div>
          )}
          {backlogIssues.length === 0 && filteredIssues.length === 0 && filter && (
            <div className="px-4 py-8 text-center">
              <p className="text-[#8896A6] text-sm">No issues match your filter</p>
              <button
                onClick={() => { setFilter(''); setTypeFilter('all'); setStatusFilter('all'); }}
                className="text-sm text-[#D4A373] hover:text-[#c49363] font-medium mt-2"
              >
                Clear filters
              </button>
            </div>
          )}
          {backlogIssues.length === 0 && !filter && typeFilter === 'all' && statusFilter === 'all' && (
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
