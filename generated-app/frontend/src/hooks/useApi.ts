import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { CreateProject, UpdateProject, CreateIssue, UpdateIssue, CreateSprint, UpdateSprint, UpdateBoard, BulkUpdateIssues } from '@canopy/shared';

// Projects
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: api.projects.list,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => api.projects.get(id!),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProject) => api.projects.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProject }) => api.projects.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects', id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.projects.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

// Issues
export function useIssues(projectId: string | undefined) {
  return useQuery({
    queryKey: ['issues', projectId],
    queryFn: () => api.issues.list(projectId!),
    enabled: !!projectId,
  });
}

export function useIssue(id: string | undefined) {
  return useQuery({
    queryKey: ['issue', id],
    queryFn: () => api.issues.get(id!),
    enabled: !!id,
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Partial<Omit<CreateIssue, 'projectId'>> & { type: string; summary: string } }) =>
      api.issues.create(projectId, data as any),
    onSuccess: (issue) => {
      qc.invalidateQueries({ queryKey: ['issues', issue.projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIssue }) => api.issues.update(id, data),
    onSuccess: (issue) => {
      qc.invalidateQueries({ queryKey: ['issues'] });
      qc.invalidateQueries({ queryKey: ['issue', issue.id] });
    },
  });
}

export function useDeleteIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.issues.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issues'] }),
  });
}

export function useBulkUpdateIssues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkUpdateIssues) => api.issues.bulkUpdate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issues'] }),
  });
}

// Sprints
export function useSprints(projectId: string | undefined) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => api.sprints.list(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Omit<CreateSprint, 'projectId'> }) =>
      api.sprints.create(projectId, data),
    onSuccess: (sprint) => {
      qc.invalidateQueries({ queryKey: ['sprints', sprint.projectId] });
    },
  });
}

export function useUpdateSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSprint }) => api.sprints.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints'] }),
  });
}

// Boards
export function useBoard(projectId: string | undefined) {
  return useQuery({
    queryKey: ['board', projectId],
    queryFn: () => api.boards.get(projectId!),
    enabled: !!projectId,
  });
}

export function useUpdateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBoard }) => api.boards.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board'] }),
  });
}

// Search
export function useSearch(query: string, projectId?: string) {
  return useQuery({
    queryKey: ['search', query, projectId],
    queryFn: () => api.search(query, projectId),
    enabled: query.length > 0,
  });
}
