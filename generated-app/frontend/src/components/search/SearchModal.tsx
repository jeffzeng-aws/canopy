import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSearch } from '../../hooks/useApi';
import { issueTypeConfig } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export function SearchModal() {
  const { dispatch, state, selectIssue, setCurrentProject } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: results, isLoading } = useSearch(query);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_SEARCH', payload: false });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  const close = () => dispatch({ type: 'SET_SEARCH', payload: false });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50 animate-fade-in" onClick={close}>
      <div
        className="bg-white dark:bg-[#242B3D] rounded-xl shadow-2xl w-full max-w-xl animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E1DB] dark:border-[#3D4556]">
          <Search size={20} className="text-[#8896A6]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search issues, projects..."
            className="flex-1 text-base bg-transparent focus:outline-none text-[#2D3748] dark:text-[#E8ECF4] placeholder:text-[#8896A6]"
          />
          <button onClick={close} className="text-[#8896A6] hover:text-[#2D3748]">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading && query && (
            <div className="p-4 text-center text-sm text-[#8896A6]">Searching...</div>
          )}

          {!query && (
            <div className="p-6 text-center text-sm text-[#8896A6]">
              Start typing to search issues and projects
            </div>
          )}

          {results && query && (
            <>
              {results.projects.length > 0 && (
                <div className="py-2">
                  <p className="px-4 py-1 text-xs font-semibold text-[#8896A6] uppercase tracking-wider">Projects</p>
                  {results.projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setCurrentProject(p.id);
                        navigate(`/project/${p.id}/board`);
                        close();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0ede8] dark:hover:bg-[#2a3144] text-sm text-[#2D3748] dark:text-[#E8ECF4] transition-colors"
                    >
                      <div className="w-6 h-6 rounded flex items-center justify-center text-xs text-white font-bold" style={{ background: p.color || '#52796F' }}>
                        {p.key[0]}
                      </div>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-[#8896A6] font-mono">{p.key}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.issues.length > 0 && (
                <div className="py-2 border-t border-[#E5E1DB] dark:border-[#3D4556]">
                  <p className="px-4 py-1 text-xs font-semibold text-[#8896A6] uppercase tracking-wider">Issues</p>
                  {results.issues.map(issue => (
                    <button
                      key={issue.id}
                      onClick={() => {
                        selectIssue(issue.id);
                        if (issue.projectId) {
                          setCurrentProject(issue.projectId);
                        }
                        close();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0ede8] dark:hover:bg-[#2a3144] text-sm transition-colors"
                    >
                      <span style={{ color: issueTypeConfig[issue.type]?.color }}>
                        {issueTypeConfig[issue.type]?.icon}
                      </span>
                      <span className="font-mono text-xs text-[#8896A6]">{issue.key}</span>
                      <span className="text-[#2D3748] dark:text-[#E8ECF4] truncate">{issue.summary}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.total === 0 && (
                <div className="p-6 text-center text-sm text-[#8896A6]">
                  No results found for "{query}"
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
