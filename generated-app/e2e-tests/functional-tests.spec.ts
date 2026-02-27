import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:6174';
const PROJECT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

async function seedData(page: any) {
  await page.evaluate(() => {
    const projectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const sprintId = 's1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const now = new Date().toISOString();

    localStorage.setItem('canopy:projects', JSON.stringify([
      { id: projectId, name: 'Canopy App', key: 'CAN', color: '#1B4332', description: 'Main app', icon: '🌲', issueCounter: 5, isArchived: false, settings: {}, createdAt: '2026-01-15T10:00:00.000Z', updatedAt: now },
    ]));

    localStorage.setItem('canopy:boards', JSON.stringify([
      { id: 'b1', projectId, name: 'Board', columns: [
        { id: 'c1', name: 'To Do', statusCategory: 'todo', sortOrder: 0, color: '#8896A6' },
        { id: 'c2', name: 'In Progress', statusCategory: 'in_progress', sortOrder: 1, color: '#2196F3' },
        { id: 'c3', name: 'In Review', statusCategory: 'in_progress', sortOrder: 2, color: '#E9C46A' },
        { id: 'c4', name: 'Done', statusCategory: 'done', sortOrder: 3, color: '#40916C' },
      ], swimlaneBy: 'none', createdAt: now, updatedAt: now },
    ]));

    localStorage.setItem('canopy:issues', JSON.stringify([
      { id: 'i1', projectId, key: 'CAN-1', type: 'Bug', status: 'todo', summary: 'Fix login button', priority: 'High', reporterId: 'u1', storyPoints: 3, labels: ['bug'], components: [], sortOrder: 0, sprintId, createdAt: now, updatedAt: now },
      { id: 'i2', projectId, key: 'CAN-2', type: 'Story', status: 'in_progress', summary: 'Add user profiles', priority: 'Medium', reporterId: 'u1', storyPoints: 5, labels: ['feature'], components: [], sortOrder: 1, sprintId, createdAt: now, updatedAt: now },
      { id: 'i3', projectId, key: 'CAN-3', type: 'Task', status: 'done', summary: 'Write unit tests', priority: 'Low', reporterId: 'u1', storyPoints: 2, labels: [], components: [], sortOrder: 2, resolvedAt: now, createdAt: now, updatedAt: now },
    ]));

    localStorage.setItem('canopy:sprints', JSON.stringify([
      { id: sprintId, projectId, name: 'Sprint 1', goal: 'MVP features', status: 'active', startDate: '2026-02-10T00:00:00.000Z', endDate: '2026-02-24T00:00:00.000Z', velocity: 0, createdAt: now, updatedAt: now },
    ]));

    localStorage.setItem('canopy:comments', JSON.stringify([]));
    localStorage.setItem('canopy_currentProject', projectId);
  });
}

test.describe('Functional Tests', () => {
  test('create issue via modal', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Open create modal with C key
    await page.keyboard.press('c');
    await page.waitForTimeout(500);

    // Verify modal is open
    await expect(page.locator('[data-testid="create-issue-modal"]')).toBeVisible();

    // Fill in the form
    await page.fill('input[placeholder*="What needs"]', 'New test issue from Playwright');
    await page.waitForTimeout(200);

    // Click Create button inside the modal
    await page.locator('[data-testid="create-issue-modal"] button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Verify the issue was created (modal should close)
    await expect(page.locator('[data-testid="create-issue-modal"]')).not.toBeVisible();
  });

  test('navigate between pages', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify board is loaded
    await expect(page.getByRole('heading', { name: 'Board' })).toBeVisible();

    // Navigate to backlog
    await page.click('text=Backlog');
    await page.waitForTimeout(1000);
    await expect(page.locator('h1').filter({ hasText: 'Backlog' })).toBeVisible();

    // Navigate to sprints
    await page.click('text=Sprints');
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { name: 'Sprints' })).toBeVisible();

    // Navigate to roadmap
    await page.click('text=Roadmap');
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { name: 'Roadmap' })).toBeVisible();

    // Navigate to settings
    await page.click('text=Settings');
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { name: 'Project Settings' })).toBeVisible();
  });

  test('issue detail panel opens and shows data', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to backlog view where issues are clickable without dnd-kit interference
    await page.goto(`${BASE}/project/${PROJECT_ID}/backlog`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on an issue in the backlog
    const issueRow = page.locator('text=Fix login button').first();
    await issueRow.click();
    await page.waitForTimeout(1000);

    // Verify detail panel opens
    await expect(page.locator('[data-testid="issue-detail-panel"]')).toBeVisible({ timeout: 5000 });

    // Close with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="issue-detail-panel"]')).not.toBeVisible();
  });

  test('sidebar collapse and expand', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Click collapse
    await page.click('[data-testid="sidebar-toggle"]');
    await page.waitForTimeout(500);

    // Verify sidebar is collapsed (has collapsed class)
    await expect(sidebar).toHaveClass(/collapsed/);

    // Click expand
    await page.click('[data-testid="sidebar-toggle"]');
    await page.waitForTimeout(500);

    // Verify sidebar is expanded (no collapsed class)
    await expect(sidebar).not.toHaveClass(/collapsed/);
  });

  test('search modal opens and filters', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open search with Cmd+K
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);

    // Type search query
    await page.locator('input[placeholder*="Search"]').first().fill('login');
    await page.waitForTimeout(500);

    // Should show matching results
    await expect(page.locator('text=Fix login button').first()).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('dark mode toggle', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click theme toggle
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForTimeout(500);

    // Verify dark class is on html element
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toContain('dark');

    // Toggle back
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForTimeout(500);

    const htmlClassAfter = await page.evaluate(() => document.documentElement.className);
    expect(htmlClassAfter).not.toContain('dark');
  });

  test('board quick filter works', async ({ page }) => {
    await page.goto(BASE);
    await seedData(page);
    await page.goto(`${BASE}/project/${PROJECT_ID}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // All issues should be visible
    await expect(page.locator('text=CAN-1')).toBeVisible();
    await expect(page.locator('text=CAN-2')).toBeVisible();

    // Type in filter
    await page.fill('input[placeholder="Filter cards..."]', 'login');
    await page.waitForTimeout(500);

    // Only matching issue visible
    await expect(page.locator('text=Fix login button')).toBeVisible();
    await expect(page.locator('text=Add user profiles')).not.toBeVisible();

    // Clear filter
    await page.fill('input[placeholder="Filter cards..."]', '');
    await page.waitForTimeout(500);

    // All issues visible again
    await expect(page.locator('text=CAN-2')).toBeVisible();
  });
});
