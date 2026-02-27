import { test, expect } from '@playwright/test';

test('verify dark mode classes', async ({ page }) => {
  await page.goto('http://localhost:6174');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('canopy_theme', 'dark');
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const htmlClass = await page.evaluate(() => document.documentElement.className);
  console.log('HTML class:', htmlClass);

  const bgColor = await page.evaluate(() => {
    return window.getComputedStyle(document.documentElement).backgroundColor;
  });
  console.log('BG color:', bgColor);

  expect(htmlClass).toContain('dark');
});
