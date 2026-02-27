import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { BoardView } from './pages/BoardView';
import { BacklogView } from './pages/BacklogView';
import { SprintsView } from './pages/SprintsView';
import { RoadmapView } from './pages/RoadmapView';
import { SettingsView } from './pages/SettingsView';
import { LabelsView } from './pages/LabelsView';
import { ComponentsView } from './pages/ComponentsView';

// Lazy-load reports (Recharts is heavy)
const LazyBurndown = React.lazy(() => import('./pages/ReportsView').then(m => ({ default: m.BurndownView })));
const LazyVelocity = React.lazy(() => import('./pages/ReportsView').then(m => ({ default: m.VelocityView })));
const LazySprintReport = React.lazy(() => import('./pages/ReportsView').then(m => ({ default: m.SprintReportView })));

function LoadingFallback() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="h-8 w-40 animate-shimmer rounded" />
      <div className="h-64 animate-shimmer rounded-lg" />
    </div>
  );
}

function Guarded({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Guarded><Dashboard /></Guarded>} />
        <Route path="/project/:projectId/board" element={<Guarded><BoardView /></Guarded>} />
        <Route path="/project/:projectId/backlog" element={<Guarded><BacklogView /></Guarded>} />
        <Route path="/project/:projectId/sprints" element={<Guarded><SprintsView /></Guarded>} />
        <Route path="/project/:projectId/roadmap" element={<Guarded><RoadmapView /></Guarded>} />
        <Route path="/project/:projectId/reports/burndown" element={<Guarded><Suspense fallback={<LoadingFallback />}><LazyBurndown /></Suspense></Guarded>} />
        <Route path="/project/:projectId/reports/velocity" element={<Guarded><Suspense fallback={<LoadingFallback />}><LazyVelocity /></Suspense></Guarded>} />
        <Route path="/project/:projectId/reports/sprint" element={<Guarded><Suspense fallback={<LoadingFallback />}><LazySprintReport /></Suspense></Guarded>} />
        <Route path="/project/:projectId/labels" element={<Guarded><LabelsView /></Guarded>} />
        <Route path="/project/:projectId/components" element={<Guarded><ComponentsView /></Guarded>} />
        <Route path="/project/:projectId/settings" element={<Guarded><SettingsView /></Guarded>} />
        <Route path="/project/:projectId/settings/*" element={<Guarded><SettingsView /></Guarded>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
