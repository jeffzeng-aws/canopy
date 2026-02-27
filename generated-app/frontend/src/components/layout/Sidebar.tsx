import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Columns3, List, Target, BarChart3,
  TrendingUp, FileText, Settings, Tag, Layers,
  ChevronLeft, FolderPlus, Briefcase
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  section?: string;
}

export function Sidebar() {
  const { state, toggleSidebar } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = state.sidebarCollapsed;
  const projectId = state.currentProjectId;

  const projectNavItems: NavItem[] = projectId ? [
    { icon: <Columns3 size={20} />, label: 'Board', path: `/project/${projectId}/board`, section: 'Board' },
    { icon: <List size={20} />, label: 'Backlog', path: `/project/${projectId}/backlog`, section: 'Planning' },
    { icon: <Target size={20} />, label: 'Sprints', path: `/project/${projectId}/sprints`, section: 'Planning' },
    { icon: <LayoutDashboard size={20} />, label: 'Roadmap', path: `/project/${projectId}/roadmap`, section: 'Planning' },
    { icon: <BarChart3 size={20} />, label: 'Burndown', path: `/project/${projectId}/reports/burndown`, section: 'Reports' },
    { icon: <TrendingUp size={20} />, label: 'Velocity', path: `/project/${projectId}/reports/velocity`, section: 'Reports' },
    { icon: <FileText size={20} />, label: 'Sprint Report', path: `/project/${projectId}/reports/sprint`, section: 'Reports' },
    { icon: <Tag size={20} />, label: 'Labels', path: `/project/${projectId}/labels`, section: 'Project' },
    { icon: <Layers size={20} />, label: 'Components', path: `/project/${projectId}/components`, section: 'Project' },
    { icon: <Settings size={20} />, label: 'Settings', path: `/project/${projectId}/settings`, section: 'Project' },
  ] : [];

  const sections = projectNavItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const section = item.section || 'Other';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  return (
    <aside
      className={cn(
        'h-[calc(100vh-56px)] bg-[#F5F3EF] border-r border-[#E5E1DB] flex flex-col transition-all duration-200 ease-in-out overflow-hidden',
        'dark:bg-[#151922] dark:border-[#3D4556]',
        collapsed ? 'w-[60px]' : 'w-[240px]'
      )}
    >
      <div className="flex-1 overflow-y-auto py-2">
        {projectId ? (
          Object.entries(sections).map(([section, items]) => (
            <div key={section} className="mb-2">
              {!collapsed && (
                <p className="px-4 py-1.5 text-[11px] font-semibold text-[#8896A6] uppercase tracking-wider">
                  {section}
                </p>
              )}
              {items.map(item => {
                const isActive = location.pathname === item.path || (item.path.endsWith('/settings') && location.pathname.startsWith(item.path));
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-[rgba(212,163,115,0.15)] text-[#D4A373] font-medium border-l-2 border-[#D4A373]'
                        : 'text-[#5A6578] hover:bg-[#f0ede8] hover:text-[#2D3748] border-l-2 border-transparent',
                      collapsed && 'justify-center px-0'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))
        ) : (
          <div className="p-2">
            {!collapsed && (
              <p className="px-2 py-1.5 text-[11px] font-semibold text-[#8896A6] uppercase tracking-wider">
                Navigation
              </p>
            )}
            <button
              onClick={() => navigate('/')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2 text-sm text-[#5A6578] hover:bg-[#f0ede8] rounded-md transition-colors',
                location.pathname === '/' && 'bg-[rgba(212,163,115,0.15)] text-[#D4A373] font-medium',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? 'Dashboard' : undefined}
            >
              <LayoutDashboard size={20} />
              {!collapsed && <span>Dashboard</span>}
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-[#E5E1DB] dark:border-[#3D4556] p-2">
        <button
          onClick={() => navigate('/')}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2 text-sm text-[#5A6578] hover:bg-[#f0ede8] rounded-md transition-colors',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'All Projects' : undefined}
        >
          <Briefcase size={20} />
          {!collapsed && <span>All Projects</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2 text-sm text-[#8896A6] hover:bg-[#f0ede8] rounded-md transition-colors',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={20} className={cn('transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
