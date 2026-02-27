import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Play, CheckCircle, Calendar, Target, Edit3, X } from 'lucide-react';
import { useSprints, useIssues, useCreateSprint } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { showToast } from '../components/ui/Toast';
import { cn, formatDate, statusConfig } from '../lib/utils';
import type { Sprint } from '@canopy/shared';

function SprintCard({
  sprint,
  issues,
  onUpdate,
  onIssueClick,
}: {
  sprint: Sprint;
  issues: any[];
  onUpdate: (id: string, data: any) => void;
  onIssueClick: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(sprint.name);
  const [editGoal, setEditGoal] = useState(sprint.goal || '');
  const [editStart, setEditStart] = useState(sprint.startDate ? sprint.startDate.slice(0, 10) : '');
  const [editEnd, setEditEnd] = useState(sprint.endDate ? sprint.endDate.slice(0, 10) : '');
  const [expanded, setExpanded] = useState(sprint.status === 'active');

  const totalPts = issues.reduce((s: number, i: any) => s + (i.storyPoints || 0), 0);
  const donePts = issues.filter((i: any) => i.status === 'done').reduce((s: number, i: any) => s + (i.storyPoints || 0), 0);
  const progress = totalPts > 0 ? (donePts / totalPts * 100) : 0;

  const handleSaveEdit = () => {
    onUpdate(sprint.id, {
      name: editName,
      goal: editGoal || undefined,
      startDate: editStart ? new Date(editStart).toISOString() : undefined,
      endDate: editEnd ? new Date(editEnd).toISOString() : undefined,
    });
    setEditing(false);
  };

  const isActive = sprint.status === 'active';
  const isFuture = sprint.status === 'future';
  const isCompleted = sprint.status === 'completed';

  return (
    <div className={cn(
      "bg-white dark:bg-[#242B3D] border rounded-lg mb-3 overflow-hidden transition-all",
      isActive ? "border-[#40916C]" : "border-[#E5E1DB] dark:border-[#3D4556]",
      isCompleted && "opacity-70"
    )}>
      {/* Header */}
      <div className={cn(
        "px-5 py-4",
        isActive && "bg-[#40916C]/5"
      )}>
        <div className="flex items-center gap-3 mb-2">
          {isActive ? (
            <Play size={16} className="text-[#40916C] flex-shrink-0" />
          ) : isCompleted ? (
            <CheckCircle size={16} className="text-[#40916C] flex-shrink-0" />
          ) : (
            <Target size={16} className="text-[#8896A6] flex-shrink-0" />
          )}

          {editing ? (
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="font-display font-semibold text-[#2D3748] dark:text-[#E8ECF4] bg-transparent border-b-2 border-[#D4A373] focus:outline-none"
              autoFocus
            />
          ) : (
            <h3 className="font-display font-semibold text-[#2D3748] dark:text-[#E8ECF4]">{sprint.name}</h3>
          )}

          <span className={cn(
            'text-[10px] px-2 py-0.5 rounded-full font-medium',
            isActive ? 'bg-[#e8f5e9] text-[#40916C]' :
            isCompleted ? 'bg-[#e3f2fd] text-[#2196F3]' :
            'bg-[#f0ede8] text-[#8896A6]'
          )}>
            {sprint.status === 'future' ? 'Planned' : sprint.status}
          </span>

          <div className="flex-1" />

          {!isCompleted && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1 text-[#8896A6] hover:text-[#D4A373] transition-colors"
              title="Edit sprint"
            >
              <Edit3 size={14} />
            </button>
          )}

          {editing && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSaveEdit}
                className="text-[10px] font-medium px-2 py-1 bg-[#D4A373] text-white rounded hover:bg-[#c49363] transition-colors"
              >
                Save
              </button>
              <button onClick={() => setEditing(false)} className="p-1 text-[#8896A6] hover:text-[#2D3748]">
                <X size={14} />
              </button>
            </div>
          )}

          {isFuture && !editing && (
            <button
              onClick={() => onUpdate(sprint.id, { status: 'active' })}
              className="text-xs text-[#D4A373] hover:text-[#c49363] font-medium transition-colors"
            >
              Start Sprint
            </button>
          )}
          {isActive && !editing && (
            <button
              onClick={() => onUpdate(sprint.id, { status: 'completed' })}
              className="text-xs text-[#40916C] hover:text-[#2D6A4F] font-medium flex items-center gap-1 transition-colors"
            >
              <CheckCircle size={14} /> Complete Sprint
            </button>
          )}
        </div>

        {/* Edit form for dates and goal */}
        {editing && (
          <div className="ml-7 space-y-2 mt-3 mb-2">
            <div>
              <label className="text-[10px] text-[#8896A6] uppercase tracking-wider">Goal</label>
              <input
                type="text"
                value={editGoal}
                onChange={e => setEditGoal(e.target.value)}
                placeholder="Sprint goal..."
                className="w-full px-2 py-1.5 border border-[#E5E1DB] dark:border-[#3D4556] rounded text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:text-[#E8ECF4]"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-[#8896A6] uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={editStart}
                  onChange={e => setEditStart(e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#E5E1DB] dark:border-[#3D4556] rounded text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:text-[#E8ECF4]"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-[#8896A6] uppercase tracking-wider">End Date</label>
                <input
                  type="date"
                  value={editEnd}
                  onChange={e => setEditEnd(e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#E5E1DB] dark:border-[#3D4556] rounded text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:text-[#E8ECF4]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sprint goal display */}
        {!editing && sprint.goal && (
          <p className="text-sm text-[#5A6578] ml-7 mb-2">{sprint.goal}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-[#8896A6] ml-7">
          <span>{issues.length} issues</span>
          <span>{donePts}/{totalPts} story points</span>
          {sprint.startDate && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(sprint.startDate)}
              {sprint.endDate && ` → ${formatDate(sprint.endDate)}`}
            </span>
          )}
          {isActive && (
            <div className="flex items-center gap-1.5 ml-auto">
              {Object.entries(
                issues.reduce<Record<string, number>>((acc, i: any) => {
                  acc[i.status] = (acc[i.status] || 0) + 1;
                  return acc;
                }, {})
              ).map(([status, count]) => (
                <span
                  key={status}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{ color: statusConfig[status]?.color, backgroundColor: statusConfig[status]?.bg }}
                >
                  {statusConfig[status]?.label || status} {count}
                </span>
              ))}
            </div>
          )}
          {isCompleted && sprint.velocity != null && (
            <span className="ml-auto font-mono">Velocity: {sprint.velocity} pts</span>
          )}
        </div>

        {/* Progress bar for active/future sprints */}
        {!isCompleted && totalPts > 0 && (
          <div className="w-full bg-[#f0ede8] dark:bg-[#1A1F2E] rounded-full h-2 mt-3 ml-7 pr-7">
            <div
              className="bg-gradient-to-r from-[#40916C] to-[#2D6A4F] h-2 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Issue list (expanded for active sprints) */}
      {isActive && expanded && issues.length > 0 && (
        <div className="border-t border-[#E5E1DB] dark:border-[#3D4556]">
          {issues.slice(0, 10).map((issue: any) => (
            <button
              key={issue.id}
              onClick={() => onIssueClick(issue.id)}
              className="w-full flex items-center gap-3 px-5 py-2 text-sm hover:bg-[#f0ede8] dark:hover:bg-[#2a3144] transition-colors text-left border-b border-[#E5E1DB]/30 dark:border-[#3D4556]/30 last:border-0"
            >
              <span className="text-xs font-mono text-[#8896A6] w-14">{issue.key}</span>
              <span className="text-[#2D3748] dark:text-[#E8ECF4] truncate flex-1">{issue.summary}</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                style={{ color: statusConfig[issue.status]?.color, backgroundColor: statusConfig[issue.status]?.bg }}
              >
                {statusConfig[issue.status]?.label || issue.status}
              </span>
              {issue.storyPoints != null && (
                <span className="text-[10px] font-mono text-[#8896A6] w-5 text-center">{issue.storyPoints}</span>
              )}
            </button>
          ))}
          {issues.length > 10 && (
            <div className="px-5 py-2 text-xs text-[#8896A6] text-center">
              +{issues.length - 10} more issues
            </div>
          )}
        </div>
      )}

      {isActive && !expanded && issues.length > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-xs text-[#D4A373] hover:text-[#c49363] py-2 border-t border-[#E5E1DB]/50 dark:border-[#3D4556]/50 transition-colors"
        >
          Show {issues.length} issues
        </button>
      )}

      {isActive && expanded && issues.length > 0 && (
        <button
          onClick={() => setExpanded(false)}
          className="w-full text-xs text-[#8896A6] hover:text-[#5A6578] py-2 border-t border-[#E5E1DB]/50 dark:border-[#3D4556]/50 transition-colors"
        >
          Hide issues
        </button>
      )}
    </div>
  );
}

export function SprintsView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: sprints, isLoading, refetch } = useSprints(projectId);
  const { data: issues } = useIssues(projectId);
  const { setCurrentProject, selectIssue, toggleCreateModal } = useApp();
  const createSprint = useCreateSprint();

  React.useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const handleCreateSprint = async () => {
    if (!projectId) return;
    const name = `Sprint ${(sprints?.length || 0) + 1}`;
    try {
      await createSprint.mutateAsync({ projectId, data: { name } });
      showToast('success', 'Sprint created');
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleUpdateSprint = async (id: string, data: any) => {
    try {
      await api.sprints.update(id, data);
      showToast('success', 'Sprint updated');
      refetch();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const getSprintIssues = (sprintId: string) => {
    return issues?.filter(i => i.sprintId === sprintId) || [];
  };

  if (isLoading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 animate-shimmer rounded-lg" />)}</div>;
  }

  const activeSprints = sprints?.filter(s => s.status === 'active') || [];
  const futureSprints = sprints?.filter(s => s.status === 'future') || [];
  const completedSprints = sprints?.filter(s => s.status === 'completed') || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Sprints</h1>
          <p className="text-xs text-[#8896A6] mt-0.5">
            {activeSprints.length} active · {futureSprints.length} planned · {completedSprints.length} completed
          </p>
        </div>
        <button
          onClick={handleCreateSprint}
          className="flex items-center gap-1.5 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-md px-3 py-1.5 text-sm font-medium transition-all"
        >
          <Plus size={16} /> New Sprint
        </button>
      </div>

      {activeSprints.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#40916C] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Play size={14} /> Active
          </h2>
          {activeSprints.map(sprint => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              issues={getSprintIssues(sprint.id)}
              onUpdate={handleUpdateSprint}
              onIssueClick={id => selectIssue(id)}
            />
          ))}
        </section>
      )}

      {futureSprints.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#8896A6] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Target size={14} /> Planned
          </h2>
          {futureSprints.map(sprint => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              issues={getSprintIssues(sprint.id)}
              onUpdate={handleUpdateSprint}
              onIssueClick={id => selectIssue(id)}
            />
          ))}
        </section>
      )}

      {completedSprints.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#8896A6] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CheckCircle size={14} /> Completed
          </h2>
          {completedSprints.map(sprint => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              issues={getSprintIssues(sprint.id)}
              onUpdate={handleUpdateSprint}
              onIssueClick={id => selectIssue(id)}
            />
          ))}
        </section>
      )}

      {(!sprints || sprints.length === 0) && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#f0ede8] dark:bg-[#1A1F2E] flex items-center justify-center">
            <Target size={32} className="text-[#8896A6]" />
          </div>
          <h3 className="text-lg font-display font-bold text-[#2D3748] dark:text-[#E8ECF4] mb-2">No sprints yet</h3>
          <p className="text-[#5A6578] text-sm mb-4">Create a sprint to start planning your work in timeboxed iterations.</p>
          <button
            onClick={handleCreateSprint}
            className="inline-flex items-center gap-2 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-lg px-4 py-2 text-sm font-medium transition-all"
          >
            <Plus size={16} /> Create Sprint
          </button>
        </div>
      )}
    </div>
  );
}
