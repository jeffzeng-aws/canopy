import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Map, Calendar } from 'lucide-react';
import { useIssues } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { issueTypeConfig, statusConfig, formatDate } from '../lib/utils';

export function RoadmapView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: issues, isLoading } = useIssues(projectId);
  const { setCurrentProject, selectIssue } = useApp();

  React.useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const epics = useMemo(() => {
    if (!issues) return [];
    return issues.filter(i => i.type === 'Epic');
  }, [issues]);

  const getChildIssues = (epicId: string) => {
    return issues?.filter(i => i.epicId === epicId) || [];
  };

  if (isLoading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 animate-shimmer rounded-lg" />)}</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Roadmap</h1>

      {epics.length > 0 ? (
        <div className="space-y-3">
          {epics.map(epic => {
            const children = getChildIssues(epic.id);
            const done = children.filter(c => c.status === 'done').length;
            const progress = children.length > 0 ? Math.round(done / children.length * 100) : 0;

            return (
              <div
                key={epic.id}
                onClick={() => selectIssue(epic.id)}
                className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm" style={{ color: issueTypeConfig.Epic.color }}>
                    {issueTypeConfig.Epic.icon}
                  </span>
                  <span className="font-mono text-xs text-[#8896A6]">{epic.key}</span>
                  <span className="font-display font-semibold text-sm text-[#2D3748] dark:text-[#E8ECF4] group-hover:text-[#D4A373] transition-colors">
                    {epic.summary}
                  </span>
                  <div className="flex-1" />
                  <span className="text-xs text-[#8896A6]">{done}/{children.length} done</span>
                </div>
                <div className="w-full bg-[#f0ede8] dark:bg-[#1A1F2E] rounded-full h-2">
                  <div
                    className="bg-[#9B59B6] h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {epic.dueDate && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-[#8896A6]">
                    <Calendar size={12} /> Due {formatDate(epic.dueDate)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-12 text-center">
          <Map size={48} className="mx-auto text-[#8896A6] mb-4" />
          <p className="text-[#5A6578] mb-2">No epics yet</p>
          <p className="text-sm text-[#8896A6]">Create Epic-type issues to see them on the roadmap.</p>
        </div>
      )}
    </div>
  );
}
