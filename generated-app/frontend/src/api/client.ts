import type {
  Project, CreateProject, UpdateProject,
  Issue, CreateIssue, UpdateIssue, BulkUpdateIssues,
  Sprint, CreateSprint, UpdateSprint,
  Board, UpdateBoard,
  Comment, CreateComment,
  SearchResult,
} from '@canopy/shared';

const API_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(error?.error?.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// Projects
export const api = {
  projects: {
    list: () => request<Project[]>('/projects'),
    get: (id: string) => request<Project>(`/projects/${id}`),
    create: (data: CreateProject) => request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: UpdateProject) => request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request<{ success: boolean }>(`/projects/${id}`, {
      method: 'DELETE',
    }),
  },

  issues: {
    list: (projectId: string) => request<Issue[]>(`/projects/${projectId}/issues`),
    get: (id: string) => request<Issue>(`/issues/${id}`),
    create: (projectId: string, data: Omit<CreateIssue, 'projectId'>) =>
      request<Issue>(`/projects/${projectId}/issues`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateIssue) => request<Issue>(`/issues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request<{ success: boolean }>(`/issues/${id}`, {
      method: 'DELETE',
    }),
    bulkUpdate: (data: BulkUpdateIssues) => request<Issue[]>('/issues/bulk', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },

  sprints: {
    list: (projectId: string) => request<Sprint[]>(`/projects/${projectId}/sprints`),
    create: (projectId: string, data: Omit<CreateSprint, 'projectId'>) =>
      request<Sprint>(`/projects/${projectId}/sprints`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateSprint) => request<Sprint>(`/sprints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },

  boards: {
    get: (projectId: string) => request<Board>(`/projects/${projectId}/board`),
    update: (id: string, data: UpdateBoard) => request<Board>(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },

  comments: {
    add: (issueId: string, data: Omit<CreateComment, 'issueId'>) =>
      request<Comment>(`/issues/${issueId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  search: (q: string, projectId?: string) =>
    request<SearchResult>(`/search?q=${encodeURIComponent(q)}${projectId ? `&projectId=${projectId}` : ''}`),
};
