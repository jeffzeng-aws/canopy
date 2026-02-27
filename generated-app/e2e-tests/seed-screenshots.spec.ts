import { test, expect } from '@playwright/test';
import path from 'path';

const PROJECT_ID = '10000000-0000-4000-8000-000000000001';
const BOARD_ID   = '20000000-0000-4000-8000-000000000001';
const SPRINT_ID  = '30000000-0000-4000-8000-000000000001';
const COL_TODO   = '40000000-0000-4000-8000-000000000001';
const COL_INPROG = '40000000-0000-4000-8000-000000000002';
const COL_REVIEW = '40000000-0000-4000-8000-000000000003';
const COL_DONE   = '40000000-0000-4000-8000-000000000004';
const REPORTER   = '50000000-0000-4000-8000-000000000001';

const ISSUE_IDS = [
  '60000000-0000-4000-8000-000000000001',
  '60000000-0000-4000-8000-000000000002',
  '60000000-0000-4000-8000-000000000003',
  '60000000-0000-4000-8000-000000000004',
  '60000000-0000-4000-8000-000000000005',
];

const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'issue-1');

function buildSeedData() {
  const NOW = new Date().toISOString();

  const project = {
    id: PROJECT_ID,
    name: 'Canopy App',
    key: 'CAN',
    description: 'Project management tool built with modern web technologies',
    color: '#2D6A4F',
    issueCounter: 5,
    isArchived: false,
    settings: {},
    createdAt: NOW,
    updatedAt: NOW,
  };

  const board = {
    id: BOARD_ID,
    projectId: PROJECT_ID,
    name: 'Board',
    columns: [
      { id: COL_TODO,   name: 'To Do',       statusCategory: 'todo',        sortOrder: 0 },
      { id: COL_INPROG, name: 'In Progress',  statusCategory: 'in_progress', sortOrder: 1 },
      { id: COL_REVIEW, name: 'In Review',    statusCategory: 'in_progress', sortOrder: 2 },
      { id: COL_DONE,   name: 'Done',         statusCategory: 'done',        sortOrder: 3 },
    ],
    swimlaneBy: 'none',
    createdAt: NOW,
    updatedAt: NOW,
  };

  const sprint = {
    id: SPRINT_ID,
    projectId: PROJECT_ID,
    name: 'Sprint 1',
    goal: 'Complete core project management features',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    velocity: 0,
    createdAt: NOW,
    updatedAt: NOW,
  };

  const issues = [
    {
      id: ISSUE_IDS[0],
      projectId: PROJECT_ID,
      key: 'CAN-1',
      type: 'Story',
      summary: 'Implement user authentication flow',
      description: 'Add login, signup, and password reset functionality',
      priority: 'High',
      status: 'done',
      reporterId: REPORTER,
      sprintId: SPRINT_ID,
      storyPoints: 8,
      labels: ['auth'],
      components: [],
      sortOrder: 0,
      timeSpent: 0,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: ISSUE_IDS[1],
      projectId: PROJECT_ID,
      key: 'CAN-2',
      type: 'Bug',
      summary: 'Fix drag-and-drop issue on board view',
      description: 'Cards sometimes snap to wrong column when dropped quickly',
      priority: 'Highest',
      status: 'in_progress',
      reporterId: REPORTER,
      sprintId: SPRINT_ID,
      storyPoints: 3,
      labels: ['bug', 'board'],
      components: [],
      sortOrder: 1,
      timeSpent: 0,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: ISSUE_IDS[2],
      projectId: PROJECT_ID,
      key: 'CAN-3',
      type: 'Task',
      summary: 'Add dark mode toggle to settings',
      description: 'Allow users to switch between light and dark theme',
      priority: 'Medium',
      status: 'in_review',
      reporterId: REPORTER,
      sprintId: SPRINT_ID,
      storyPoints: 5,
      labels: ['ui'],
      components: [],
      sortOrder: 2,
      timeSpent: 0,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: ISSUE_IDS[3],
      projectId: PROJECT_ID,
      key: 'CAN-4',
      type: 'Epic',
      summary: 'Set up CI/CD pipeline with automated testing',
      description: 'Configure GitHub Actions for lint, test, and deploy steps',
      priority: 'Low',
      status: 'todo',
      reporterId: REPORTER,
      sprintId: SPRINT_ID,
      storyPoints: 13,
      labels: ['devops'],
      components: [],
      sortOrder: 3,
      timeSpent: 0,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: ISSUE_IDS[4],
      projectId: PROJECT_ID,
      key: 'CAN-5',
      type: 'Story',
      summary: 'Create onboarding tutorial for new users',
      description: 'Step-by-step guided tour for first-time users',
      priority: 'Medium',
      status: 'todo',
      reporterId: REPORTER,
      labels: [],
      components: [],
      sortOrder: 4,
      timeSpent: 0,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  return { project, board, sprint, issues };
}

test.describe('Seed data and take screenshots', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate first so we have access to localStorage on the right origin
    await page.goto('http://localhost:6174');
    await page.waitForLoadState('networkidle');

    // Inject seed data
    const seed = buildSeedData();
    await page.evaluate((data) => {
      localStorage.clear();
      localStorage.setItem('canopy:projects', JSON.stringify([data.project]));
      localStorage.setItem('canopy:issues', JSON.stringify(data.issues));
      localStorage.setItem('canopy:sprints', JSON.stringify([data.sprint]));
      localStorage.setItem('canopy:boards', JSON.stringify([data.board]));
      localStorage.setItem('canopy_currentProject', data.project.id);
    }, seed);
  });

  test('1-dashboard: Dashboard with project card', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.waitForSelector('text=Canopy App', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'dashboard-seeded.png'),
      fullPage: true,
    });
  });

  test('2-board: Board view with issues in columns', async ({ page }) => {
    await page.goto(`http://localhost:6174/project/${PROJECT_ID}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.waitForSelector('text=To Do', { timeout: 10000 });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'board-seeded.png'),
      fullPage: true,
    });
  });

  test('3-backlog: Backlog view with sprint and issues', async ({ page }) => {
    await page.goto(`http://localhost:6174/project/${PROJECT_ID}/backlog`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.waitForSelector('text=Backlog', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'backlog-seeded.png'),
      fullPage: true,
    });
  });

  test('4-sprints: Sprints view with active sprint', async ({ page }) => {
    await page.goto(`http://localhost:6174/project/${PROJECT_ID}/sprints`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.waitForSelector('text=Sprint 1', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'sprints-seeded.png'),
      fullPage: true,
    });
  });

  test('5-settings: Settings view for project', async ({ page }) => {
    await page.goto(`http://localhost:6174/project/${PROJECT_ID}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.waitForSelector('text=Project Settings', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'settings-seeded.png'),
      fullPage: true,
    });
  });
});
