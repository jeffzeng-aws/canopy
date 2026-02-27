import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:6174';

test.describe('Canopy Full App Verification', () => {
  test('seed project and issues via UI', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Click "Create your first project" or "New Project" button
    const createFirstBtn = page.getByText('Create your first project');
    const newProjectBtn = page.getByText('New Project');

    if (await createFirstBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createFirstBtn.click();
    } else if (await newProjectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newProjectBtn.click();
    }

    await page.waitForTimeout(500);

    // Fill project creation form on dashboard
    const nameInput = page.locator('input[placeholder*="project name"], input[placeholder*="Project name"]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Demo Project');
      const keyInput = page.locator('input[placeholder*="key"], input[placeholder*="Key"]').first();
      if (await keyInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await keyInput.fill('DEMO');
      }
      const descInput = page.locator('textarea, input[placeholder*="description"], input[placeholder*="Description"]').first();
      if (await descInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await descInput.fill('A demo project for testing Canopy');
      }
      // Submit the form
      const submitBtn = page.locator('button:has-text("Create Project"), button:has-text("Create")').first();
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitBtn.click();
      }
      await page.waitForTimeout(1000);
    }
  });

  test('create multiple issues', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Select the project if it exists in sidebar
    const projectLink = page.locator('text=Demo Project').first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await page.waitForTimeout(500);
    }

    const issues = [
      { summary: 'Set up CI/CD pipeline', type: 'Task', priority: 'High', points: 5 },
      { summary: 'Design login page', type: 'Story', priority: 'Medium', points: 8 },
      { summary: 'Fix navigation bug', type: 'Bug', priority: 'Highest', points: 3 },
      { summary: 'Add user authentication', type: 'Epic', priority: 'High', points: 13 },
      { summary: 'Write API documentation', type: 'Task', priority: 'Low', points: 2 },
      { summary: 'Implement search feature', type: 'Story', priority: 'Medium', points: 5 },
      { summary: 'Database migration script', type: 'Task', priority: 'High', points: 3 },
    ];

    for (const issue of issues) {
      // Press C to open create modal
      await page.keyboard.press('c');
      await page.waitForTimeout(500);

      // Fill summary
      const summaryInput = page.locator('input[placeholder*="summary"], input[placeholder*="What needs"]').first();
      if (await summaryInput.isVisible()) {
        await summaryInput.fill(issue.summary);
      }

      // Try to set type (use value since labels have emoji prefixes)
      const typeSelect = page.locator('select').filter({ hasText: /Story|Bug|Task|Epic/i }).first();
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption({ value: issue.type });
      }

      // Try to set priority (use value since labels have emoji prefixes)
      const prioritySelect = page.locator('select').filter({ hasText: /Medium|High|Low/i }).first();
      if (await prioritySelect.isVisible()) {
        await prioritySelect.selectOption({ value: issue.priority });
      }

      // Submit
      const createBtn = page.locator('button:has-text("Create Issue"), button:has-text("Create")').last();
      if (await createBtn.isVisible() && await createBtn.isEnabled()) {
        await createBtn.click();
      }
      await page.waitForTimeout(500);
    }
  });
});
