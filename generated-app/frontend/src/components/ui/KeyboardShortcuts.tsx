import React, { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const shortcuts = [
  { keys: ['⌘', 'K'], description: 'Open search' },
  { keys: ['⌘', '['], description: 'Toggle sidebar' },
  { keys: ['C'], description: 'Create new issue' },
  { keys: ['Esc'], description: 'Close panel / modal' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(v => !v);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] animate-fade-in" onClick={() => setOpen(false)}>
      <div
        className="bg-white dark:bg-[#242B3D] rounded-xl shadow-2xl w-full max-w-sm p-6 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-[#D4A373]" />
            <h2 className="text-sm font-display font-bold text-[#2D3748] dark:text-[#E8ECF4]">Keyboard Shortcuts</h2>
          </div>
          <button onClick={() => setOpen(false)} className="text-[#8896A6] hover:text-[#2D3748] dark:hover:text-[#E8ECF4] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#E5E1DB]/50 dark:border-[#3D4556]/50 last:border-0">
              <span className="text-sm text-[#5A6578] dark:text-[#A0AEC0]">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key, j) => (
                  <React.Fragment key={j}>
                    {j > 0 && <span className="text-[10px] text-[#c4c0b8]">+</span>}
                    <kbd className="px-2 py-1 bg-[#f0ede8] dark:bg-[#1A1F2E] border border-[#E5E1DB] dark:border-[#3D4556] rounded text-xs font-mono text-[#2D3748] dark:text-[#E8ECF4] min-w-[28px] text-center shadow-sm">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-[#c4c0b8] mt-4 text-center">Press <kbd className="px-1 py-0.5 bg-[#f0ede8] dark:bg-[#1A1F2E] border border-[#E5E1DB] dark:border-[#3D4556] rounded text-[9px] font-mono">?</kbd> to toggle</p>
      </div>
    </div>
  );
}
