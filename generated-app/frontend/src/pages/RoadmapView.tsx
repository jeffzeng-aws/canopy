import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Map, Calendar, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { useIssues, useSprints } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { issueTypeConfig, statusConfig, formatDate, cn } from '../lib/utils';
import type { Issue } from '@canopy/shared';

// Timeline helpers
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatWeek(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function getIssueTimeRange(issue: Issue): { start: Date; end: Date } | null {
  const created = new Date(issue.createdAt);
  const durationDays = Math.max(7, (issue.storyPoints || 3) * 3);

  if (issue.status === 'done') {
    const end = new Date(issue.updatedAt);
    const start = addDays(end, -durationDays);
    return { start, end };
  }

  const start = created;
  const end = addDays(start, durationDays);
  return { start, end };
}

interface EpicRow {
  epic: Issue;
  children: Issue[];
  timeRange: { start: Date; end: Date } | null;
}

export function RoadmapView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: issues, isLoading } = useIssues(projectId);
  const { data: sprints } = useSprints(projectId);
  const { setCurrentProject, selectIssue } = useApp();
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  React.useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const toggleEpic = (epicId: string) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(epicId)) next.delete(epicId);
      else next.add(epicId);
      return next;
    });
  };

  const { epicRows, timelineRange, weekHeaders, orphanIssues } = useMemo(() => {
    if (!issues) return { epicRows: [], timelineRange: null, weekHeaders: [], orphanIssues: [] };

    const epics = issues.filter(i => i.type === 'Epic');
    const nonEpics = issues.filter(i => i.type !== 'Epic');

    const rows: EpicRow[] = epics.map(epic => {
      const children = nonEpics.filter(i => i.epicId === epic.id);
      const allItems = [epic, ...children];
      const ranges = allItems.map(getIssueTimeRange).filter(Boolean) as { start: Date; end: Date }[];
      let timeRange: { start: Date; end: Date } | null = null;
      if (ranges.length > 0) {
        timeRange = {
          start: new Date(Math.min(...ranges.map(r => r.start.getTime()))),
          end: new Date(Math.max(...ranges.map(r => r.end.getTime()))),
        };
      }
      return { epic, children, timeRange };
    });

    const epicIds = new Set(epics.map(e => e.id));
    const orphans = nonEpics.filter(i => !i.epicId || !epicIds.has(i.epicId));

    const allRanges = rows.map(r => r.timeRange).filter(Boolean) as { start: Date; end: Date }[];
    const orphanRanges = orphans.map(getIssueTimeRange).filter(Boolean) as { start: Date; end: Date }[];
    const combinedRanges = [...allRanges, ...orphanRanges];

    let tlRange: { start: Date; end: Date } | null = null;
    if (combinedRanges.length > 0) {
      const minDate = new Date(Math.min(...combinedRanges.map(r => r.start.getTime())));
      const maxDate = new Date(Math.max(...combinedRanges.map(r => r.end.getTime())));
      tlRange = {
        start: addDays(getWeekStart(minDate), -7),
        end: addDays(maxDate, 14),
      };
    }

    const weeks: Date[] = [];
    if (tlRange) {
      let current = getWeekStart(tlRange.start);
      while (current <= tlRange.end) {
        weeks.push(new Date(current));
        current = addDays(current, 7);
      }
    }

    return { epicRows: rows, timelineRange: tlRange, weekHeaders: weeks, orphanIssues: orphans };
  }, [issues]);

  const getBarStyle = (range: { start: Date; end: Date } | null) => {
    if (!range || !timelineRange) return { left: '0%', width: '0%', display: 'none' as const };
    const totalDays = daysBetween(timelineRange.start, timelineRange.end);
    if (totalDays <= 0) return { left: '0%', width: '0%', display: 'none' as const };

    const startOffset = Math.max(0, daysBetween(timelineRange.start, range.start));
    const duration = Math.max(1, daysBetween(range.start, range.end));

    const left = (startOffset / totalDays) * 100;
    const width = Math.min((duration / totalDays) * 100, 100 - left);

    return { left: `${left}%`, width: `${Math.max(width, 1)}%` };
  };

  const getStatusBar = (issue: Issue) => {
    if (issue.status === 'done') return 100;
    if (issue.status === 'in_progress' || issue.status === 'in_review') return 50;
    return 0;
  };

  const getBarColor = (issue: Issue): string => {
    return issueTypeConfig[issue.type]?.color || '#8896A6';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 animate-shimmer rounded-lg" />)}
      </div>
    );
  }

  const monthGroups = (() => {
    const groups: { month: string; weeks: number }[] = [];
    let currentMonth = '';
    weekHeaders.forEach(w => {
      const m = formatMonth(w);
      if (m !== currentMonth) {
        groups.push({ month: m, weeks: 1 });
        currentMonth = m;
      } else {
        groups[groups.length - 1].weeks++;
      }
    });
    return groups;
  })();

  const todayOffset = timelineRange
    ? Math.max(0, daysBetween(timelineRange.start, new Date())) / daysBetween(timelineRange.start, timelineRange.end) * 100
    : -1;

  const renderTimelineRow = (issue: Issue, indent: boolean = false) => {
    const range = getIssueTimeRange(issue);
    const barStyle = getBarStyle(range);
    const color = getBarColor(issue);
    const statusPct = getStatusBar(issue);

    return (
      <div key={issue.id} className="flex border-b border-[#E5E1DB] dark:border-[#3D4556] hover:bg-[#f8f6f2] dark:hover:bg-[#2a3144] transition-colors group">
        <div
          className={cn(
            "w-[320px] min-w-[320px] flex items-center gap-2 px-3 py-2.5 border-r border-[#E5E1DB] dark:border-[#3D4556] cursor-pointer",
            indent && "pl-10"
          )}
          onClick={() => selectIssue(issue.id)}
        >
          {issue.type === 'Epic' && (
            <button
              onClick={e => { e.stopPropagation(); toggleEpic(issue.id); }}
              className="p-0.5 text-[#8896A6] hover:text-[#2D3748] dark:hover:text-[#E8ECF4]"
            >
              {expandedEpics.has(issue.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
          <span className="text-xs" style={{ color }}>{issueTypeConfig[issue.type]?.icon}</span>
          <span className="font-mono text-[10px] text-[#8896A6] flex-shrink-0">{issue.key}</span>
          <span className="text-xs text-[#2D3748] dark:text-[#E8ECF4] truncate group-hover:text-[#D4A373] transition-colors font-medium">
            {issue.summary}
          </span>
          <div className="flex-1" />
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ color: statusConfig[issue.status]?.color, backgroundColor: statusConfig[issue.status]?.bg }}
          >
            {statusConfig[issue.status]?.label}
          </span>
        </div>
        <div className="flex-1 relative min-h-[40px]">
          {barStyle.display !== 'none' && (
            <div
              className="absolute top-1/2 -translate-y-1/2 h-6 rounded-md transition-all group-hover:h-7 group-hover:shadow-sm"
              style={{
                left: barStyle.left,
                width: barStyle.width,
                backgroundColor: `${color}25`,
                border: `1px solid ${color}50`,
              }}
            >
              <div
                className="h-full rounded-md transition-all"
                style={{
                  width: `${statusPct}%`,
                  backgroundColor: `${color}60`,
                }}
              />
              {issue.storyPoints && (
                <span
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold"
                  style={{ color }}
                >
                  {issue.storyPoints}sp
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Roadmap</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#f0ede8] dark:bg-[#1A1F2E] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                viewMode === 'timeline' ? "bg-white dark:bg-[#242B3D] text-[#2D3748] dark:text-[#E8ECF4] shadow-sm" : "text-[#8896A6]"
              )}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                viewMode === 'list' ? "bg-white dark:bg-[#242B3D] text-[#2D3748] dark:text-[#E8ECF4] shadow-sm" : "text-[#8896A6]"
              )}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {epicRows.length === 0 && orphanIssues.length === 0 ? (
        <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-12 text-center">
          <Map size={48} className="mx-auto text-[#8896A6] mb-4" />
          <p className="text-[#5A6578] mb-2">No epics yet</p>
          <p className="text-sm text-[#8896A6]">Create Epic-type issues to see them on the roadmap.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {epicRows.map(({ epic, children }) => {
            const done = children.filter(c => c.status === 'done').length;
            const progress = children.length > 0 ? Math.round(done / children.length * 100) : 0;
            return (
              <div key={epic.id} className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg overflow-hidden">
                <div
                  onClick={() => selectIssue(epic.id)}
                  className="p-4 cursor-pointer hover:bg-[#f8f6f2] dark:hover:bg-[#2a3144] transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={e => { e.stopPropagation(); toggleEpic(epic.id); }} className="p-0.5">
                      {expandedEpics.has(epic.id) ? <ChevronDown size={14} className="text-[#8896A6]" /> : <ChevronRight size={14} className="text-[#8896A6]" />}
                    </button>
                    <span className="text-sm" style={{ color: issueTypeConfig.Epic.color }}>{issueTypeConfig.Epic.icon}</span>
                    <span className="font-mono text-xs text-[#8896A6]">{epic.key}</span>
                    <span className="font-display font-semibold text-sm text-[#2D3748] dark:text-[#E8ECF4] hover:text-[#D4A373] transition-colors">{epic.summary}</span>
                    <div className="flex-1" />
                    <span className="text-xs text-[#8896A6]">{done}/{children.length} done</span>
                  </div>
                  <div className="w-full bg-[#f0ede8] dark:bg-[#1A1F2E] rounded-full h-2 ml-7">
                    <div className="bg-[#9B59B6] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                {expandedEpics.has(epic.id) && children.length > 0 && (
                  <div className="border-t border-[#E5E1DB] dark:border-[#3D4556] divide-y divide-[#E5E1DB] dark:divide-[#3D4556]">
                    {children.map(child => (
                      <div
                        key={child.id}
                        onClick={() => selectIssue(child.id)}
                        className="flex items-center gap-3 px-4 py-2.5 pl-12 cursor-pointer hover:bg-[#f8f6f2] dark:hover:bg-[#2a3144] transition-colors"
                      >
                        <span className="text-xs" style={{ color: issueTypeConfig[child.type]?.color }}>{issueTypeConfig[child.type]?.icon}</span>
                        <span className="font-mono text-xs text-[#8896A6]">{child.key}</span>
                        <span className="text-sm text-[#2D3748] dark:text-[#E8ECF4] flex-1">{child.summary}</span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded"
                          style={{ color: statusConfig[child.status]?.color, backgroundColor: statusConfig[child.status]?.bg }}
                        >
                          {statusConfig[child.status]?.label}
                        </span>
                        {child.storyPoints && <span className="text-xs font-mono text-[#8896A6]">{child.storyPoints}sp</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg overflow-hidden">
          {/* Timeline header */}
          <div className="flex border-b border-[#E5E1DB] dark:border-[#3D4556]">
            <div className="w-[320px] min-w-[320px] px-3 py-2 border-r border-[#E5E1DB] dark:border-[#3D4556]">
              <span className="text-xs font-semibold text-[#8896A6] uppercase tracking-wider">Issue</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex border-b border-[#E5E1DB] dark:border-[#3D4556]">
                {monthGroups.map((mg, i) => (
                  <div
                    key={i}
                    className="text-[10px] font-semibold text-[#5A6578] dark:text-[#A0AEC0] px-2 py-1 border-r border-[#E5E1DB] dark:border-[#3D4556]"
                    style={{ width: `${(mg.weeks / weekHeaders.length) * 100}%` }}
                  >
                    {mg.month}
                  </div>
                ))}
              </div>
              <div className="flex">
                {weekHeaders.map((w, i) => (
                  <div
                    key={i}
                    className="text-[9px] text-[#8896A6] px-1 py-1 border-r border-[#f0ede8] dark:border-[#2a3144] text-center"
                    style={{ width: `${100 / weekHeaders.length}%` }}
                  >
                    {formatWeek(w)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline rows */}
          <div className="relative">
            {todayOffset >= 0 && todayOffset <= 100 && (
              <div
                className="absolute top-0 bottom-0 w-px bg-[#D4A373] z-10 pointer-events-none"
                style={{ left: `calc(320px + (100% - 320px) * ${todayOffset / 100})` }}
              >
                <div className="absolute -top-0.5 -left-[14px] bg-[#D4A373] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-b">
                  TODAY
                </div>
              </div>
            )}

            {epicRows.map(({ epic, children }) => (
              <React.Fragment key={epic.id}>
                {renderTimelineRow(epic)}
                {expandedEpics.has(epic.id) && children.map(child => renderTimelineRow(child, true))}
              </React.Fragment>
            ))}

            {orphanIssues.length > 0 && (
              <>
                <div className="flex border-b border-[#E5E1DB] dark:border-[#3D4556] bg-[#f0ede8] dark:bg-[#1A1F2E]">
                  <div className="w-[320px] min-w-[320px] px-3 py-1.5 border-r border-[#E5E1DB] dark:border-[#3D4556]">
                    <span className="text-[10px] font-semibold text-[#8896A6] uppercase tracking-wider">Unassigned Issues</span>
                  </div>
                  <div className="flex-1" />
                </div>
                {orphanIssues.slice(0, 10).map(issue => renderTimelineRow(issue, true))}
                {orphanIssues.length > 10 && (
                  <div className="flex border-b border-[#E5E1DB] dark:border-[#3D4556]">
                    <div className="w-[320px] min-w-[320px] px-3 py-2 border-r border-[#E5E1DB] dark:border-[#3D4556] pl-10">
                      <span className="text-xs text-[#8896A6]">+ {orphanIssues.length - 10} more issues</span>
                    </div>
                    <div className="flex-1" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-3 py-2 border-t border-[#E5E1DB] dark:border-[#3D4556] bg-[#f8f6f2] dark:bg-[#1E2536]">
            <span className="text-[10px] text-[#8896A6] font-medium">Legend:</span>
            {Object.entries(issueTypeConfig).map(([type, cfg]) => (
              <span key={type} className="flex items-center gap-1 text-[10px]" style={{ color: cfg.color }}>
                <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: `${cfg.color}40`, border: `1px solid ${cfg.color}70` }} />
                {type}
              </span>
            ))}
            <span className="flex items-center gap-1 text-[10px] text-[#D4A373]">
              <span className="w-px h-3 bg-[#D4A373]" />
              Today
            </span>
          </div>
        </div>
      )}

      {/* Sprint timeline info */}
      {sprints && sprints.length > 0 && (
        <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4">
          <h3 className="text-xs font-semibold text-[#8896A6] uppercase tracking-wider mb-3">Sprint Timeline</h3>
          <div className="space-y-2">
            {sprints.map(sprint => {
              const isActive = sprint.status === 'active';
              return (
                <div key={sprint.id} className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    isActive ? "bg-[#40916C]" : sprint.status === 'completed' ? "bg-[#8896A6]" : "bg-[#D4A373]"
                  )} />
                  <span className="text-sm font-medium text-[#2D3748] dark:text-[#E8ECF4] w-24">{sprint.name}</span>
                  <span className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded",
                    isActive ? "bg-[#e8f5e9] text-[#40916C]" : sprint.status === 'completed' ? "bg-[#f0ede8] text-[#8896A6]" : "bg-[#fef9e7] text-[#D4A373]"
                  )}>
                    {sprint.status}
                  </span>
                  {sprint.startDate && (
                    <span className="text-xs text-[#8896A6] flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(sprint.startDate)}
                      {sprint.endDate && ` → ${formatDate(sprint.endDate)}`}
                    </span>
                  )}
                  {sprint.goal && <span className="text-xs text-[#5A6578] italic truncate">{sprint.goal}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
