import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { CreateIssueModal } from '../issues/CreateIssueModal';
import { SearchModal } from '../search/SearchModal';
import { IssueDetailPanel } from '../issues/IssueDetailPanel';
import { useApp } from '../../context/AppContext';
import { Toast } from '../ui/Toast';
import { KeyboardShortcuts } from '../ui/KeyboardShortcuts';

export function AppLayout() {
  const { state, dispatch, toggleCreateModal, toggleSidebar, toggleSearch } = useApp();

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip if in input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      // ⌘K or Ctrl+K: Open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
        return;
      }

      // ⌘[ or Ctrl+[: Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // C: Create issue (when no modal/panel is open)
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !state.createModalOpen && !state.searchOpen && !state.selectedIssueId) {
        e.preventDefault();
        toggleCreateModal();
        return;
      }

      // Escape: Close any open modal/panel
      if (e.key === 'Escape') {
        if (state.createModalOpen) {
          dispatch({ type: 'SET_CREATE_MODAL', payload: false });
        } else if (state.searchOpen) {
          dispatch({ type: 'SET_SEARCH', payload: false });
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.createModalOpen, state.searchOpen, state.selectedIssueId, dispatch, toggleCreateModal, toggleSidebar, toggleSearch]);

  return (
    <div className="h-screen flex flex-col bg-[#FAF9F6] dark:bg-[#1A1F2E]">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main data-testid="main-content" className="flex-1 overflow-auto">
          <div className="max-w-[1400px] mx-auto p-6">
            <Outlet />
          </div>
        </main>
        {state.selectedIssueId && <IssueDetailPanel />}
      </div>
      {state.createModalOpen && <CreateIssueModal />}
      {state.searchOpen && <SearchModal />}
      <Toast />
      <KeyboardShortcuts />
    </div>
  );
}
