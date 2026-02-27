import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { BoardView } from './pages/BoardView';
import { BacklogView } from './pages/BacklogView';
import { SprintsView } from './pages/SprintsView';
import { RoadmapView } from './pages/RoadmapView';
import { BurndownView, VelocityView, SprintReportView } from './pages/ReportsView';
import { SettingsView } from './pages/SettingsView';
import { LabelsView } from './pages/LabelsView';
import { ComponentsView } from './pages/ComponentsView';

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
        <Route path="/project/:projectId/reports/burndown" element={<Guarded><BurndownView /></Guarded>} />
        <Route path="/project/:projectId/reports/velocity" element={<Guarded><VelocityView /></Guarded>} />
        <Route path="/project/:projectId/reports/sprint" element={<Guarded><SprintReportView /></Guarded>} />
        <Route path="/project/:projectId/labels" element={<Guarded><LabelsView /></Guarded>} />
        <Route path="/project/:projectId/components" element={<Guarded><ComponentsView /></Guarded>} />
        <Route path="/project/:projectId/settings" element={<Guarded><SettingsView /></Guarded>} />
        <Route path="/project/:projectId/settings/*" element={<Guarded><SettingsView /></Guarded>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
