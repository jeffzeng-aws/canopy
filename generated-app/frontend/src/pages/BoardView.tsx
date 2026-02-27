import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Search } from 'lucide-react';
import { useIssues, useBoard, useUpdateIssue, useCreateIssue } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { issueTypeConfig, priorityConfig, statusConfig, cn } from '../lib/utils';
import { showToast } from '../components/ui/Toast';
import type { Issue, Board } from '@canopy/shared';

function IssueCard({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-3 cursor-pointer hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ color: issueTypeConfig[issue.type]?.color }} className="text-xs">
          {issueTypeConfig[issue.type]?.icon}
        </span>
        <span className="text-xs font-mono text-[#8896A6]">{issue.key}</span>
      </div>
      <p className="text-sm text-[#2D3748] dark:text-[#E8ECF4] font-medium line-clamp-2">{issue.summary}</p>
      <div className="flex items-center gap-2 mt-2">
        {issue.storyPoints != null && (
          <span className="text-xs bg-[#f0ede8] dark:bg-[#1A1F2E] text-[#5A6578] px-1.5 py-0.5 rounded font-mono">
            {issue.storyPoints}
          </span>
        )}
        <span
          className="text-xs ml-auto"
          style={{ color: priorityConfig[issue.priority]?.color }}
          title={issue.priority}
        >
          {priorityConfig[issue.priority]?.icon}
        </span>
      </div>
    </div>
  );
}

function BoardColumn({
  column,
  issues,
  onIssueClick,
  onQuickCreate,
}: {
  column: Board['columns'][0];
  issues: Issue[];
  onIssueClick: (id: string) => void;
  onQuickCreate: (status: string) => void;
}) {
  const statusColor = statusConfig[column.name.toLowerCase().replace(/ /g, '_')]?.color || column.color || '#8896A6';
  const totalPoints = issues.reduce((s, i) => s + (i.storyPoints || 0), 0);

  return (
    <div className="flex-shrink-0 w-[300px] flex flex-col bg-[#f5f3ef] dark:bg-[#1E2536] rounded-lg">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#E5E1DB] dark:border-[#3D4556]">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
        <h3 className="text-sm font-display font-semibold text-[#2D3748] dark:text-[#E8ECF4]">{column.name}</h3>
        <span className="text-xs text-[#8896A6] bg-white dark:bg-[#242B3D] px-1.5 py-0.5 rounded-full">{issues.length}</span>
        {column.wipLimit && issues.length > column.wipLimit && (
          <span className="text-xs text-[#BC6C25] font-semibold">WIP!</span>
        )}
        <button
          onClick={() => onQuickCreate(column.statusCategory)}
          className="ml-auto p-1 text-[#8896A6] hover:text-[#D4A373] transition-colors rounded hover:bg-white/50"
        >
          <Plus size={16} />
        </button>
      </div>

      <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-220px)]">
          {issues.map(issue => (
            <IssueCard key={issue.id} issue={issue} onClick={() => onIssueClick(issue.id)} />
          ))}
          {issues.length === 0 && (
            <div className="text-center py-8 text-sm text-[#8896A6]">No issues</div>
          )}
        </div>
      </SortableContext>

      {/* Column footer with point total */}
      {totalPoints > 0 && (
        <div className="px-3 py-1.5 border-t border-[#E5E1DB]/50 dark:border-[#3D4556]/50">
          <span className="text-[10px] font-mono text-[#8896A6]">{totalPoints} pts</span>
        </div>
      )}
    </div>
  );
}

