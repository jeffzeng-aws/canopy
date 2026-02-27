import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { CreateIssueModal } from '../issues/CreateIssueModal';
import { SearchModal } from '../search/SearchModal';
import { IssueDetailPanel } from '../issues/IssueDetailPanel';
import { useApp } from '../../context/AppContext';
import { Toast } from '../ui/Toast';

export function AppLayout() {
  const { state } = useApp();

  return (
    <div className="h-screen flex flex-col bg-[#FAF9F6] dark:bg-[#1A1F2E]">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1400px] mx-auto p-6">
            <Outlet />
          </div>
        </main>
        {state.selectedIssueId && <IssueDetailPanel />}
      </div>
      {state.createModalOpen && <CreateIssueModal />}
      {state.searchOpen && <SearchModal />}
      <Toast />
    </div>
  );
}
