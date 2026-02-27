import type {
  Project, CreateProject, UpdateProject,
  Issue, CreateIssue, UpdateIssue, BulkUpdateIssues,
  Sprint, CreateSprint, UpdateSprint,
  Board, UpdateBoard,
  Comment, CreateComment,
  SearchResult,
} from '@canopy/shared';

const API_URL = import.meta.env.VITE_API_URL || '';

let useLocalStorage = !API_URL;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (useLocalStorage) {
    throw new Error('API_UNAVAILABLE');
  }
  const url = `${API_URL}${path}`;
  try {
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
  } catch (err: any) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      useLocalStorage = true;
      throw new Error('API_UNAVAILABLE');
    }
    throw err;
  }
}

// ─── localStorage helpers ───────────────────────────────────────────
function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`canopy:${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function lsSet(key: string, value: unknown) {
  localStorage.setItem(`canopy:${key}`, JSON.stringify(value));
}

function uuid() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

// ─── localStorage-backed storage ────────────────────────────────────
const local = {
  projects: {
    list: (): Project[] => lsGet<Project[]>('projects', []),
    get: (id: string): Project | undefined => {
      return local.projects.list().find(p => p.id === id);
    },
    create: (data: CreateProject): Project => {
      const projects = local.projects.list();
      const project: Project = {
        id: uuid(),
        name: data.name,
        key: data.key,
        description: data.description,
        color: data.color,
        icon: data.icon,
        leadUserId: data.leadUserId,
        defaultAssigneeId: data.defaultAssigneeId,
        issueCounter: 0,
        isArchived: false,
        settings: {},
        createdAt: now(),
        updatedAt: now(),
      };
      projects.push(project);
      lsSet('projects', projects);
      // Create default board
      const board: Board = {
        id: uuid(),
        projectId: project.id,
        name: 'Board',
        columns: [
          { id: uuid(), name: 'To Do', statusCategory: 'todo', sortOrder: 0 },
          { id: uuid(), name: 'In Progress', statusCategory: 'in_progress', sortOrder: 1 },
          { id: uuid(), name: 'In Review', statusCategory: 'in_progress', sortOrder: 2 },
          { id: uuid(), name: 'Done', statusCategory: 'done', sortOrder: 3 },
        ],
        swimlaneBy: 'none',
        createdAt: now(),
        updatedAt: now(),
      };
      const boards = lsGet<Board[]>('boards', []);
      boards.push(board);
      lsSet('boards', boards);
      return project;
    },
    update: (id: string, data: UpdateProject): Project => {
      const projects = local.projects.list();
      const idx = projects.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Project not found');
      projects[idx] = { ...projects[idx], ...data, updatedAt: now() };
      lsSet('projects', projects);
      return projects[idx];
    },
    delete: (id: string) => {
      const projects = local.projects.list().filter(p => p.id !== id);
      lsSet('projects', projects);
      // Also delete related issues, sprints, boards
      const issues = lsGet<Issue[]>('issues', []).filter(i => i.projectId !== id);
      lsSet('issues', issues);
      const sprints = lsGet<Sprint[]>('sprints', []).filter(s => s.projectId !== id);
      lsSet('sprints', sprints);
      const boards = lsGet<Board[]>('boards', []).filter(b => b.projectId !== id);
      lsSet('boards', boards);
      return { success: true };
    },
  },

  issues: {
    list: (projectId: string): Issue[] => {
      return lsGet<Issue[]>('issues', []).filter(i => i.projectId === projectId);
    },
    get: (id: string): Issue | undefined => {
      return lsGet<Issue[]>('issues', []).find(i => i.id === id);
    },
    create: (projectId: string, data: Omit<CreateIssue, 'projectId'>): Issue => {
      const issues = lsGet<Issue[]>('issues', []);
      const projects = lsGet<Project[]>('projects', []);
      const projIdx = projects.findIndex(p => p.id === projectId);
      if (projIdx === -1) throw new Error('Project not found');

      const project = projects[projIdx];
      const counter = (project.issueCounter || 0) + 1;
      projects[projIdx] = { ...project, issueCounter: counter, updatedAt: now() };
      lsSet('projects', projects);

      const issue: Issue = {
        id: uuid(),
        projectId,
        key: `${project.key}-${counter}`,
        type: data.type || 'Task',
        summary: data.summary,
        description: data.description,
        priority: data.priority || 'Medium',
        status: 'todo',
        reporterId: uuid(),
        assigneeId: data.assigneeId,
        epicId: data.epicId,
        parentId: data.parentId,
        sprintId: data.sprintId,
        storyPoints: data.storyPoints,
        labels: data.labels || [],
        components: data.components || [],
        dueDate: data.dueDate,
        timeEstimate: data.timeEstimate,
        sortOrder: issues.filter(i => i.projectId === projectId).length,
        timeSpent: 0,
        createdAt: now(),
        updatedAt: now(),
      };
      issues.push(issue);
      lsSet('issues', issues);
      return issue;
    },
    update: (id: string, data: UpdateIssue): Issue => {
      const issues = lsGet<Issue[]>('issues', []);
      const idx = issues.findIndex(i => i.id === id);
      if (idx === -1) throw new Error('Issue not found');
      issues[idx] = { ...issues[idx], ...data, updatedAt: now() };
      lsSet('issues', issues);
      return issues[idx];
    },
    delete: (id: string) => {
      const issues = lsGet<Issue[]>('issues', []).filter(i => i.id !== id);
      lsSet('issues', issues);
      return { success: true };
    },
    bulkUpdate: (data: BulkUpdateIssues): Issue[] => {
      const issues = lsGet<Issue[]>('issues', []);
      const updated: Issue[] = [];
      for (const issueId of data.issueIds) {
        const idx = issues.findIndex(i => i.id === issueId);
        if (idx !== -1) {
          issues[idx] = { ...issues[idx], ...data.update, updatedAt: now() };
          updated.push(issues[idx]);
        }
      }
      lsSet('issues', issues);
      return updated;
    },
  },

  sprints: {
    list: (projectId: string): Sprint[] => {
      return lsGet<Sprint[]>('sprints', []).filter(s => s.projectId === projectId);
    },
    create: (projectId: string, data: Omit<CreateSprint, 'projectId'>): Sprint => {
      const sprints = lsGet<Sprint[]>('sprints', []);
      const sprint: Sprint = {
        id: uuid(),
        projectId,
        name: data.name,
        goal: data.goal,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'future',
        velocity: 0,
        createdAt: now(),
        updatedAt: now(),
      };
      sprints.push(sprint);
      lsSet('sprints', sprints);
      return sprint;
    },
    update: (id: string, data: UpdateSprint): Sprint => {
      const sprints = lsGet<Sprint[]>('sprints', []);
      const idx = sprints.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Sprint not found');
      sprints[idx] = { ...sprints[idx], ...data, updatedAt: now() };
      lsSet('sprints', sprints);
      return sprints[idx];
    },
  },

  boards: {
    get: (projectId: string): Board | undefined => {
      return lsGet<Board[]>('boards', []).find(b => b.projectId === projectId);
    },
    update: (id: string, data: UpdateBoard): Board => {
      const boards = lsGet<Board[]>('boards', []);
      const idx = boards.findIndex(b => b.id === id);
      if (idx === -1) throw new Error('Board not found');
      boards[idx] = { ...boards[idx], ...data, updatedAt: now() };
      lsSet('boards', boards);
      return boards[idx];
    },
  },

  comments: {
    list: (issueId: string): Comment[] => {
      return lsGet<Comment[]>('comments', []).filter(c => c.issueId === issueId);
    },
    add: (issueId: string, data: Omit<CreateComment, 'issueId'>): Comment => {
      const comments = lsGet<Comment[]>('comments', []);
      const comment: Comment = {
        id: uuid(),
        issueId,
        authorId: uuid(),
        body: data.body,
        isEdited: false,
        createdAt: now(),
        updatedAt: now(),
      };
      comments.push(comment);
      lsSet('comments', comments);
      return comment;
    },
  },

  search: (q: string, projectId?: string): SearchResult => {
    const query = q.toLowerCase();
    const allProjects = lsGet<Project[]>('projects', []);
    const allIssues = lsGet<Issue[]>('issues', []);

    const projects = allProjects.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.key.toLowerCase().includes(query)
    );
    let issues = allIssues.filter(i =>
      i.summary.toLowerCase().includes(query) ||
      i.key.toLowerCase().includes(query) ||
      (i.description || '').toLowerCase().includes(query)
    );
    if (projectId) {
      issues = issues.filter(i => i.projectId === projectId);
    }
    return { projects, issues, total: projects.length + issues.length };
  },
};

// ─── Unified API client ─────────────────────────────────────────────
export const api = {
  projects: {
    list: async (): Promise<Project[]> => {
      try {
        return await request<Project[]>('/projects');
      } catch {
        return local.projects.list();
      }
    },
    get: async (id: string): Promise<Project> => {
      try {
        return await request<Project>(`/projects/${id}`);
      } catch {
        const p = local.projects.get(id);
        if (!p) throw new Error('Project not found');
        return p;
      }
    },
    create: async (data: CreateProject): Promise<Project> => {
      try {
        return await request<Project>('/projects', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch {
        return local.projects.create(data);
      }
    },
    update: async (id: string, data: UpdateProject): Promise<Project> => {
      try {
        return await request<Project>(`/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch {
        return local.projects.update(id, data);
      }
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
      try {
        return await request<{ success: boolean }>(`/projects/${id}`, {
          method: 'DELETE',
        });
      } catch {
        return local.projects.delete(id);
      }
    },
  },

  issues: {
    list: async (projectId: string): Promise<Issue[]> => {
      try {
        return await request<Issue[]>(`/projects/${projectId}/issues`);
      } catch {
        return local.issues.list(projectId);
      }
    },
    get: async (id: string): Promise<Issue> => {
      try {
        return await request<Issue>(`/issues/${id}`);
      } catch {
        const issue = local.issues.get(id);
        if (!issue) throw new Error('Issue not found');
        return issue;
      }
    },
    create: async (projectId: string, data: Omit<CreateIssue, 'projectId'>): Promise<Issue> => {
      try {
        return await request<Issue>(`/projects/${projectId}/issues`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch {
        return local.issues.create(projectId, data);
      }
    },
    update: async (id: string, data: UpdateIssue): Promise<Issue> => {
      try {
        return await request<Issue>(`/issues/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch {
        return local.issues.update(id, data);
      }
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
      try {
        return await request<{ success: boolean }>(`/issues/${id}`, {
          method: 'DELETE',
        });
      } catch {
        return local.issues.delete(id);
      }
    },
    bulkUpdate: async (data: BulkUpdateIssues): Promise<Issue[]> => {
      try {
        return await request<Issue[]>('/issues/bulk', {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch {
        return local.issues.bulkUpdate(data);
      }
    },
  },

  sprints: {
    list: async (projectId: string): Promise<Sprint[]> => {
      try {
        return await request<Sprint[]>(`/projects/${projectId}/sprints`);
      } catch {
        return local.sprints.list(projectId);
      }
    },
    create: async (projectId: string, data: Omit<CreateSprint, 'projectId'>): Promise<Sprint> => {
      try {
        return await request<Sprint>(`/projects/${projectId}/sprints`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch {
        return local.sprints.create(projectId, data);
      }
    },
    update: async (id: string, data: UpdateSprint): Promise<Sprint> => {
      try {
        return await request<Sprint>(`/sprints/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch {
        return local.sprints.update(id, data);
      }
    },
  },

  boards: {
    get: async (projectId: string): Promise<Board> => {
      try {
        return await request<Board>(`/projects/${projectId}/board`);
      } catch {
        const board = local.boards.get(projectId);
        if (!board) {
          // Create default board
          const defaultBoard: Board = {
            id: uuid(),
            projectId,
            name: 'Board',
            columns: [
              { id: uuid(), name: 'To Do', statusCategory: 'todo', sortOrder: 0 },
              { id: uuid(), name: 'In Progress', statusCategory: 'in_progress', sortOrder: 1 },
              { id: uuid(), name: 'In Review', statusCategory: 'in_progress', sortOrder: 2 },
              { id: uuid(), name: 'Done', statusCategory: 'done', sortOrder: 3 },
            ],
            swimlaneBy: 'none',
            createdAt: now(),
            updatedAt: now(),
          };
          const boards = lsGet<Board[]>('boards', []);
          boards.push(defaultBoard);
          lsSet('boards', boards);
          return defaultBoard;
        }
        return board;
      }
    },
    update: async (id: string, data: UpdateBoard): Promise<Board> => {
      try {
        return await request<Board>(`/boards/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch {
        return local.boards.update(id, data);
      }
    },
  },

  comments: {
    add: async (issueId: string, data: Omit<CreateComment, 'issueId'>): Promise<Comment> => {
      try {
        return await request<Comment>(`/issues/${issueId}/comments`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch {
        return local.comments.add(issueId, data);
      }
    },
  },

  search: async (q: string, projectId?: string): Promise<SearchResult> => {
    try {
      return await request<SearchResult>(`/search?q=${encodeURIComponent(q)}${projectId ? `&projectId=${projectId}` : ''}`);
    } catch {
      return local.search(q, projectId);
    }
  },
};
