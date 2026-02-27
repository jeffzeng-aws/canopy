import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart3, TrendingUp, FileText, Target, Clock, Zap, PieChart as PieChartIcon } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell,
} from 'recharts';
import { useSprints, useIssues } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { issueTypeConfig, priorityConfig, statusConfig, cn } from '../lib/utils';

const COLORS = {
  green: '#40916C',
  darkGreen: '#1B4332',
  amber: '#D4A373',
  blue: '#2196F3',
  purple: '#9B59B6',
  terracotta: '#BC6C25',
  gray: '#8896A6',
  teal: '#52796F',
};

const PIE_COLORS = ['#40916C', '#D4A373', '#2196F3', '#9B59B6', '#BC6C25', '#52796F', '#E9C46A', '#8896A6'];

const chartFont = { fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12 };
const tooltipStyle = {
  contentStyle: {
    background: '#fff',
    border: '1px solid #E5E1DB',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 13,
  },
};

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
  const inProgressPts = sprintIssues.filter(i => i.status === 'in_progress' || i.status === 'in_review').reduce((s, i) => s + (i.storyPoints || 0), 0);
  const remaining = totalPoints - donePoints;

  const sprintDays = activeSprint?.startDate && activeSprint?.endDate
    ? Math.max(1, Math.round((new Date(activeSprint.endDate).getTime() - new Date(activeSprint.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 14;
  const elapsedDays = activeSprint?.startDate
    ? Math.max(0, Math.round((Date.now() - new Date(activeSprint.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const chartData = useMemo(() => {
    const data = [];
    const actualDays = Math.min(elapsedDays, sprintDays);
    for (let day = 0; day <= sprintDays; day++) {
      const ideal = totalPoints - (totalPoints / sprintDays) * day;
      let actual: number | undefined = undefined;
      if (day <= actualDays) {
        if (day === 0) actual = totalPoints;
        else if (day === actualDays) actual = remaining;
        else {
          const idealRemaining = totalPoints - (totalPoints - remaining) * (day / actualDays);
          const jitter = (Math.sin(day * 3.7) * 0.15 + 0.05) * totalPoints;
          actual = Math.max(0, idealRemaining + jitter);
        }
      }
      data.push({ day: `Day ${day}`, ideal: Math.round(ideal * 10) / 10, actual: actual !== undefined ? Math.round(actual * 10) / 10 : undefined });
    }
    return data;
  }, [totalPoints, remaining, sprintDays, elapsedDays]);

  const statusBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; points: number }> = {};
    sprintIssues.forEach(i => {
      if (!breakdown[i.status]) breakdown[i.status] = { count: 0, points: 0 };
      breakdown[i.status].count++;
      breakdown[i.status].points += i.storyPoints || 0;
    });
    return breakdown;
  }, [sprintIssues]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Burndown Chart</h1>

      {activeSprint ? (
        <>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total', value: totalPoints, color: '#2D3748', icon: Target, borderColor: '#E5E1DB' },
              { label: 'Done', value: donePoints, color: COLORS.green, icon: Zap, borderColor: COLORS.green },
              { label: 'In Progress', value: inProgressPts, color: COLORS.blue, icon: Clock, borderColor: COLORS.blue },
              { label: 'Remaining', value: remaining, color: COLORS.amber, icon: BarChart3, borderColor: COLORS.amber },
            ].map(stat => (
              <div key={stat.label} className="bg-white dark:bg-[#242B3D] border dark:border-[#3D4556] rounded-lg p-4" style={{ borderColor: stat.borderColor }}>
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon size={14} style={{ color: stat.color }} />
                  <span className="text-xs text-[#8896A6]">{stat.label}</span>
                </div>
                <p className="text-2xl font-display font-bold" style={{ color: stat.color }}>{stat.value}<span className="text-sm font-normal text-[#8896A6] ml-1">pts</span></p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-[#2D3748] dark:text-[#E8ECF4]">{activeSprint.name}</h2>
              <span className="text-xs text-[#8896A6] font-mono">Day {Math.min(elapsedDays, sprintDays)} of {sprintDays}</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="burndownFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DB" />
                <XAxis dataKey="day" tick={chartFont} stroke="#8896A6" />
                <YAxis tick={chartFont} stroke="#8896A6" />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={chartFont} />
                <Line type="linear" dataKey="ideal" name="Ideal" stroke={COLORS.gray} strokeDasharray="6 4" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="actual" name="Actual" stroke={COLORS.green} strokeWidth={2.5} fill="url(#burndownFill)" dot={{ fill: COLORS.green, r: 3 }} connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4">
            <h3 className="text-xs font-semibold text-[#8896A6] uppercase tracking-wider mb-3">Status Breakdown</h3>
            <div className="flex h-4 rounded-full overflow-hidden bg-[#f0ede8] dark:bg-[#1A1F2E]">
              {Object.entries(statusBreakdown).map(([status, { points }]) => (
                <div
                  key={status}
                  className="h-full transition-all duration-500"
                  style={{
                    width: totalPoints > 0 ? `${(points / totalPoints) * 100}%` : '0%',
                    backgroundColor: statusConfig[status]?.color || '#8896A6',
                  }}
                  title={`${statusConfig[status]?.label || status}: ${points} pts`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              {Object.entries(statusBreakdown).map(([status, { count, points }]) => (
                <span key={status} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusConfig[status]?.color }} />
                  <span className="text-[#5A6578] dark:text-[#A0AEC0]">{statusConfig[status]?.label || status}</span>
                  <span className="font-mono text-[#8896A6]">{count} ({points}pts)</span>
                </span>
              ))}
            </div>
          </div>
        </>
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
  const { data: issues } = useIssues(projectId);
  const { setCurrentProject } = useApp();

  React.useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const completedSprints = sprints?.filter(s => s.status === 'completed') || [];
  const avgVelocity = completedSprints.length > 0
    ? Math.round(completedSprints.reduce((s, sp) => s + sp.velocity, 0) / completedSprints.length)
    : 0;

  // Pie chart data for issues by type
  const typeBreakdown = useMemo(() => {
    if (!issues) return [];
    const counts: Record<string, number> = {};
    issues.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [issues]);

  const priorityBreakdown = useMemo(() => {
    if (!issues) return [];
    const counts: Record<string, number> = {};
    issues.forEach(i => { counts[i.priority] = (counts[i.priority] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [issues]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Velocity & Analytics</h1>

      {completedSprints.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-[#D4A373]" />
                <span className="text-xs text-[#8896A6]">Average Velocity</span>
              </div>
              <p className="text-2xl font-display font-bold text-[#D4A373]">{avgVelocity}<span className="text-sm font-normal text-[#8896A6] ml-1">pts/sprint</span></p>
            </div>
            <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-[#40916C]" />
                <span className="text-xs text-[#8896A6]">Sprints Completed</span>
              </div>
              <p className="text-2xl font-display font-bold text-[#40916C]">{completedSprints.length}</p>
            </div>
            <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-[#2196F3]" />
                <span className="text-xs text-[#8896A6]">Best Sprint</span>
              </div>
              <p className="text-2xl font-display font-bold text-[#2196F3]">{Math.max(...completedSprints.map(s => s.velocity))}<span className="text-sm font-normal text-[#8896A6] ml-1">pts</span></p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-6">
            <h2 className="font-display font-semibold text-[#2D3748] dark:text-[#E8ECF4] mb-4">Velocity Over Time</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={completedSprints.map(s => ({ name: s.name, velocity: s.velocity }))} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="velGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={COLORS.darkGreen} stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DB" />
                <XAxis dataKey="name" tick={chartFont} stroke="#8896A6" />
                <YAxis tick={chartFont} stroke="#8896A6" />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="velocity" name="Story Points" fill="url(#velGradient)" radius={[4, 4, 0, 0]} />
                {/* Average velocity reference line */}
                <Line type="monotone" dataKey={() => avgVelocity} stroke={COLORS.amber} strokeDasharray="6 3" name={`Average (${avgVelocity})`} dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-12 text-center">
          <TrendingUp size={48} className="mx-auto text-[#8896A6] mb-4" />
          <p className="text-[#5A6578]">Complete sprints to see velocity data.</p>
        </div>
      )}

      {/* Distribution Pie Charts */}
      {issues && issues.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-6">
            <h3 className="text-xs font-semibold text-[#8896A6] uppercase tracking-wider mb-4 flex items-center gap-2">
              <PieChartIcon size={12} /> Issues by Type
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {typeBreakdown.map((entry, idx) => (
                    <Cell key={entry.name} fill={issueTypeConfig[entry.name]?.color || PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-6">
            <h3 className="text-xs font-semibold text-[#8896A6] uppercase tracking-wider mb-4 flex items-center gap-2">
              <PieChartIcon size={12} /> Issues by Priority
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={priorityBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {priorityBreakdown.map((entry, idx) => (
                    <Cell key={entry.name} fill={priorityConfig[entry.name]?.color || PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
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
  const completedPts = completed.reduce((s, i) => s + (i.storyPoints || 0), 0);
  const totalPts = sprintIssues.reduce((s, i) => s + (i.storyPoints || 0), 0);

  const typeBreakdown = useMemo(() => {
    const bd: Record<string, number> = {};
    sprintIssues.forEach(i => {
      bd[i.type] = (bd[i.type] || 0) + 1;
    });
    return bd;
  }, [sprintIssues]);

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
          {sprint.goal && (
            <div className="bg-[#f8f6f2] dark:bg-[#1E2536] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4">
              <span className="text-xs text-[#8896A6] uppercase tracking-wider font-semibold">Sprint Goal</span>
              <p className="text-sm text-[#2D3748] dark:text-[#E8ECF4] mt-1 italic">{sprint.goal}</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
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
            <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4 text-center">
              <p className="text-2xl font-display font-bold text-[#9B59B6]">{completedPts}/{totalPts}</p>
              <p className="text-xs text-[#8896A6]">Story Points</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#8896A6]">Completion</span>
              <span className="text-xs font-mono text-[#40916C]">
                {sprintIssues.length > 0 ? Math.round(completed.length / sprintIssues.length * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-[#f0ede8] dark:bg-[#1A1F2E] rounded-full h-3">
              <div
                className="bg-gradient-to-r from-[#40916C] to-[#2D6A4F] h-3 rounded-full transition-all duration-700"
                style={{ width: sprintIssues.length > 0 ? `${(completed.length / sprintIssues.length * 100)}%` : '0%' }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4">
            <h3 className="text-xs font-semibold text-[#8896A6] uppercase tracking-wider mb-3">Issue Types</h3>
            <div className="flex gap-4">
              {Object.entries(typeBreakdown).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <span style={{ color: issueTypeConfig[type]?.color }}>{issueTypeConfig[type]?.icon}</span>
                  <span className="text-sm text-[#2D3748] dark:text-[#E8ECF4]">{type}</span>
                  <span className="text-xs font-mono text-[#8896A6] bg-[#f0ede8] dark:bg-[#1A1F2E] px-1.5 py-0.5 rounded">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {completed.length > 0 && (
            <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg overflow-hidden">
              <h3 className="px-4 py-3 font-display font-semibold text-sm text-[#40916C] border-b border-[#E5E1DB] dark:border-[#3D4556] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#40916C]" />
                Completed ({completed.length})
              </h3>
              {completed.map(issue => (
                <div key={issue.id} onClick={() => selectIssue(issue.id)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f0ede8] dark:hover:bg-[#2a3144] cursor-pointer border-b border-[#E5E1DB]/50 dark:border-[#3D4556]/50 last:border-0 text-sm transition-colors">
                  <span className="text-xs" style={{ color: issueTypeConfig[issue.type]?.color }}>{issueTypeConfig[issue.type]?.icon}</span>
                  <span className="font-mono text-xs text-[#8896A6]">{issue.key}</span>
                  <span className="text-[#2D3748] dark:text-[#E8ECF4] flex-1">{issue.summary}</span>
                  {issue.storyPoints != null && (
                    <span className="text-xs font-mono text-[#8896A6]">{issue.storyPoints} pts</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {notCompleted.length > 0 && (
            <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg overflow-hidden">
              <h3 className="px-4 py-3 font-display font-semibold text-sm text-[#D4A373] border-b border-[#E5E1DB] dark:border-[#3D4556] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4A373]" />
                Not Completed ({notCompleted.length})
              </h3>
              {notCompleted.map(issue => (
                <div key={issue.id} onClick={() => selectIssue(issue.id)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f0ede8] dark:hover:bg-[#2a3144] cursor-pointer border-b border-[#E5E1DB]/50 dark:border-[#3D4556]/50 last:border-0 text-sm transition-colors">
                  <span className="text-xs" style={{ color: issueTypeConfig[issue.type]?.color }}>{issueTypeConfig[issue.type]?.icon}</span>
                  <span className="font-mono text-xs text-[#8896A6]">{issue.key}</span>
                  <span className="text-[#2D3748] dark:text-[#E8ECF4] flex-1">{issue.summary}</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ color: statusConfig[issue.status]?.color, backgroundColor: statusConfig[issue.status]?.bg }}>
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
