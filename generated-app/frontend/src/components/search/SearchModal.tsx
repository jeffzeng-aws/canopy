import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSearch } from '../../hooks/useApi';
import { issueTypeConfig, statusConfig, priorityConfig } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  type: 'project' | 'issue';
  id: string;
  projectId?: string;
  data: any;
}

export function SearchModal() {
  const { dispatch, state, selectIssue, setCurrentProject } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { data: results, isLoading } = useSearch(query);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const close = useCallback(() => dispatch({ type: 'SET_SEARCH', payload: false }), [dispatch]);

  // Flatten results into a single list for keyboard navigation
  const flatResults = useMemo<SearchResult[]>(() => {
    if (!results || !query) return [];
    const items: SearchResult[] = [];
    results.projects.forEach(p => items.push({ type: 'project', id: p.id, data: p }));
    results.issues.forEach(i => items.push({ type: 'issue', id: i.id, projectId: i.projectId, data: i }));
    return items;
  }, [results, query]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [flatResults]);

  const handleSelect = useCallback((item: SearchResult) => {
    if (item.type === 'project') {
      setCurrentProject(item.id);
      navigate(`/project/${item.id}/board`);
    } else {
      selectIssue(item.id);
      if (item.projectId) setCurrentProject(item.projectId);
    }
    close();
  }, [setCurrentProject, navigate, selectIssue, close]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && flatResults.length > 0) {
        e.preventDefault();
        handleSelect(flatResults[selectedIndex]);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [close, flatResults, selectedIndex, handleSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  let resultIndex = -1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[15vh] z-50 animate-fade-in" onClick={close}>
      <div
        className="bg-white dark:bg-[#242B3D] rounded-xl shadow-2xl w-full max-w-xl animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E1DB] dark:border-[#3D4556]">
          <Search size={20} className="text-[#8896A6] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search issues, projects..."
            className="flex-1 text-base bg-transparent focus:outline-none text-[#2D3748] dark:text-[#E8ECF4] placeholder:text-[#8896A6]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#8896A6] hover:text-[#2D3748] dark:hover:text-[#E8ECF4] p-0.5">
              <X size={16} />
            </button>
          )}
          <kbd className="text-[10px] text-[#8896A6] bg-[#f0ede8] dark:bg-[#1A1F2E] px-1.5 py-0.5 rounded border border-[#E5E1DB] dark:border-[#3D4556]">ESC</kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto" ref={listRef}>
          {isLoading && query && (
            <div className="p-4 text-center text-sm text-[#8896A6]">
              <div className="inline-block w-4 h-4 border-2 border-[#D4A373] border-t-transparent rounded-full animate-spin mr-2" />
              Searching...
            </div>
          )}

          {!query && (
            <div className="p-8 text-center">
              <Search size={32} className="mx-auto text-[#c4c0b8] mb-3" />
              <p className="text-sm text-[#8896A6] mb-1">Search issues, projects, and more</p>
              <p className="text-xs text-[#c4c0b8]">Use arrow keys to navigate, Enter to select</p>
            </div>
          )}

          {results && query && (
            <>
              {results.projects.length > 0 && (
                <div className="py-1.5">
                  <p className="px-4 py-1 text-[10px] font-semibold text-[#8896A6] uppercase tracking-wider">Projects</p>
                  {results.projects.map(p => {
                    resultIndex++;
                    const isSelected = resultIndex === selectedIndex;
                    return (
                      <button
                        key={p.id}
                        data-selected={isSelected}
                        onClick={() => handleSelect({ type: 'project', id: p.id, data: p })}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isSelected ? 'bg-[#D4A373]/10 dark:bg-[#D4A373]/15' : 'hover:bg-[#f0ede8] dark:hover:bg-[#2a3144]'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white font-bold flex-shrink-0" style={{ background: p.color || '#52796F' }}>
                          {p.key[0]}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <span className="font-medium text-[#2D3748] dark:text-[#E8ECF4]">{p.name}</span>
                          <span className="text-xs text-[#8896A6] font-mono ml-2">{p.key}</span>
                        </div>
                        {isSelected && <CornerDownLeft size={14} className="text-[#D4A373] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {results.issues.length > 0 && (
                <div className="py-1.5 border-t border-[#E5E1DB] dark:border-[#3D4556]">
                  <p className="px-4 py-1 text-[10px] font-semibold text-[#8896A6] uppercase tracking-wider">Issues</p>
                  {results.issues.map(issue => {
                    resultIndex++;
                    const isSelected = resultIndex === selectedIndex;
                    return (
                      <button
                        key={issue.id}
                        data-selected={isSelected}
                        onClick={() => handleSelect({ type: 'issue', id: issue.id, projectId: issue.projectId, data: issue })}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isSelected ? 'bg-[#D4A373]/10 dark:bg-[#D4A373]/15' : 'hover:bg-[#f0ede8] dark:hover:bg-[#2a3144]'
                        }`}
                      >
                        <span className="flex-shrink-0" style={{ color: issueTypeConfig[issue.type]?.color }}>
                          {issueTypeConfig[issue.type]?.icon}
                        </span>
                        <span className="font-mono text-xs text-[#8896A6] flex-shrink-0">{issue.key}</span>
                        <span className="text-[#2D3748] dark:text-[#E8ECF4] truncate flex-1 text-left">{issue.summary}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ color: statusConfig[issue.status]?.color, backgroundColor: statusConfig[issue.status]?.bg }}
                        >
                          {statusConfig[issue.status]?.label}
                        </span>
                        {isSelected && <CornerDownLeft size={14} className="text-[#D4A373] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {results.total === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#8896A6]">No results found for "<span className="font-medium text-[#5A6578]">{query}</span>"</p>
                  <p className="text-xs text-[#c4c0b8] mt-1">Try a different search term</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[#E5E1DB] dark:border-[#3D4556] bg-[#f8f6f2] dark:bg-[#1E2536]">
          <span className="flex items-center gap-1 text-[10px] text-[#8896A6]">
            <kbd className="px-1 py-0.5 bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded text-[9px] font-mono">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[#8896A6]">
            <kbd className="px-1 py-0.5 bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded text-[9px] font-mono">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[#8896A6]">
            <kbd className="px-1 py-0.5 bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded text-[9px] font-mono">esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