export function BoardView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: issues, isLoading: issuesLoading } = useIssues(projectId);
  const { data: board, isLoading: boardLoading } = useBoard(projectId);
  const updateIssue = useUpdateIssue();
  const { selectIssue, toggleCreateModal, setCurrentProject } = useApp();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState('');

  React.useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const columns = useMemo(() => {
    if (!board?.columns) {
      return [
        { id: 'todo', name: 'To Do', statusCategory: 'todo' as const, sortOrder: 0 },
        { id: 'in_progress', name: 'In Progress', statusCategory: 'in_progress' as const, sortOrder: 1 },
        { id: 'in_review', name: 'In Review', statusCategory: 'in_progress' as const, sortOrder: 2 },
        { id: 'done', name: 'Done', statusCategory: 'done' as const, sortOrder: 3 },
      ];
    }
    return board.columns.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [board]);

  const filteredIssues = useMemo(() => {
    if (!issues) return null;
    if (!quickFilter) return issues;
    const q = quickFilter.toLowerCase();
    return issues.filter(i =>
      i.summary.toLowerCase().includes(q) ||
      i.key.toLowerCase().includes(q) ||
      i.type.toLowerCase().includes(q)
    );
  }, [issues, quickFilter]);

  const columnIssues = useMemo(() => {
    if (!filteredIssues) return {};
    const map: Record<string, Issue[]> = {};
    // Track which issues have been placed to avoid duplicates
    const placed = new Set<string>();

    columns.forEach(col => {
      const colSlug = col.name.toLowerCase().replace(/ /g, '_');
      map[col.id] = filteredIssues.filter(issue => {
        if (placed.has(issue.id)) return false;

        // Direct status match to column name slug
        if (issue.status === colSlug) {
          placed.add(issue.id);
          return true;
        }

        // Match by statusCategory only if no direct slug match found across all columns
        // For 'in_progress' category with multiple columns, only match specific ones
        if (col.statusCategory === 'in_progress') {
          if (col.name === 'In Progress' && issue.status === 'in_progress') { placed.add(issue.id); return true; }
          if (col.name === 'In Review' && issue.status === 'in_review') { placed.add(issue.id); return true; }
        }
        if (col.statusCategory === 'todo' && issue.status === 'todo' && colSlug === 'to_do') { placed.add(issue.id); return true; }
        if (col.statusCategory === 'done' && issue.status === 'done' && colSlug === 'done') { placed.add(issue.id); return true; }

        return false;
      }).sort((a, b) => a.sortOrder - b.sortOrder);
    });

    // Place any unmatched issues into the first column
    const placedAll = new Set(Object.values(map).flat().map(i => i.id));
    const unmatched = filteredIssues.filter(i => !placedAll.has(i.id));
    if (unmatched.length > 0 && columns.length > 0) {
      map[columns[0].id] = [...(map[columns[0].id] || []), ...unmatched];
    }

    return map;
  }, [filteredIssues, columns]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !issues) return;

    const issueId = active.id as string;
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    // Find which column the issue was dropped in
    let targetColumn = columns.find(col => col.id === over.id);
    if (!targetColumn) {
      // The "over" might be another issue - find its column
      const overIssue = issues.find(i => i.id === over.id);
      if (overIssue) {
        targetColumn = columns.find(col =>
          columnIssues[col.id]?.some(i => i.id === over.id)
        );
      }
    }

    if (targetColumn) {
      const newStatus = targetColumn.name.toLowerCase().replace(/ /g, '_');
      if (newStatus !== issue.status) {
        try {
          await updateIssue.mutateAsync({ id: issueId, data: { status: newStatus } });
          showToast('success', `Moved to ${targetColumn.name}`);
        } catch (err: any) {
          showToast('error', err.message);
        }
      }
    }
  };

  const activeIssue = activeId ? issues?.find(i => i.id === activeId) : null;

  if (issuesLoading || boardLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-shimmer rounded" />
        <div className="flex gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-[300px] h-[400px] animate-shimmer rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Board</h1>
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8896A6]" />
            <input
              type="text"
              value={quickFilter}
              onChange={e => setQuickFilter(e.target.value)}
              placeholder="Filter cards..."
              className="w-full pl-8 pr-3 py-1.5 border border-[#E5E1DB] dark:border-[#3D4556] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:text-[#E8ECF4] placeholder:text-[#8896A6] transition-colors"
            />
          </div>
        </div>
        <button
          onClick={toggleCreateModal}
          className="flex items-center gap-1.5 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-md px-3 py-1.5 text-sm font-medium transition-all flex-shrink-0"
        >
          <Plus size={16} /> Create Issue
        </button>
      </div>

      <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col, i) => (
            <div key={col.id} className="animate-fade-in" style={{ opacity: 0, animationDelay: `${i * 0.1}s` }}>
              <BoardColumn
                column={col as any}
                issues={columnIssues[col.id] || []}
                onIssueClick={id => selectIssue(id)}
                onQuickCreate={() => toggleCreateModal()}
              />
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeIssue && (
            <div className="bg-white border border-[#D4A373] rounded-lg p-3 shadow-lg rotate-2 w-[280px]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">{issueTypeConfig[activeIssue.type]?.icon}</span>
                <span className="text-xs font-mono text-[#8896A6]">{activeIssue.key}</span>
              </div>
              <p className="text-sm font-medium text-[#2D3748]">{activeIssue.summary}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
