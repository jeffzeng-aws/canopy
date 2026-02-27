import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart3, TrendingUp, FileText, Target, Clock, Zap } from 'lucide-react';
import { useSprints, useIssues } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { issueTypeConfig, priorityConfig, statusConfig, cn } from '../lib/utils';

// Simple SVG burndown chart
function BurndownChart({ totalPoints, donePoints, sprintDays, elapsedDays }: {
  totalPoints: number;
  donePoints: number;
  sprintDays: number;
  elapsedDays: number;
}) {
  const w = 600, h = 260, pad = 40;
  const chartW = w - pad * 2, chartH = h - pad * 2;

  // Generate ideal burndown line
  const idealPoints = Array.from({ length: sprintDays + 1 }, (_, i) =>
    totalPoints - (totalPoints / sprintDays) * i
  );

  // Generate simulated actual burndown line
  const remaining = totalPoints - donePoints;
  const actualDays = Math.min(elapsedDays, sprintDays);
  const actualPoints: number[] = [totalPoints];
  for (let i = 1; i <= actualDays; i++) {
    const idealRemaining = totalPoints - (totalPoints - remaining) * (i / actualDays);
    // Add some natural variation
    const jitter = (Math.sin(i * 3.7) * 0.15 + 0.05) * totalPoints;
    actualPoints.push(Math.max(0, idealRemaining + jitter));
  }
  // Last point is actual remaining
  if (actualPoints.length > 1) {
    actualPoints[actualPoints.length - 1] = remaining;
  }

  const maxPts = totalPoints || 1;
  const toX = (day: number) => pad + (day / sprintDays) * chartW;
  const toY = (pts: number) => pad + (1 - pts / maxPts) * chartH;

  const idealPath = idealPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p)}`).join(' ');
  const actualPath = actualPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p)}`).join(' ');

  // Grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    y: toY(maxPts * pct),
    label: Math.round(maxPts * pct),
  }));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: '280px' }}>
      {/* Grid lines */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={pad} y1={g.y} x2={w - pad} y2={g.y} stroke="#E5E1DB" strokeWidth="1" strokeDasharray="4,4" />
          <text x={pad - 8} y={g.y + 4} textAnchor="end" fontSize="10" fill="#8896A6" fontFamily="JetBrains Mono, monospace">{g.label}</text>
        </g>
      ))}

      {/* X axis labels */}
      {Array.from({ length: Math.min(sprintDays + 1, 8) }, (_, i) => {
        const day = Math.round(i * sprintDays / 7);
        return (
          <text key={i} x={toX(day)} y={h - 8} textAnchor="middle" fontSize="10" fill="#8896A6" fontFamily="JetBrains Mono, monospace">
            Day {day}
          </text>
        );
      })}

      {/* Ideal line */}
      <path d={idealPath} fill="none" stroke="#8896A6" strokeWidth="2" strokeDasharray="6,4" opacity="0.5" />

      {/* Actual burndown line */}
      <path d={actualPath} fill="none" stroke="#40916C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1.5s" fill="freeze" />
        <animate attributeName="stroke-dasharray" from="0,1000" to="1000,0" dur="1.5s" fill="freeze" />
      </path>

      {/* Area fill under actual line */}
      <path
        d={`${actualPath} L${toX(actualPoints.length - 1)},${toY(0)} L${toX(0)},${toY(0)} Z`}
        fill="url(#burndownGrad)"
        opacity="0.15"
      />

      {/* Today marker */}
      {actualDays > 0 && actualDays < sprintDays && (
        <line x1={toX(actualDays)} y1={pad} x2={toX(actualDays)} y2={pad + chartH} stroke="#D4A373" strokeWidth="1.5" strokeDasharray="4,4" />
      )}

      {/* Endpoint dot */}
      {actualPoints.length > 1 && (
        <circle cx={toX(actualPoints.length - 1)} cy={toY(remaining)} r="4" fill="#40916C" stroke="white" strokeWidth="2">
          <animate attributeName="r" from="0" to="4" dur="0.3s" begin="1.2s" fill="freeze" />
        </circle>
      )}

      <defs>
        <linearGradient id="burndownGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#40916C" />
          <stop offset="100%" stopColor="#40916C" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Simple SVG bar chart for velocity
