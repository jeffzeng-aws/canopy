import { test, expect } from '@playwright/test';

async function seedProject(page: any): Promise<string> {
  return await page.evaluate(() => {
    const projectId = crypto.randomUUID();
    const boardId = crypto.randomUUID();
    const sprintId = crypto.randomUUID();

    const project = {
      id: projectId, name: 'Canopy Dev', key: 'CAN', color: '#1B4332',
      description: 'Main development project for the Canopy platform',
      issueCounter: 5, isArchived: false, settings: {},
      createdAt: '2026-02-10T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z',
    };

    const board = {
      id: boardId, projectId, name: 'Board',
      columns: [
        { id: crypto.randomUUID(), name: 'To Do', statusCategory: 'todo', sortOrder: 0 },
        { id: crypto.randomUUID(), name: 'In Progress', statusCategory: 'in_progress', sortOrder: 1 },
        { id: crypto.randomUUID(), name: 'In Review', statusCategory: 'in_progress', sortOrder: 2 },
        { id: crypto.randomUUID(), name: 'Done', statusCategory: 'done', sortOrder: 3 },
      ],
      swimlaneBy: 'none',
      createdAt: '2026-02-10T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z',
    };

    const issues = [
      { id: crypto.randomUUID(), projectId, key: 'CAN-1', type: 'Epic', summary: 'User Authentication System', priority: 'High', status: 'in_progress', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 0, timeSpent: 240, storyPoints: 13, sprintId, createdAt: '2026-02-12T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-2', type: 'Bug', summary: 'Fix login redirect on mobile', priority: 'Highest', status: 'todo', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 1, timeSpent: 0, storyPoints: 3, sprintId, createdAt: '2026-02-15T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-3', type: 'Task', summary: 'Set up CI/CD pipeline', priority: 'Medium', status: 'done', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 2, timeSpent: 120, storyPoints: 8, sprintId, createdAt: '2026-02-16T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-4', type: 'Story', summary: 'Implement sprint planning view', priority: 'Medium', status: 'in_review', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 3, timeSpent: 0, storyPoints: 5, createdAt: '2026-02-18T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-5', type: 'Story', summary: 'Add drag-and-drop to board', priority: 'Low', status: 'done', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 4, timeSpent: 60, storyPoints: 5, sprintId, createdAt: '2026-02-19T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
    ];

    const sprint = {
      id: sprintId, projectId, name: 'Sprint 1', goal: 'Core auth and CI/CD',
      status: 'active', velocity: 0,
      startDate: '2026-02-20T10:00:00.000Z', endDate: '2026-03-06T10:00:00.000Z',
      createdAt: '2026-02-20T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z',
    };

    localStorage.setItem('canopy:projects', JSON.stringify([project]));
    localStorage.setItem('canopy:boards', JSON.stringify([board]));
    localStorage.setItem('canopy:issues', JSON.stringify(issues));
    localStorage.setItem('canopy:sprints', JSON.stringify([sprint]));
    // Set dark theme
    localStorage.setItem('canopy_theme', 'dark');

    return projectId;
  });
}

test('dark mode board view', async ({ page }) => {
  await page.goto('http://localhost:6174');
  await page.evaluate(() => localStorage.clear());
  const projectId = await seedProject(page);
  await page.goto(`http://localhost:6174/project/${projectId}/board`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/issue-1/board-dark.png', fullPage: false });
});

test('dark mode backlog view', async ({ page }) => {
  await page.goto('http://localhost:6174');
  await page.evaluate(() => localStorage.clear());
  const projectId = await seedProject(page);
  await page.goto(`http://localhost:6174/project/${projectId}/backlog`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/issue-1/backlog-dark.png', fullPage: false });
});
