import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tag, Plus, X, Pencil, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useIssues } from '../hooks/useApi';
import { showToast } from '../components/ui/Toast';

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

const defaultLabels: Label[] = [
  { id: '1', name: 'frontend', color: '#2196F3', description: 'Frontend UI work' },
  { id: '2', name: 'backend', color: '#40916C', description: 'Backend/API work' },
  { id: '3', name: 'bug', color: '#BC6C25', description: 'Bug fixes' },
  { id: '4', name: 'enhancement', color: '#9B59B6', description: 'Feature improvements' },
  { id: '5', name: 'documentation', color: '#E9C46A', description: 'Documentation updates' },
  { id: '6', name: 'urgent', color: '#D4A373', description: 'High priority items' },
];

function lsGet<T>(key: string, fb: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; }
}
function lsSet(key: string, v: unknown) { localStorage.setItem(key, JSON.stringify(v)); }

export function LabelsView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { setCurrentProject } = useApp();
  const { data: issues } = useIssues(projectId);
  const storageKey = `canopy:labels:${projectId}`;

  React.useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const [labels, setLabels] = useState<Label[]>(() => lsGet(storageKey, defaultLabels));
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#2196F3');
  const [newDesc, setNewDesc] = useState('');
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const colors = ['#2196F3', '#40916C', '#BC6C25', '#9B59B6', '#E9C46A', '#D4A373', '#1B4332', '#52796F'];

  // Count how many issues use each label
  const labelCounts: Record<string, number> = {};
  if (issues) {
    issues.forEach(i => {
      (i.labels || []).forEach((l: string) => {
        labelCounts[l] = (labelCounts[l] || 0) + 1;
      });
    });
  }

  const handleAdd = () => {
    if (!newName.trim()) return;
    const updated = [...labels, { id: crypto.randomUUID(), name: newName.trim(), color: newColor, description: newDesc || undefined }];
    setLabels(updated);
    lsSet(storageKey, updated);
    setNewName('');
    setNewDesc('');
    setShowAdd(false);
    showToast('success', `Label "${newName}" created`);
  };

  const handleDelete = (id: string) => {
    const label = labels.find(l => l.id === id);
    const usage = labelCounts[label?.name || ''] || 0;
    if (usage > 0 && !confirm(`This label is used by ${usage} issue(s). Delete anyway?`)) return;
    const updated = labels.filter(l => l.id !== id);
    setLabels(updated);
    lsSet(storageKey, updated);
    showToast('success', 'Label deleted');
  };

  const startEdit = (label: Label) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
    setEditDesc(label.description || '');
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingId) return;
    const updated = labels.map(l => l.id === editingId ? { ...l, name: editName.trim(), color: editColor, description: editDesc || undefined } : l);
    setLabels(updated);
    lsSet(storageKey, updated);
    setEditingId(null);
    showToast('success', 'Label updated');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Labels</h1>
          <p className="text-sm text-[#8896A6] mt-1">Organize and categorize your issues with labels.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-md px-3 py-1.5 text-sm font-medium transition-all"
        >
          <Plus size={16} /> New Label
        </button>
      </div>

      {showAdd && (
        <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg p-4 space-y-3">
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
          </div>
          <input
            type="text"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-2 bg-[#D4A373] text-white rounded-md text-sm font-medium">Add Label</button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-2 text-[#8896A6] hover:text-[#2D3748] text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg divide-y divide-[#E5E1DB] dark:divide-[#3D4556]">
        {labels.map(label => (
          <div key={label.id} className="px-4 py-3 hover:bg-[#f0ede8] dark:hover:bg-[#2a3144] transition-colors group">
            {editingId === label.id ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                    className="flex-1 px-3 py-1.5 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                  />
                  <div className="flex gap-1">
                    {colors.map(c => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={`w-5 h-5 rounded-full transition-all ${editColor === c ? 'ring-2 ring-[#D4A373] ring-offset-1' : ''}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-1.5 border border-[#E5E1DB] rounded-md text-sm focus:outline-none focus:border-[#D4A373] dark:bg-[#1A1F2E] dark:border-[#3D4556] dark:text-[#E8ECF4]"
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className="flex items-center gap-1 px-2 py-1 bg-[#40916C] text-white rounded text-xs"><Check size={12} /> Save</button>
                  <button onClick={() => setEditingId(null)} className="px-2 py-1 text-[#8896A6] text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: label.color }} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[#2D3748] dark:text-[#E8ECF4]">{label.name}</span>
                  {label.description && <p className="text-xs text-[#8896A6] truncate">{label.description}</p>}
                </div>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ color: label.color, backgroundColor: `${label.color}15` }}
                >
                  {label.name}
                </span>
                {labelCounts[label.name] > 0 && (
                  <span className="text-xs text-[#8896A6] font-mono">{labelCounts[label.name]} issues</span>
                )}
                <button
                  onClick={() => startEdit(label)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#8896A6] hover:text-[#D4A373] transition-all"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(label.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#8896A6] hover:text-[#BC6C25] transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            )}
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
