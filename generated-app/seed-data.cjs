// Seed localStorage data for testing
const { chromium } = require('playwright');

async function seedData() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:6174');

  const projectId = await page.evaluate(() => {
    localStorage.clear();
    const projectId = crypto.randomUUID();
    const boardId = crypto.randomUUID();
    const sprintId = crypto.randomUUID();

    const project = {
      id: projectId, name: 'Canopy Dev', key: 'CAN', color: '#1B4332',
      description: 'Main development project for the Canopy platform',
      issueCounter: 8, isArchived: false, settings: {},
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
      { id: crypto.randomUUID(), projectId, key: 'CAN-3', type: 'Task', summary: 'Set up CI/CD pipeline with GitHub Actions', priority: 'Medium', status: 'done', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 2, timeSpent: 120, storyPoints: 8, sprintId, createdAt: '2026-02-16T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-4', type: 'Story', summary: 'Implement sprint planning view', priority: 'Medium', status: 'todo', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 3, timeSpent: 0, storyPoints: 8, createdAt: '2026-02-18T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-5', type: 'Story', summary: 'Add drag-and-drop to board view', priority: 'Low', status: 'in_review', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 4, timeSpent: 60, storyPoints: 5, sprintId, createdAt: '2026-02-19T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-6', type: 'Bug', summary: 'Sidebar collapse animation glitch', priority: 'Low', status: 'todo', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 5, timeSpent: 0, storyPoints: 2, sprintId, createdAt: '2026-02-20T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-7', type: 'Task', summary: 'Write unit tests for API handlers', priority: 'High', status: 'in_progress', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 6, timeSpent: 90, storyPoints: 5, sprintId, createdAt: '2026-02-22T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
      { id: crypto.randomUUID(), projectId, key: 'CAN-8', type: 'Story', summary: 'Implement dark theme across all components', priority: 'Medium', status: 'done', reporterId: crypto.randomUUID(), labels: [], components: [], sortOrder: 7, timeSpent: 180, storyPoints: 5, sprintId, createdAt: '2026-02-24T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z' },
    ];

    const sprint = {
      id: sprintId, projectId, name: 'Sprint 1', goal: 'Core auth and CI/CD',
      status: 'active', velocity: 0,
      startDate: '2026-02-20T10:00:00.000Z', endDate: '2026-03-06T10:00:00.000Z',
      createdAt: '2026-02-20T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z',
    };

    const sprint2 = {
      id: crypto.randomUUID(), projectId, name: 'Sprint 2', goal: 'Sprint planning and reports',
      status: 'future', velocity: 0,
      createdAt: '2026-02-20T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z',
    };

    // Also add another project for dashboard
    const project2 = {
      id: crypto.randomUUID(), name: 'Mobile App', key: 'MOB', color: '#9B59B6',
      issueCounter: 12, isArchived: false, settings: {},
      createdAt: '2026-01-15T10:00:00.000Z', updatedAt: '2026-02-27T10:00:00.000Z',
    };

    localStorage.setItem('canopy:projects', JSON.stringify([project, project2]));
    localStorage.setItem('canopy:boards', JSON.stringify([board]));
    localStorage.setItem('canopy:issues', JSON.stringify(issues));
    localStorage.setItem('canopy:sprints', JSON.stringify([sprint, sprint2]));
    localStorage.setItem('canopy_currentProject', projectId);

    return projectId;
  });

  console.log(`Seeded project: ${projectId}`);
  await browser.close();
}

seedData().catch(console.error);