function VelocityBarChart({ data }: { data: { name: string; velocity: number }[] }) {
  const w = 600, h = 220, pad = 40;
  const chartW = w - pad * 2, chartH = h - pad * 2;
  const maxVel = Math.max(...data.map(d => d.velocity), 1);
  const barWidth = Math.min(60, chartW / data.length - 8);
  const avg = data.reduce((s, d) => s + d.velocity, 0) / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: '240px' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = pad + (1 - pct) * chartH;
        return (
          <g key={i}>
            <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#E5E1DB" strokeWidth="1" strokeDasharray="4,4" />
            <text x={pad - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#8896A6" fontFamily="JetBrains Mono, monospace">
              {Math.round(maxVel * pct)}
            </text>
          </g>
        );
      })}

      {/* Average line */}
      <line
        x1={pad}
        y1={pad + (1 - avg / maxVel) * chartH}
        x2={w - pad}
        y2={pad + (1 - avg / maxVel) * chartH}
        stroke="#D4A373"
        strokeWidth="1.5"
        strokeDasharray="6,3"
      />
      <text x={w - pad + 4} y={pad + (1 - avg / maxVel) * chartH + 4} fontSize="10" fill="#D4A373" fontFamily="JetBrains Mono, monospace">
        avg
      </text>

      {/* Bars */}
      {data.map((d, i) => {
        const x = pad + (i + 0.5) * (chartW / data.length) - barWidth / 2;
        const barH = (d.velocity / maxVel) * chartH;
        const y = pad + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} rx="4" fill="url(#velGrad)">
              <animate attributeName="height" from="0" to={barH} dur="0.6s" begin={`${i * 0.1}s`} fill="freeze" />
              <animate attributeName="y" from={pad + chartH} to={y} dur="0.6s" begin={`${i * 0.1}s`} fill="freeze" />
            </rect>
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11" fill="#2D3748" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
              {d.velocity}
            </text>
            <text x={x + barWidth / 2} y={h - 8} textAnchor="middle" fontSize="9" fill="#8896A6" fontFamily="var(--font-body)">
              {d.name}
            </text>
          </g>
        );
      })}

      <defs>
        <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#40916C" />
          <stop offset="100%" stopColor="#1B4332" />
        </linearGradient>
      </defs>
    </svg>
  );
}

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

  // Calculate sprint days and elapsed
  const sprintDays = activeSprint?.startDate && activeSprint?.endDate
    ? Math.max(1, Math.round((new Date(activeSprint.endDate).getTime() - new Date(activeSprint.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 14;
  const elapsedDays = activeSprint?.startDate
    ? Math.max(0, Math.round((Date.now() - new Date(activeSprint.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Issue breakdown by status
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
          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-[#8896A6]" />
                <span className="text-xs text-[#8896A6]">Total</span>
              </div>
              <p className="text-2xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">{totalPoints}<span className="text-sm font-normal text-[#8896A6] ml-1">pts</span></p>
            </div>
            <div className="bg-white dark:bg-[#242B3D] border border-[#40916C] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-[#40916C]" />
                <span className="text-xs text-[#8896A6]">Done</span>
              </div>
              <p className="text-2xl font-display font-bold text-[#40916C]">{donePoints}<span className="text-sm font-normal text-[#8896A6] ml-1">pts</span></p>
            </div>
            <div className="bg-white dark:bg-[#242B3D] border border-[#2196F3] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-[#2196F3]" />
                <span className="text-xs text-[#8896A6]">In Progress</span>
              </div>
              <p className="text-2xl font-display font-bold text-[#2196F3]">{inProgressPts}<span className="text-sm font-normal text-[#8896A6] ml-1">pts</span></p>
            </div>
            <div className="bg-white dark:bg-[#242B3D] border border-[#D4A373] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={14} className="text-[#D4A373]" />
                <span className="text-xs text-[#8896A6]">Remaining</span>
              </div>
              <p className="text-2xl font-display font-bold text-[#D4A373]">{remaining}<span className="text-sm font-normal text-[#8896A6] ml-1">pts</span></p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-[#2D3748] dark:text-[#E8ECF4]">{activeSprint.name}</h2>
              <span className="text-xs text-[#8896A6]">Day {Math.min(elapsedDays, sprintDays)} of {sprintDays}</span>
            </div>
            <BurndownChart
              totalPoints={totalPoints}
              donePoints={donePoints}
              sprintDays={sprintDays}
              elapsedDays={elapsedDays}
            />
            <div className="flex items-center gap-6 mt-3 justify-center">
              <span className="flex items-center gap-2 text-xs text-[#8896A6]">
                <span className="w-6 h-0.5 bg-[#8896A6] inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #8896A6 0, #8896A6 4px, transparent 4px, transparent 8px)' }} />
                Ideal
              </span>
              <span className="flex items-center gap-2 text-xs text-[#40916C]">
                <span className="w-6 h-0.5 bg-[#40916C] inline-block rounded" />
                Actual
              </span>
              <span className="flex items-center gap-2 text-xs text-[#D4A373]">
                <span className="w-4 h-0.5 bg-[#D4A373] inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #D4A373 0, #D4A373 4px, transparent 4px, transparent 8px)' }} />
                Today
              </span>
            </div>
          </div>

          {/* Status breakdown */}
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
            <VelocityBarChart data={completedSprints.map(s => ({ name: s.name, velocity: s.velocity }))} />
            <div className="flex items-center gap-6 mt-3 justify-center">
              <span className="flex items-center gap-2 text-xs text-[#40916C]">
                <span className="w-4 h-3 bg-gradient-to-b from-[#40916C] to-[#1B4332] rounded-sm" />
                Story Points
              </span>
              <span className="flex items-center gap-2 text-xs text-[#D4A373]">
                <span className="w-4 h-0.5 bg-[#D4A373] inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #D4A373 0, #D4A373 4px, transparent 4px, transparent 8px)' }} />
                Average ({avgVelocity} pts)
              </span>
            </div>
          </div>
        </>
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
  const completedPts = completed.reduce((s, i) => s + (i.storyPoints || 0), 0);
  const totalPts = sprintIssues.reduce((s, i) => s + (i.storyPoints || 0), 0);
  const totalTime = sprintIssues.reduce((s, i) => s + (i.timeSpent || 0), 0);

  // Type breakdown
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
          {/* Sprint header card */}
          {sprint.goal && (
            <div className="bg-[#f8f6f2] dark:bg-[#1E2536] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4">
              <span className="text-xs text-[#8896A6] uppercase tracking-wider font-semibold">Sprint Goal</span>
              <p className="text-sm text-[#2D3748] dark:text-[#E8ECF4] mt-1 italic">{sprint.goal}</p>
            </div>
          )}

          {/* Stats */}
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

          {/* Progress bar */}
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

          {/* Issue type breakdown */}
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

          {/* Issue lists */}
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
