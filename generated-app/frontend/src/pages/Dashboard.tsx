import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, TreePine, ArrowRight, Columns3, CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { useProjects, useCreateProject } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { cn, formatDate } from '../lib/utils';

export function Dashboard() {
  const navigate = useNavigate();
  const { data: projects, isLoading, isError } = useProjects();
  const { setCurrentProject } = useApp();
  const [showCreate, setShowCreate] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newKey, setNewKey] = React.useState('');
  const [newColor, setNewColor] = React.useState('#1B4332');
  const [newDescription, setNewDescription] = React.useState('');

  const createProject = useCreateProject();

  const handleCreate = async () => {
    if (!newName || !newKey) return;
    try {
      const proj = await createProject.mutateAsync({
        name: newName,
        key: newKey.toUpperCase(),
        color: newColor,
        description: newDescription || undefined,
      });
      setCurrentProject(proj.id);
      navigate(`/project/${proj.id}/board`);
      setShowCreate(false);
      setNewName('');
      setNewKey('');
      setNewDescription('');
    } catch (err: any) {
      console.error('Failed to create project:', err);
    }
  };

  // Quick stats across all projects
  const quickStats = useMemo(() => {
    if (!projects || projects.length === 0) return null;
    const total = projects.reduce((s, p) => s + (p.issueCounter || 0), 0);
    return { totalIssues: total, projectCount: projects.length };
  }, [projects]);

  const colors = ['#1B4332', '#2D6A4F', '#40916C', '#52796F', '#D4A373', '#BC6C25', '#9B59B6', '#2196F3'];

  if (isLoading && !isError) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-shimmer rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 animate-shimmer rounded-lg" />)}
        </div>
      </div>
    );
  }

  const hasProjects = projects && projects.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {!hasProjects ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-[#f0ede8] rounded-2xl flex items-center justify-center mb-6 animate-fade-in">
            <TreePine size={48} className="text-[#1B4332]" />
          </div>
          <h1 className="text-3xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4] mb-3 animate-fade-in stagger-1" style={{ opacity: 0 }}>
            Welcome to Canopy
          </h1>
          <p className="text-[#5A6578] mb-8 max-w-md animate-fade-in stagger-2" style={{ opacity: 0 }}>
            Manage your projects with agile methodologies. Create your first project to get started with boards, sprints, and issue tracking.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-lg px-6 py-3 font-medium transition-all hover:shadow-lg active:scale-[0.98] animate-fade-in stagger-3"
            style={{ opacity: 0 }}
          >
            <Plus size={20} />
            Create your first project
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Dashboard</h1>
              <p className="text-[#5A6578] text-sm mt-1">Welcome back. Here are your projects.</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-lg px-4 py-2 text-sm font-medium transition-all hover:shadow-md active:scale-[0.98]"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>

          {/* Quick Stats */}
          {quickStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1B4332]/10 flex items-center justify-center">
                  <FolderOpen size={20} className="text-[#1B4332]" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">{quickStats.projectCount}</p>
                  <p className="text-xs text-[#8896A6]">Projects</p>
                </div>
              </div>
              <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2196F3]/10 flex items-center justify-center">
                  <Columns3 size={20} className="text-[#2196F3]" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">{quickStats.totalIssues}</p>
                  <p className="text-xs text-[#8896A6]">Total Issues</p>
                </div>
              </div>
              <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#40916C]/10 flex items-center justify-center">
                  <TrendingUp size={20} className="text-[#40916C]" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[#40916C]">Active</p>
                  <p className="text-xs text-[#8896A6]">Status</p>
                </div>
              </div>
              <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4A373]/10 flex items-center justify-center">
                  <Clock size={20} className="text-[#D4A373]" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[#D4A373]">{formatDate(new Date().toISOString())}</p>
                  <p className="text-xs text-[#8896A6]">Today</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Projects */}
          <div>
            <h2 className="text-sm font-semibold text-[#8896A6] uppercase tracking-wider mb-3">Recent Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, i) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setCurrentProject(project.id);
                    navigate(`/project/${project.id}/board`);
                  }}
                  className="group bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-5 text-left hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 animate-fade-in"
                  style={{ opacity: 0, animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ background: project.color || '#52796F' }}
                    >
                      {project.icon || project.key[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-[#2D3748] dark:text-[#E8ECF4] truncate group-hover:text-[#D4A373] transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-xs text-[#8896A6] font-mono">{project.key}</p>
                    </div>
                    <ArrowRight size={16} className="text-[#8896A6] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {project.description && (
                    <p className="text-sm text-[#5A6578] line-clamp-2 mb-3">{project.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-[#8896A6]">
                    <span className="flex items-center gap-1">
                      <Columns3 size={12} />
                      {project.issueCounter} issues
                    </span>
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-[#242B3D] rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4] mb-6">Create Project</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5A6578] mb-1">Project Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => {
                    setNewName(e.target.value);
                    if (!newKey || newKey === newName.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 4)) {
                      setNewKey(e.target.value.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 4));
                    }
                  }}
                  placeholder="My Project"
                  autoFocus
                  className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5A6578] mb-1">Key</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10))}
                  placeholder="KEY"
                  className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm font-mono focus:outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5A6578] mb-1">Description <span className="text-[#8896A6] font-normal">(optional)</span></label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="What is this project about?"
                  rows={2}
                  className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 resize-none dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5A6578] mb-1">Color</label>
                <div className="flex gap-2">
                  {colors.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        newColor === c ? 'ring-2 ring-[#D4A373] ring-offset-2 scale-110' : 'hover:scale-105'
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 border border-[#E5E1DB] rounded-md text-sm text-[#5A6578] hover:bg-[#f0ede8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName || !newKey || newKey.length < 2}
                className="flex-1 px-4 py-2 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-md text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
