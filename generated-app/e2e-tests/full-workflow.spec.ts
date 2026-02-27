import { test, expect } from '@playwright/test';

// Seed data helper - returns projectId
async function seedProject(page: any): Promise<string> {
  return await page.evaluate(() => {
    const projectId = crypto.randomUUID();
    const boardId = crypto.randomUUID();
    const sprintId = crypto.randomUUID();

    const project = {
      id: projectId, name: 'Canopy Dev', key: 'CAN', color: '#1B4332',
      issueCounter: 5, isArchived: false, settings: {},
      createdAt: '2026-02-20T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z',
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
      createdAt: '2026-02-20T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z',
    };

    const issues = [
      { id: crypto.randomUUID(), projectId, key: 'CAN-1', type: 'Story', summary: 'Implement user authentication', priority: 'High', status: 'in_progress', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 0, timeSpent: 0, storyPoints: 5, sprintId, createdAt: '2026-02-21T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-2', type: 'Bug', summary: 'Fix login redirect on mobile', priority: 'Highest', status: 'todo', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 1, timeSpent: 0, storyPoints: 3, sprintId, createdAt: '2026-02-22T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-3', type: 'Task', summary: 'Set up CI/CD pipeline', priority: 'Medium', status: 'done', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 2, timeSpent: 120, storyPoints: 8, sprintId, createdAt: '2026-02-23T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-4', type: 'Epic', summary: 'Sprint planning module', priority: 'Medium', status: 'todo', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 3, timeSpent: 0, storyPoints: 13, createdAt: '2026-02-24T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-5', type: 'Story', summary: 'Add drag-and-drop to board view', priority: 'Low', status: 'in_review', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 4, timeSpent: 60, storyPoints: 5, createdAt: '2026-02-25T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
    ];

    const sprint = {
      id: sprintId, projectId, name: 'Sprint 1', goal: 'Complete authentication',
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

test.describe('Full workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:6174');
    await page.evaluate(() => localStorage.clear());
  });

  test('board view shows kanban columns with issues', async ({ page }) => {
    const projectId = await seedProject(page);
    await page.goto(`http://localhost:6174/project/${projectId}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should show board columns in main area
    await expect(page.locator('main').getByText('To Do')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('main').getByText('In Progress')).toBeVisible();
    await expect(page.locator('main').getByText('Done')).toBeVisible();
    // Should show issue cards (at least some)
    await expect(page.locator('main').getByText('CAN-2')).toBeVisible();
  });

  test('backlog view shows sprint and backlog sections', async ({ page }) => {
    const projectId = await seedProject(page);
    await page.goto(`http://localhost:6174/project/${projectId}/backlog`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should show sprint section and issues
    await expect(page.locator('main').getByText('Sprint 1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('main').getByText('CAN-1')).toBeVisible();
  });

  test('sprints view shows sprint', async ({ page }) => {
    const projectId = await seedProject(page);
    await page.goto(`http://localhost:6174/project/${projectId}/sprints`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should show sprint content
    await expect(page.locator('main').getByText('Sprint 1')).toBeVisible({ timeout: 10000 });
  });

  test('settings view shows project settings', async ({ page }) => {
    const projectId = await seedProject(page);
    await page.goto(`http://localhost:6174/project/${projectId}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should show General section in settings
    await expect(page.locator('main').getByText('General')).toBeVisible({ timeout: 10000 });
  });
});
