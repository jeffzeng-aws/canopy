import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:6174';
const PROJECT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

// Helper to seed data before each test
async function seedData(page: any) {
  await page.evaluate(() => {
    const projectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const sprintId = 's1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const sprint2Id = 's2b2c3d4-e5f6-7890-abcd-ef1234567890';
    const sprint3Id = 's3b2c3d4-e5f6-7890-abcd-ef1234567890';
    const now = new Date().toISOString();

    localStorage.setItem('canopy:projects', JSON.stringify([
      { id: projectId, name: 'Canopy App', key: 'CAN', color: '#1B4332', description: 'Main Canopy project management application', icon: '🌲', issueCounter: 12, isArchived: false, settings: {}, createdAt: '2026-01-15T10:00:00.000Z', updatedAt: now },
      { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', name: 'Design System', key: 'DS', color: '#9B59B6', description: 'Component library and design tokens', icon: '🎨', issueCounter: 5, isArchived: false, settings: {}, createdAt: '2026-02-01T10:00:00.000Z', updatedAt: now },
    ]));

    localStorage.setItem('canopy:boards', JSON.stringify([
      { id: 'b1b2c3d4', projectId, name: 'Main Board', columns: [
        { id: 'col1', name: 'To Do', statusCategory: 'todo', sortOrder: 0, color: '#8896A6' },
        { id: 'col2', name: 'In Progress', statusCategory: 'in_progress', sortOrder: 1, color: '#2196F3' },
        { id: 'col3', name: 'In Review', statusCategory: 'in_progress', sortOrder: 2, color: '#E9C46A' },
        { id: 'col4', name: 'Done', statusCategory: 'done', sortOrder: 3, color: '#40916C' },
      ], swimlaneBy: 'none', createdAt: '2026-01-15T10:00:00.000Z', updatedAt: now },
    ]));

    localStorage.setItem('canopy:issues', JSON.stringify([
      { id: 'i001', projectId, key: 'CAN-1', type: 'Epic', status: 'in_progress', summary: 'User Authentication System', priority: 'Highest', reporterId: 'user1', storyPoints: 13, labels: ['security'], components: [], sortOrder: 0, timeSpent: 120, timeEstimate: 480, sprintId, createdAt: '2026-01-15T10:00:00.000Z', updatedAt: now },
      { id: 'i002', projectId, key: 'CAN-2', type: 'Story', status: 'done', summary: 'Design login page mockups', priority: 'High', reporterId: 'user1', storyPoints: 5, labels: ['design'], components: ['UI'], sortOrder: 1, timeSpent: 240, sprintId, resolvedAt: '2026-02-20T14:00:00.000Z', createdAt: '2026-01-16T10:00:00.000Z', updatedAt: now },
      { id: 'i003', projectId, key: 'CAN-3', type: 'Bug', status: 'in_progress', summary: 'Navigation menu not closing on mobile', priority: 'High', reporterId: 'user1', storyPoints: 3, labels: ['bug'], components: ['UI'], sortOrder: 2, timeSpent: 60, sprintId, createdAt: '2026-01-17T10:00:00.000Z', updatedAt: now },
      { id: 'i004', projectId, key: 'CAN-4', type: 'Task', status: 'todo', summary: 'Set up CI/CD pipeline', priority: 'High', reporterId: 'user1', storyPoints: 8, labels: ['devops'], components: [], sortOrder: 3, sprintId, createdAt: '2026-01-18T10:00:00.000Z', updatedAt: now },
      { id: 'i005', projectId, key: 'CAN-5', type: 'Story', status: 'in_review', summary: 'Implement project creation flow', priority: 'Medium', reporterId: 'user1', storyPoints: 5, labels: ['feature'], components: [], sortOrder: 4, sprintId, createdAt: '2026-01-19T10:00:00.000Z', updatedAt: now },
      { id: 'i006', projectId, key: 'CAN-6', type: 'Task', status: 'todo', summary: 'Write API documentation', priority: 'Low', reporterId: 'user1', storyPoints: 3, labels: ['docs'], components: [], sortOrder: 5, createdAt: '2026-01-20T10:00:00.000Z', updatedAt: now },
      { id: 'i007', projectId, key: 'CAN-7', type: 'Story', status: 'todo', summary: 'Implement drag-and-drop on board', priority: 'Medium', reporterId: 'user1', storyPoints: 8, labels: ['feature'], components: [], sortOrder: 6, sprintId: sprint2Id, createdAt: '2026-02-01T10:00:00.000Z', updatedAt: now },
      { id: 'i008', projectId, key: 'CAN-8', type: 'Bug', status: 'todo', summary: 'Story points calculation bug', priority: 'Medium', reporterId: 'user1', storyPoints: 2, labels: ['bug'], components: [], sortOrder: 7, createdAt: '2026-02-05T10:00:00.000Z', updatedAt: now },
      { id: 'i009', projectId, key: 'CAN-9', type: 'Task', status: 'done', summary: 'Database schema design', priority: 'Highest', reporterId: 'user1', storyPoints: 5, labels: ['backend'], components: [], sortOrder: 8, timeSpent: 300, sprintId, resolvedAt: '2026-02-18T16:00:00.000Z', createdAt: '2026-01-15T12:00:00.000Z', updatedAt: now },
      { id: 'i010', projectId, key: 'CAN-10', type: 'Story', status: 'done', summary: 'Implement search functionality', priority: 'Medium', reporterId: 'user1', storyPoints: 5, labels: ['feature'], components: [], sortOrder: 9, timeSpent: 240, sprintId, resolvedAt: '2026-02-22T11:00:00.000Z', createdAt: '2026-02-10T10:00:00.000Z', updatedAt: now },
      { id: 'i011', projectId, key: 'CAN-11', type: 'Epic', status: 'todo', summary: 'Reporting and Analytics Dashboard', priority: 'Medium', reporterId: 'user1', storyPoints: 21, labels: ['feature'], components: [], sortOrder: 10, createdAt: '2026-02-12T10:00:00.000Z', updatedAt: now },
      { id: 'i012', projectId, key: 'CAN-12', type: 'Sub-task', status: 'in_progress', summary: 'Add dark mode toggle', priority: 'Low', reporterId: 'user1', storyPoints: 2, labels: ['ui'], components: [], sortOrder: 11, timeSpent: 60, sprintId: sprint2Id, parentId: 'i001', createdAt: '2026-02-15T10:00:00.000Z', updatedAt: now },
    ]));

    localStorage.setItem('canopy:sprints', JSON.stringify([
      { id: sprintId, projectId, name: 'Sprint 1 - Foundation', goal: 'Core infrastructure and auth', status: 'active', startDate: '2026-02-10T00:00:00.000Z', endDate: '2026-02-24T00:00:00.000Z', velocity: 0, createdAt: '2026-02-08T10:00:00.000Z', updatedAt: now },
      { id: sprint2Id, projectId, name: 'Sprint 2 - Features', goal: 'Board and UI polish', status: 'future', startDate: '2026-02-24T00:00:00.000Z', endDate: '2026-03-10T00:00:00.000Z', velocity: 0, createdAt: '2026-02-20T10:00:00.000Z', updatedAt: now },
      { id: sprint3Id, projectId, name: 'Sprint 0 - Setup', goal: 'Initial setup', status: 'completed', startDate: '2026-01-27T00:00:00.000Z', endDate: '2026-02-10T00:00:00.000Z', velocity: 15, completedAt: '2026-02-10T16:00:00.000Z', createdAt: '2026-01-25T10:00:00.000Z', updatedAt: now },
    ]));

    localStorage.setItem('canopy:comments', JSON.stringify([
      { id: 'c001', issueId: 'i001', authorId: 'user1', body: 'Started OAuth integration with Auth0.', isEdited: false, createdAt: '2026-02-15T14:30:00.000Z', updatedAt: '2026-02-15T14:30:00.000Z' },
      { id: 'c002', issueId: 'i001', authorId: 'user1', body: 'JWT validation working. Refresh tokens next.', isEdited: false, createdAt: '2026-02-18T11:00:00.000Z', updatedAt: '2026-02-18T11:00:00.000Z' },
    ]));

    localStorage.setItem('canopy_currentProject', projectId);
  });
}

test.describe('Page Screenshots with Seeded Data', () => {

  test('dashboard with projects', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Should show project cards - use heading for unique match
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/issue-7/dashboard-with-projects.png', fullPage: false });
  });

  test('board view with issues', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: 'Board' })).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/issue-7/board-with-issues.png', fullPage: false });
  });

  test('backlog view with issues', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/backlog`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.locator('h1').filter({ hasText: 'Backlog' })).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/issue-7/backlog-with-issues.png', fullPage: false });
  });

  test('sprints view', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/sprints`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: 'Sprints' })).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/issue-7/sprints-view.png', fullPage: false });
  });

  test('roadmap view', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/roadmap`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: 'Roadmap' })).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/issue-7/roadmap-view.png', fullPage: false });
  });

  test('burndown report', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/reports/burndown`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/issue-7/burndown-report.png', fullPage: false });
  });

  test('settings view', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: 'Project Settings' })).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/issue-7/settings-view.png', fullPage: false });
  });

  test('issue detail panel', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on an issue card to open detail panel
    const issueCard = page.locator('text=CAN-1').first();
    if (await issueCard.isVisible()) {
      await issueCard.click();
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: 'screenshots/issue-7/issue-detail-panel.png', fullPage: false });
  });

  test('create issue modal', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Press C to open create issue modal
    await page.keyboard.press('c');
    await page.waitForTimeout(800);

    await page.screenshot({ path: 'screenshots/issue-7/create-issue-modal.png', fullPage: false });
  });

  test('dark mode board', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    // Also enable dark mode in localStorage
    await page.evaluate(() => {
      localStorage.setItem('canopy_theme', 'dark');
    });
    await page.goto(`${BASE}/project/${PROJECT_ID}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/issue-7/board-dark-mode.png', fullPage: false });
  });
});
