import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Clear localStorage before each test
  await page.goto('http://localhost:6174');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  // Wait for animations to complete
  await page.waitForTimeout(500);
});

test('shows welcome page when no projects exist', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Welcome to Canopy' })).toBeVisible({ timeout: 5000 });
});

test('can create a project and navigate to board', async ({ page }) => {
  // Wait for animations then click "Create your first project"
  const createBtn = page.getByRole('button', { name: /Create your first project/ });
  await createBtn.waitFor({ state: 'visible', timeout: 5000 });
  await createBtn.click();

  // Fill in project details
  await page.locator('input[placeholder="My Project"]').fill('Test Project');
  await page.waitForTimeout(300);

  // Key should be auto-generated
  const keyInput = page.locator('input[placeholder="KEY"]');
  const keyVal = await keyInput.inputValue();
  expect(keyVal.length).toBeGreaterThan(0);

  // Click create
  await page.getByRole('button', { name: 'Create Project' }).click();

  // Should navigate to board view
  await page.waitForURL(/\/project\/.*\/board/, { timeout: 5000 });

  // Board page should show columns
  await expect(page.getByText('To Do')).toBeVisible({ timeout: 5000 });
});

test('dashboard shows project cards after creating a project', async ({ page }) => {
  // Create a project via localStorage directly
  await page.evaluate(() => {
    const id = crypto.randomUUID();
    const project = {
      id, name: 'My Project', key: 'MYP', color: '#1B4332',
      issueCounter: 0, isArchived: false, settings: {},
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('canopy:projects', JSON.stringify([project]));
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Should show the project card
  await expect(page.getByText('My Project')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('MYP')).toBeVisible({ timeout: 5000 });
});
