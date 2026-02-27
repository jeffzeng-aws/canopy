import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart3, TrendingUp, FileText } from 'lucide-react';
import { useSprints, useIssues } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { issueTypeConfig, priorityConfig, statusConfig } from '../lib/utils';

export function BurndownView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: sprints } = useSprints(projectId);
  const { data: issues } = useIssues(projectId);
  const { setCurrentProject } = useApp();

  React.useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const activeSprint = sprints?.find(s => s.status === 'active');
  const sprintIssues = issues?.filter(i => activeSprint && i.sprintId === activeSprint.id) || [];
  const totalPoints = sprintIssues.reduce((s, i) => s + (i.storyPoints || 0), 0);
  const donePoints = sprintIssues.filter(i => i.status === 'done').reduce((s, i) => s + (i.storyPoints || 0), 0);
  const remaining = totalPoints - donePoints;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Burndown Chart</h1>

      {activeSprint ? (
        <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-6">
          <h2 className="font-display font-semibold text-[#2D3748] dark:text-[#E8ECF4] mb-4">{activeSprint.name}</h2>
          <div className="flex gap-6 mb-6">
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">{totalPoints}</p>
              <p className="text-xs text-[#8896A6]">Total Points</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-[#40916C]">{donePoints}</p>
              <p className="text-xs text-[#8896A6]">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-[#D4A373]">{remaining}</p>
              <p className="text-xs text-[#8896A6]">Remaining</p>
            </div>
          </div>
          <div className="w-full bg-[#f0ede8] rounded-full h-4">
            <div
              className="bg-gradient-to-r from-[#40916C] to-[#2D6A4F] h-4 rounded-full transition-all duration-500"
              style={{ width: totalPoints > 0 ? `${(donePoints / totalPoints * 100)}%` : '0%' }}
            />
          </div>
          <p className="text-sm text-[#8896A6] mt-2 text-center">
            {totalPoints > 0 ? Math.round(donePoints / totalPoints * 100) : 0}% complete
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-12 text-center">
          <BarChart3 size={48} className="mx-auto text-[#8896A6] mb-4" />
          <p className="text-[#5A6578]">No active sprint. Start a sprint to see burndown data.</p>
        </div>
      )}
    </div>
  );
}

