import React from 'react';
import { Search, Plus, Moon, Sun, TreePine, Menu, HardDrive, Cloud } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useProjects } from '../../hooks/useApi';
import { useNavigate } from 'react-router-dom';

export function TopNav() {
  const { state, toggleSidebar, setTheme, toggleCreateModal, toggleSearch, setCurrentProject } = useApp();
  const { data: projects } = useProjects();
  const navigate = useNavigate();
  const [projDropdown, setProjDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const currentProject = projects?.find(p => p.id === state.currentProjectId);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.key === 'c' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        toggleCreateModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSearch, toggleSidebar, toggleCreateModal]);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProjDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header data-testid="top-nav" className="h-14 bg-[#1B4332] text-white flex items-center px-4 gap-4 sticky top-0 z-50 shadow-md">
      <button
        onClick={toggleSidebar}
        className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
        title="Toggle sidebar (⌘[)"
      >
        <Menu size={20} />
      </button>

      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => { setCurrentProject(null); navigate('/'); }}
      >
        <TreePine size={24} className="text-[#D4A373]" />
        <span className="font-display font-bold text-lg tracking-tight hidden sm:inline">Canopy</span>
      </div>

      <button
        data-testid="search-btn"
        onClick={() => toggleSearch()}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-md px-3 py-1.5 text-sm text-white/70 transition-colors flex-1 max-w-md"
      >
        <Search size={16} />
        <span className="hidden sm:inline">Search issues, projects...</span>
        <kbd className="ml-auto text-xs bg-white/10 px-1.5 py-0.5 rounded hidden sm:inline">⌘K</kbd>
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setProjDropdown(!projDropdown)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-md px-3 py-1.5 text-sm transition-colors"
        >
          {currentProject ? (
            <>
              <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold" style={{ background: currentProject.color || '#52796F' }}>
                {currentProject.icon || currentProject.key[0]}
              </span>
              <span className="hidden md:inline">{currentProject.name}</span>
              <span className="text-white/50 hidden md:inline">{currentProject.key}</span>
            </>
          ) : (
            <span className="text-white/70">Select project</span>
          )}
        </button>

        {projDropdown && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-[#E5E1DB] animate-scale-in z-50 overflow-hidden">
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-semibold text-[#8896A6] uppercase tracking-wider">Projects</p>
              {projects?.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setCurrentProject(p.id);
                    navigate(`/project/${p.id}/board`);
                    setProjDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-[#2D3748] hover:bg-[#f0ede8] transition-colors"
                >
                  <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white" style={{ background: p.color || '#52796F' }}>
                    {p.icon || p.key[0]}
                  </span>
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-auto text-xs text-[#8896A6]">{p.key}</span>
                </button>
              ))}
              {(!projects || projects.length === 0) && (
                <p className="px-2 py-4 text-sm text-[#8896A6] text-center">No projects yet</p>
              )}
            </div>
            <div className="border-t border-[#E5E1DB] p-2">
              <button
                onClick={() => { navigate('/'); setProjDropdown(false); }}
                className="w-full text-left px-2 py-1.5 text-sm text-[#D4A373] hover:bg-[#f0ede8] rounded-md transition-colors"
              >
                View all projects
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        data-testid="create-issue-btn"
        onClick={() => toggleCreateModal()}
        className="flex items-center gap-1.5 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:shadow-md active:scale-[0.98]"
      >
        <Plus size={16} />
        <span className="hidden sm:inline">Create</span>
      </button>

      <div className="ml-auto flex items-center gap-1">
        {import.meta.env.VITE_API_URL ? (
          <span className="flex items-center gap-1 text-[10px] text-white/40 px-2 py-1 bg-white/5 rounded" title="Connected to API">
            <Cloud size={12} className="text-[#40916C]" /> API
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-white/40 px-2 py-1 bg-white/5 rounded" title="Using local storage">
            <HardDrive size={12} /> Local
          </span>
        )}
        <button
          data-testid="theme-toggle"
          onClick={() => setTheme(state.theme === 'light' ? 'dark' : 'light')}
          className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
          title="Toggle theme"
        >
          {state.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
}
