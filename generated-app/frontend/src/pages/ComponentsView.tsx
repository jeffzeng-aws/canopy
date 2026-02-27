import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layers, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ProjectComponent {
  id: string;
  name: string;
  description?: string;
  leadId?: string;
}

const defaultComponents: ProjectComponent[] = [
  { id: '1', name: 'Frontend', description: 'React UI components and pages' },
  { id: '2', name: 'Backend', description: 'Lambda handlers and API routes' },
  { id: '3', name: 'Infrastructure', description: 'CDK stack and AWS resources' },
  { id: '4', name: 'Shared', description: 'Zod schemas and shared types' },
];

function lsGet<T>(key: string, fb: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; }
}
function lsSet(key: string, v: unknown) { localStorage.setItem(key, JSON.stringify(v)); }

export function ComponentsView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { setCurrentProject } = useApp();
  const storageKey = `canopy:components:${projectId}`;

  React.useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const [components, setComponents] = useState<ProjectComponent[]>(() => lsGet(storageKey, defaultComponents));
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    const updated = [...components, { id: crypto.randomUUID(), name: newName.trim(), description: newDesc.trim() || undefined }];
    setComponents(updated);
    lsSet(storageKey, updated);
    setNewName('');
    setNewDesc('');
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    const updated = components.filter(c => c.id !== id);
    setComponents(updated);
    lsSet(storageKey, updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Components</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-md px-3 py-1.5 text-sm font-medium transition-all"
        >
          <Plus size={16} /> New Component
        </button>
      </div>

      {showAdd && (
        <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Component name..."
            autoFocus
            className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
          />
          <input
            type="text"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optional)..."
            className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-2 bg-[#D4A373] text-white rounded-md text-sm font-medium">Add Component</button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-2 text-[#8896A6] hover:text-[#2D3748] text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {components.map(comp => (
          <div key={comp.id} className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4 hover:shadow-md transition-all group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#f0ede8] dark:bg-[#1A1F2E] rounded-lg flex items-center justify-center">
                <Layers size={20} className="text-[#52796F]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-[#2D3748] dark:text-[#E8ECF4] text-sm">{comp.name}</h3>
                {comp.description && (
                  <p className="text-xs text-[#8896A6] mt-1">{comp.description}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(comp.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-[#8896A6] hover:text-[#BC6C25] transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {components.length === 0 && (
        <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-12 text-center">
          <Layers size={48} className="mx-auto text-[#8896A6] mb-4" />
          <p className="text-[#5A6578] mb-2">No components yet</p>
          <p className="text-sm text-[#8896A6]">Components help organize issues by area of work.</p>
        </div>
      )}
    </div>
  );
}
