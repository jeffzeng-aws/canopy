import { test } from '@playwright/test';

async function seedProject(page: any): Promise<string> {
  return await page.evaluate(() => {
    const projectId = crypto.randomUUID();
    const boardId = crypto.randomUUID();
    const sprintId = crypto.randomUUID();
    const epicId = crypto.randomUUID();

    const project = {
      id: projectId, name: 'Canopy Dev', key: 'CAN', color: '#1B4332',
      description: 'Main development project',
      issueCounter: 6, isArchived: false, settings: {},
      createdAt: '2026-02-10T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z',
    };

    const board = {
      id: boardId, projectId, name: 'Board',
      columns: [
        { id: crypto.randomUUID(), name: 'To Do', statusCategory: 'todo', sortOrder: 0 },
        { id: crypto.randomUUID(), name: 'In Progress', statusCategory: 'in_progress', sortOrder: 1 },
        { id: crypto.randomUUID(), name: 'Done', statusCategory: 'done', sortOrder: 2 },
      ],
      swimlaneBy: 'none',
      createdAt: '2026-02-10T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z',
    };

    const issues = [
      { id: epicId, projectId, key: 'CAN-1', type: 'Epic', summary: 'User Authentication System', priority: 'High', status: 'in_progress', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 0, timeSpent: 240, storyPoints: 13, sprintId, createdAt: '2026-02-10T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-2', type: 'Story', summary: 'Login page with OAuth integration', priority: 'High', status: 'done', reporterId: crypto.randomUUID(), epicId, labels: [], components: [], sortOrder: 1, timeSpent: 120, storyPoints: 5, sprintId, createdAt: '2026-02-12T10:00:00.000Z', updatedAt: '2026-02-20T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-3', type: 'Story', summary: 'Session management and JWT tokens', priority: 'Medium', status: 'in_progress', reporterId: crypto.randomUUID(), epicId, labels: [], components: [], sortOrder: 2, timeSpent: 60, storyPoints: 8, sprintId, createdAt: '2026-02-14T10:00:00.000Z', updatedAt: '2026-02-25T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-4', type: 'Task', summary: 'Password reset flow', priority: 'Low', status: 'todo', reporterId: crypto.randomUUID(), epicId, labels: [], components: [], sortOrder: 3, timeSpent: 0, storyPoints: 3, createdAt: '2026-02-16T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-5', type: 'Bug', summary: 'Fix mobile responsive layout', priority: 'High', status: 'todo', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 4, timeSpent: 0, storyPoints: 3, createdAt: '2026-02-18T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-6', type: 'Task', summary: 'Write API documentation', priority: 'Medium', status: 'done', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 5, timeSpent: 180, storyPoints: 5, createdAt: '2026-02-20T10:00:00.000Z', updatedAt: '2026-02-24T10:00:00.000Z' },
    ];

    const sprint = {
      id: sprintId, projectId, name: 'Sprint 1', goal: 'Complete auth system',
      status: 'active', velocity: 0,
      startDate: '2026-02-20T10:00:00.000Z', endDate: '2026-03-06T10:00:00.000Z',
      createdAt: '2026-02-20T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z',
    };

    localStorage.setItem('canopy:projects', JSON.stringify([project]));
    localStorage.setItem('canopy:boards', JSON.stringify([board]));
    localStorage.setItem('canopy:issues', JSON.stringify(issues));
    localStorage.setItem('canopy:sprints', JSON.stringify([sprint]));
    return projectId;
  });
}

test('capture roadmap view', async ({ page }) => {
  await page.goto('http://localhost:6174');
  await page.evaluate(() => localStorage.clear());
  const projectId = await seedProject(page);
  await page.goto(`http://localhost:6174/project/${projectId}/roadmap`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/issue-1/roadmap-seeded.png', fullPage: false });
});

test('capture labels view', async ({ page }) => {
  await page.goto('http://localhost:6174');
  await page.evaluate(() => localStorage.clear());
  const projectId = await seedProject(page);
  await page.goto(`http://localhost:6174/project/${projectId}/labels`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/issue-1/labels-seeded.png', fullPage: false });
});
