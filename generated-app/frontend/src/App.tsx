import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { BoardView } from './pages/BoardView';
import { BacklogView } from './pages/BacklogView';
import { SprintsView } from './pages/SprintsView';
import { RoadmapView } from './pages/RoadmapView';
import { BurndownView, VelocityView, SprintReportView } from './pages/ReportsView';
import { SettingsView } from './pages/SettingsView';
import { LabelsView } from './pages/LabelsView';
import { ComponentsView } from './pages/ComponentsView';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/project/:projectId/board" element={<BoardView />} />
        <Route path="/project/:projectId/backlog" element={<BacklogView />} />
        <Route path="/project/:projectId/sprints" element={<SprintsView />} />
        <Route path="/project/:projectId/roadmap" element={<RoadmapView />} />
        <Route path="/project/:projectId/reports/burndown" element={<BurndownView />} />
        <Route path="/project/:projectId/reports/velocity" element={<VelocityView />} />
        <Route path="/project/:projectId/reports/sprint" element={<SprintReportView />} />
        <Route path="/project/:projectId/labels" element={<LabelsView />} />
        <Route path="/project/:projectId/components" element={<ComponentsView />} />
        <Route path="/project/:projectId/settings" element={<SettingsView />} />
        <Route path="/project/:projectId/settings/*" element={<SettingsView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