export function VelocityView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: sprints } = useSprints(projectId);
  const { setCurrentProject } = useApp();

  React.useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const completedSprints = sprints?.filter(s => s.status === 'completed') || [];
  const avgVelocity = completedSprints.length > 0
    ? Math.round(completedSprints.reduce((s, sp) => s + sp.velocity, 0) / completedSprints.length)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Velocity Chart</h1>

      {completedSprints.length > 0 ? (
        <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-center px-4">
              <p className="text-3xl font-display font-bold text-[#D4A373]">{avgVelocity}</p>
              <p className="text-xs text-[#8896A6]">Avg Velocity</p>
            </div>
            <div className="text-center px-4">
              <p className="text-3xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">{completedSprints.length}</p>
              <p className="text-xs text-[#8896A6]">Sprints Completed</p>
            </div>
          </div>

          <div className="flex items-end gap-2 h-48">
            {completedSprints.map((sprint, i) => {
              const maxVel = Math.max(...completedSprints.map(s => s.velocity), 1);
              const height = (sprint.velocity / maxVel) * 100;
              return (
                <div key={sprint.id} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-mono text-[#5A6578]">{sprint.velocity}</span>
                  <div
                    className="w-full bg-gradient-to-t from-[#1B4332] to-[#40916C] rounded-t-md transition-all duration-500"
                    style={{ height: `${height}%`, minHeight: '4px', animationDelay: `${i * 0.1}s` }}
                  />
                  <span className="text-xs text-[#8896A6] truncate w-full text-center">{sprint.name}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 border-t border-dashed border-[#8896A6] relative">
            <span className="absolute -top-2.5 left-0 text-xs text-[#D4A373] bg-white dark:bg-[#242B3D] px-1">
              Avg: {avgVelocity}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-12 text-center">
          <TrendingUp size={48} className="mx-auto text-[#8896A6] mb-4" />
          <p className="text-[#5A6578]">Complete sprints to see velocity data.</p>
        </div>
      )}
    </div>
  );
}

export function SprintReportView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: sprints } = useSprints(projectId);
  const { data: issues } = useIssues(projectId);
  const { setCurrentProject, selectIssue } = useApp();

  React.useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const [selectedSprint, setSelectedSprint] = React.useState<string>('');

  const sprint = sprints?.find(s => s.id === selectedSprint) || sprints?.find(s => s.status === 'active');
  const sprintIssues = issues?.filter(i => sprint && i.sprintId === sprint.id) || [];
  const completed = sprintIssues.filter(i => i.status === 'done');
  const notCompleted = sprintIssues.filter(i => i.status !== 'done');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Sprint Report</h1>
        {sprints && sprints.length > 0 && (
          <select
            value={selectedSprint || sprint?.id || ''}
            onChange={e => setSelectedSprint(e.target.value)}
            className="px-3 py-1.5 border border-[#E5E1DB] rounded-md text-sm dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
          >
            {sprints.map(s => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
          </select>
        )}
      </div>

      {sprint ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4 text-center">
              <p className="text-2xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">{sprintIssues.length}</p>
              <p className="text-xs text-[#8896A6]">Total Issues</p>
            </div>
            <div className="bg-white dark:bg-[#242B3D] border border-[#40916C] rounded-lg p-4 text-center">
              <p className="text-2xl font-display font-bold text-[#40916C]">{completed.length}</p>
              <p className="text-xs text-[#8896A6]">Completed</p>
            </div>
            <div className="bg-white dark:bg-[#242B3D] border border-[#D4A373] rounded-lg p-4 text-center">
              <p className="text-2xl font-display font-bold text-[#D4A373]">{notCompleted.length}</p>
              <p className="text-xs text-[#8896A6]">Remaining</p>
            </div>
          </div>

          {completed.length > 0 && (
            <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg">
              <h3 className="px-4 py-3 font-display font-semibold text-sm text-[#40916C] border-b border-[#E5E1DB] dark:border-[#3D4556]">
                Completed ({completed.length})
              </h3>
              {completed.map(issue => (
                <div key={issue.id} onClick={() => selectIssue(issue.id)} className="flex items-center gap-3 px-4 py-2 hover:bg-[#f0ede8] cursor-pointer border-b border-[#E5E1DB]/50 last:border-0 text-sm">
                  <span className="font-mono text-xs text-[#8896A6]">{issue.key}</span>
                  <span className="text-[#2D3748] dark:text-[#E8ECF4]">{issue.summary}</span>
                  {issue.storyPoints != null && (
                    <span className="ml-auto text-xs font-mono text-[#8896A6]">{issue.storyPoints} pts</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {notCompleted.length > 0 && (
            <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg">
              <h3 className="px-4 py-3 font-display font-semibold text-sm text-[#D4A373] border-b border-[#E5E1DB] dark:border-[#3D4556]">
                Not Completed ({notCompleted.length})
              </h3>
              {notCompleted.map(issue => (
                <div key={issue.id} onClick={() => selectIssue(issue.id)} className="flex items-center gap-3 px-4 py-2 hover:bg-[#f0ede8] cursor-pointer border-b border-[#E5E1DB]/50 last:border-0 text-sm">
                  <span className="font-mono text-xs text-[#8896A6]">{issue.key}</span>
                  <span className="text-[#2D3748] dark:text-[#E8ECF4]">{issue.summary}</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ color: statusConfig[issue.status]?.color, backgroundColor: statusConfig[issue.status]?.bg }}>
                    {statusConfig[issue.status]?.label || issue.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-12 text-center">
          <FileText size={48} className="mx-auto text-[#8896A6] mb-4" />
          <p className="text-[#5A6578]">No sprints yet. Create and complete a sprint to see reports.</p>
        </div>
      )}
    </div>
  );
}
