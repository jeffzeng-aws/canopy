import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Trash2, Save, AlertTriangle } from 'lucide-react';
import { useProject, useUpdateProject, useDeleteProject, useBoard, useUpdateBoard } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { showToast } from '../components/ui/Toast';

export function SettingsView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(projectId);
  const { data: board } = useBoard(projectId);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const updateBoard = useUpdateBoard();
  const { setCurrentProject } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setColor(project.color || '#1B4332');
    }
  }, [project]);

  const handleSave = async () => {
    if (!projectId || !name.trim()) return;
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: { name: name.trim(), description: description || undefined, color },
      });
      showToast('success', 'Project updated');
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;
    try {
      await deleteProject.mutateAsync(projectId);
      showToast('success', 'Project deleted');
      setCurrentProject(null);
      navigate('/');
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const colors = ['#1B4332', '#2D6A4F', '#40916C', '#52796F', '#D4A373', '#BC6C25', '#9B59B6', '#2196F3'];

  if (isLoading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 animate-shimmer rounded-lg" />)}</div>;
  }

  return (
    <div className="space-y-8 max-w-2xl animate-fade-in">
      <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Project Settings</h1>

      <section className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#8896A6] uppercase tracking-wider">General</h2>

        <div>
          <label className="block text-sm font-medium text-[#5A6578] mb-1">Project Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5A6578] mb-1">Key</label>
          <input
            type="text"
            value={project?.key || ''}
            disabled
            className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm bg-[#f0ede8] dark:bg-[#1A1F2E] text-[#8896A6] font-mono cursor-not-allowed"
          />
          <p className="text-xs text-[#8896A6] mt-1">Project key cannot be changed after creation.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5A6578] mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe your project..."
            className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] resize-none dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5A6578] mb-1">Color</label>
          <div className="flex gap-2">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-[#D4A373] ring-offset-2 scale-110' : 'hover:scale-105'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={updateProject.isPending}
          className="flex items-center gap-2 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-md px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
        >
          <Save size={16} /> Save Changes
        </button>
      </section>

      {board && (
        <section className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#8896A6] uppercase tracking-wider">Board Columns</h2>
          <div className="space-y-2">
            {board.columns.sort((a, b) => a.sortOrder - b.sortOrder).map(col => (
              <div key={col.id} className="flex items-center gap-3 px-3 py-2 bg-[#f0ede8] dark:bg-[#1A1F2E] rounded-md">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color || '#8896A6' }} />
                <span className="text-sm text-[#2D3748] dark:text-[#E8ECF4] font-medium">{col.name}</span>
                <span className="text-xs text-[#8896A6]">{col.statusCategory}</span>
                {col.wipLimit && <span className="text-xs text-[#D4A373]">WIP: {col.wipLimit}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white dark:bg-[#242B3D] border border-[#BC6C25] rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#BC6C25] uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle size={16} /> Danger Zone
        </h2>
        <p className="text-sm text-[#5A6578]">
          Deleting a project will permanently remove all its issues, sprints, and boards. This cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 bg-[#BC6C25] hover:bg-[#a55e20] text-white rounded-md px-4 py-2 text-sm font-medium transition-all"
          >
            <Trash2 size={16} /> Delete Project
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              className="bg-[#BC6C25] hover:bg-[#a55e20] text-white rounded-md px-4 py-2 text-sm font-medium"
            >
              Yes, Delete Forever
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="border border-[#E5E1DB] rounded-md px-4 py-2 text-sm text-[#5A6578] hover:bg-[#f0ede8]"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
