import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tag, Plus, X, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Label {
  id: string;
  name: string;
  color: string;
}

const defaultLabels: Label[] = [
  { id: '1', name: 'frontend', color: '#2196F3' },
  { id: '2', name: 'backend', color: '#40916C' },
  { id: '3', name: 'bug', color: '#BC6C25' },
  { id: '4', name: 'enhancement', color: '#9B59B6' },
  { id: '5', name: 'documentation', color: '#E9C46A' },
  { id: '6', name: 'urgent', color: '#D4A373' },
];

function lsGet<T>(key: string, fb: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; }
}
function lsSet(key: string, v: unknown) { localStorage.setItem(key, JSON.stringify(v)); }

export function LabelsView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { setCurrentProject } = useApp();
  const storageKey = `canopy:labels:${projectId}`;

  React.useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const [labels, setLabels] = useState<Label[]>(() => lsGet(storageKey, defaultLabels));
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#2196F3');

  const colors = ['#2196F3', '#40916C', '#BC6C25', '#9B59B6', '#E9C46A', '#D4A373', '#1B4332', '#52796F'];

  const handleAdd = () => {
    if (!newName.trim()) return;
    const updated = [...labels, { id: crypto.randomUUID(), name: newName.trim(), color: newColor }];
    setLabels(updated);
    lsSet(storageKey, updated);
    setNewName('');
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    const updated = labels.filter(l => l.id !== id);
    setLabels(updated);
    lsSet(storageKey, updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Labels</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-md px-3 py-1.5 text-sm font-medium transition-all"
        >
          <Plus size={16} /> New Label
        </button>
      </div>

      {showAdd && (
        <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Label name..."
              autoFocus
              className="flex-1 px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            />
            <div className="flex gap-1">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-6 h-6 rounded-full transition-all ${newColor === c ? 'ring-2 ring-[#D4A373] ring-offset-1 scale-110' : 'hover:scale-105'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <button onClick={handleAdd} className="px-3 py-2 bg-[#D4A373] text-white rounded-md text-sm">Add</button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-2 text-[#8896A6] hover:text-[#2D3748] text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg divide-y divide-[#E5E1DB] dark:divide-[#3D4556]">
        {labels.map(label => (
          <div key={label.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f0ede8] dark:hover:bg-[#2a3144] transition-colors group">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: label.color }} />
            <span className="text-sm font-medium text-[#2D3748] dark:text-[#E8ECF4] flex-1">{label.name}</span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ color: label.color, backgroundColor: `${label.color}15` }}
            >
              {label.name}
            </span>
            <button
              onClick={() => handleDelete(label.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-[#8896A6] hover:text-[#BC6C25] transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {labels.length === 0 && (
          <div className="p-8 text-center">
            <Tag size={32} className="mx-auto text-[#8896A6] mb-2" />
            <p className="text-sm text-[#8896A6]">No labels yet. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
