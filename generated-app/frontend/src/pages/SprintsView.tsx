import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Play, CheckCircle, Calendar, Target } from 'lucide-react';
import { useSprints, useIssues, useCreateSprint } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { showToast } from '../components/ui/Toast';
import { cn, formatDate, statusConfig } from '../lib/utils';
import type { Sprint } from '@canopy/shared';

export function SprintsView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: sprints, isLoading, refetch } = useSprints(projectId);
  const { data: issues } = useIssues(projectId);
  const { setCurrentProject, selectIssue, toggleCreateModal } = useApp();
  const createSprint = useCreateSprint();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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
        <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Sprints</h1>
        <button
          onClick={handleCreateSprint}
          className="flex items-center gap-1.5 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-md px-3 py-1.5 text-sm font-medium transition-all"
        >
          <Plus size={16} /> New Sprint
        </button>
      </div>

      {activeSprints.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#8896A6] uppercase tracking-wider mb-3">Active</h2>
          {activeSprints.map(sprint => {
            const sprintIssues = getSprintIssues(sprint.id);
            const totalPts = sprintIssues.reduce((s, i) => s + (i.storyPoints || 0), 0);
            const donePts = sprintIssues.filter(i => i.status === 'done').reduce((s, i) => s + (i.storyPoints || 0), 0);
            const progress = totalPts > 0 ? (donePts / totalPts * 100) : 0;

            return (
              <div key={sprint.id} className="bg-white dark:bg-[#242B3D] border border-[#40916C] rounded-lg p-5 mb-3">
                <div className="flex items-center gap-3 mb-3">
                  <Play size={16} className="text-[#40916C]" />
                  <h3 className="font-display font-semibold text-[#2D3748] dark:text-[#E8ECF4]">{sprint.name}</h3>
                  <span className="text-xs bg-[#e8f5e9] text-[#40916C] px-2 py-0.5 rounded-full font-medium">Active</span>
                  <div className="flex-1" />
                  <button
                    onClick={() => handleUpdateSprint(sprint.id, { status: 'completed' })}
                    className="text-xs text-[#40916C] hover:text-[#2D6A4F] font-medium flex items-center gap-1"
                  >
                    <CheckCircle size={14} /> Complete Sprint
                  </button>
                </div>
                {sprint.goal && <p className="text-sm text-[#5A6578] mb-3">{sprint.goal}</p>}
                <div className="flex items-center gap-4 text-xs text-[#8896A6] mb-3">
                  <span>{sprintIssues.length} issues</span>
                  <span>{donePts}/{totalPts} story points</span>
                  {sprint.startDate && <span><Calendar size={12} className="inline mr-1" />{formatDate(sprint.startDate)}</span>}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {Object.entries(
                      sprintIssues.reduce<Record<string, number>>((acc, i) => {
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
                </div>
                <div className="w-full bg-[#f0ede8] dark:bg-[#1A1F2E] rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-[#40916C] to-[#2D6A4F] h-2.5 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })}
        </section>
      )}

      {futureSprints.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#8896A6] uppercase tracking-wider mb-3">Planned</h2>
          {futureSprints.map(sprint => {
            const sprintIssues = getSprintIssues(sprint.id);
            return (
              <div key={sprint.id} className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4 mb-3">
                <div className="flex items-center gap-3">
                  <Target size={16} className="text-[#8896A6]" />
                  <h3 className="font-display font-semibold text-[#2D3748] dark:text-[#E8ECF4] text-sm">{sprint.name}</h3>
                  <span className="text-xs text-[#8896A6]">{sprintIssues.length} issues</span>
                  <div className="flex-1" />
                  <button
                    onClick={() => handleUpdateSprint(sprint.id, { status: 'active' })}
                    className="text-xs text-[#D4A373] hover:text-[#c49363] font-medium"
                  >
                    Start Sprint
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {completedSprints.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#8896A6] uppercase tracking-wider mb-3">Completed</h2>
          {completedSprints.map(sprint => (
            <div key={sprint.id} className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4 mb-3 opacity-70">
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-[#40916C]" />
                <h3 className="font-display font-semibold text-[#2D3748] dark:text-[#E8ECF4] text-sm">{sprint.name}</h3>
                <span className="text-xs text-[#8896A6]">Velocity: {sprint.velocity} pts</span>
                <span className="text-xs text-[#8896A6]">{formatDate(sprint.completedAt)}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {(!sprints || sprints.length === 0) && (
        <div className="text-center py-16">
          <Target size={48} className="mx-auto text-[#8896A6] mb-4" />
          <p className="text-[#5A6578] mb-4">No sprints yet. Create a sprint to start planning.</p>
          <button onClick={handleCreateSprint} className="text-[#D4A373] hover:text-[#c49363] font-medium">
            Create Sprint
          </button>
        </div>
      )}
    </div>
  );
}
