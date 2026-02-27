// Seed localStorage data for testing
const { chromium } = require('playwright');

async function seedData() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:6174');

  const projectId = await page.evaluate(() => {
    localStorage.clear();
    const projectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const boardId = 'b1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const sprintId = 's1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const sprint2Id = 's2b2c3d4-e5f6-7890-abcd-ef1234567890';
    const sprint3Id = 's3b2c3d4-e5f6-7890-abcd-ef1234567890';
    const now = new Date().toISOString();

    const project = {
      id: projectId, name: 'Canopy App', key: 'CAN', color: '#1B4332',
      description: 'Main Canopy project management application',
      icon: '🌲',
      issueCounter: 12, isArchived: false, settings: {},
      createdAt: '2026-01-15T10:00:00.000Z', updatedAt: now,
    };

    const project2 = {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      name: 'Design System', key: 'DS', color: '#9B59B6',
      description: 'Component library and design tokens',
      icon: '🎨',
      issueCounter: 5, isArchived: false, settings: {},
      createdAt: '2026-02-01T10:00:00.000Z', updatedAt: now,
    };

    const board = {
      id: boardId, projectId, name: 'Main Board',
      columns: [
        { id: 'col1', name: 'To Do', statusCategory: 'todo', sortOrder: 0, color: '#8896A6' },
        { id: 'col2', name: 'In Progress', statusCategory: 'in_progress', sortOrder: 1, color: '#2196F3' },
        { id: 'col3', name: 'In Review', statusCategory: 'in_progress', sortOrder: 2, color: '#E9C46A' },
        { id: 'col4', name: 'Done', statusCategory: 'done', sortOrder: 3, color: '#40916C' },
      ],
      swimlaneBy: 'none',
      createdAt: '2026-01-15T10:00:00.000Z', updatedAt: now,
    };

    const issues = [
      { id: 'i001', projectId, key: 'CAN-1', type: 'Epic', status: 'in_progress', summary: 'User Authentication System', description: 'Implement complete auth flow including login, signup, and password reset', priority: 'Highest', reporterId: 'user1', storyPoints: 13, labels: ['security'], components: [], sortOrder: 0, timeSpent: 120, timeEstimate: 480, sprintId, createdAt: '2026-01-15T10:00:00.000Z', updatedAt: now },
      { id: 'i002', projectId, key: 'CAN-2', type: 'Story', status: 'done', summary: 'Design login page mockups', description: 'Create high-fidelity mockups for the login and signup pages', priority: 'High', reporterId: 'user1', storyPoints: 5, labels: ['design'], components: ['UI'], sortOrder: 1, timeSpent: 240, timeEstimate: 240, sprintId, resolvedAt: '2026-02-20T14:00:00.000Z', createdAt: '2026-01-16T10:00:00.000Z', updatedAt: now },
      { id: 'i003', projectId, key: 'CAN-3', type: 'Bug', status: 'in_progress', summary: 'Navigation menu not closing on mobile', description: 'On mobile devices, the hamburger menu stays open after selecting a page', priority: 'High', reporterId: 'user1', storyPoints: 3, labels: ['bug', 'mobile'], components: ['UI'], sortOrder: 2, timeSpent: 60, sprintId, createdAt: '2026-01-17T10:00:00.000Z', updatedAt: now },
      { id: 'i004', projectId, key: 'CAN-4', type: 'Task', status: 'todo', summary: 'Set up CI/CD pipeline with GitHub Actions', description: 'Configure automated testing and deployment workflow', priority: 'High', reporterId: 'user1', storyPoints: 8, labels: ['devops'], components: ['Infrastructure'], sortOrder: 3, timeEstimate: 360, sprintId, createdAt: '2026-01-18T10:00:00.000Z', updatedAt: now },
      { id: 'i005', projectId, key: 'CAN-5', type: 'Story', status: 'in_review', summary: 'Implement project creation flow', description: 'Allow users to create new projects with name, key, and description fields', priority: 'Medium', reporterId: 'user1', storyPoints: 5, labels: ['feature'], components: ['Backend', 'UI'], sortOrder: 4, timeSpent: 180, timeEstimate: 300, sprintId, createdAt: '2026-01-19T10:00:00.000Z', updatedAt: now },
      { id: 'i006', projectId, key: 'CAN-6', type: 'Task', status: 'todo', summary: 'Write API documentation for all endpoints', description: 'Document request/response formats, authentication, and examples', priority: 'Low', reporterId: 'user1', storyPoints: 3, labels: ['docs'], components: ['Backend'], sortOrder: 5, createdAt: '2026-01-20T10:00:00.000Z', updatedAt: now },
      { id: 'i007', projectId, key: 'CAN-7', type: 'Story', status: 'todo', summary: 'Implement drag-and-drop on Kanban board', description: 'Use @dnd-kit to enable drag and drop functionality between board columns', priority: 'Medium', reporterId: 'user1', storyPoints: 8, labels: ['feature', 'frontend'], components: ['UI'], sortOrder: 6, sprintId: sprint2Id, createdAt: '2026-02-01T10:00:00.000Z', updatedAt: now },
      { id: 'i008', projectId, key: 'CAN-8', type: 'Bug', status: 'todo', summary: 'Story points not calculating correctly in reports', description: 'The velocity chart shows incorrect values for completed sprints', priority: 'Medium', reporterId: 'user1', storyPoints: 2, labels: ['bug'], components: ['Backend'], sortOrder: 7, createdAt: '2026-02-05T10:00:00.000Z', updatedAt: now },
      { id: 'i009', projectId, key: 'CAN-9', type: 'Task', status: 'done', summary: 'Database schema design and migration', description: 'Design DynamoDB single-table schema with GSIs for all access patterns', priority: 'Highest', reporterId: 'user1', storyPoints: 5, labels: ['backend'], components: ['Backend', 'Infrastructure'], sortOrder: 8, timeSpent: 300, timeEstimate: 300, sprintId, resolvedAt: '2026-02-18T16:00:00.000Z', createdAt: '2026-01-15T12:00:00.000Z', updatedAt: now },
      { id: 'i010', projectId, key: 'CAN-10', type: 'Story', status: 'done', summary: 'Implement search functionality', description: 'Add full-text search across issues and projects with keyboard shortcuts', priority: 'Medium', reporterId: 'user1', storyPoints: 5, labels: ['feature'], components: ['UI'], sortOrder: 9, timeSpent: 240, timeEstimate: 240, sprintId, resolvedAt: '2026-02-22T11:00:00.000Z', createdAt: '2026-02-10T10:00:00.000Z', updatedAt: now },
      { id: 'i011', projectId, key: 'CAN-11', type: 'Epic', status: 'todo', summary: 'Reporting and Analytics Dashboard', description: 'Build comprehensive reporting with burndown charts, velocity tracking, and sprint reports', priority: 'Medium', reporterId: 'user1', storyPoints: 21, labels: ['feature'], components: ['UI', 'Backend'], sortOrder: 10, createdAt: '2026-02-12T10:00:00.000Z', updatedAt: now },
      { id: 'i012', projectId, key: 'CAN-12', type: 'Sub-task', status: 'in_progress', summary: 'Add dark mode toggle to settings', description: 'Implement theme switching with system preference detection', priority: 'Low', reporterId: 'user1', storyPoints: 2, labels: ['ui'], components: ['UI'], sortOrder: 11, timeSpent: 60, sprintId: sprint2Id, parentId: 'i001', createdAt: '2026-02-15T10:00:00.000Z', updatedAt: now },
    ];

    const sprints = [
      { id: sprintId, projectId, name: 'Sprint 1 - Foundation', goal: 'Core infrastructure and authentication', status: 'active', startDate: '2026-02-10T00:00:00.000Z', endDate: '2026-02-24T00:00:00.000Z', velocity: 0, createdAt: '2026-02-08T10:00:00.000Z', updatedAt: now },
      { id: sprint2Id, projectId, name: 'Sprint 2 - Features', goal: 'Board features and UI polish', status: 'future', startDate: '2026-02-24T00:00:00.000Z', endDate: '2026-03-10T00:00:00.000Z', velocity: 0, createdAt: '2026-02-20T10:00:00.000Z', updatedAt: now },
      { id: sprint3Id, projectId, name: 'Sprint 0 - Setup', goal: 'Initial project setup and planning', status: 'completed', startDate: '2026-01-27T00:00:00.000Z', endDate: '2026-02-10T00:00:00.000Z', velocity: 15, completedAt: '2026-02-10T16:00:00.000Z', createdAt: '2026-01-25T10:00:00.000Z', updatedAt: now },
    ];

    const comments = [
      { id: 'c001', issueId: 'i001', authorId: 'user1', body: 'Started working on the OAuth integration. Using Auth0 for the identity provider.', isEdited: false, createdAt: '2026-02-15T14:30:00.000Z', updatedAt: '2026-02-15T14:30:00.000Z' },
      { id: 'c002', issueId: 'i001', authorId: 'user1', body: 'JWT token validation is working. Need to add refresh token logic next.', isEdited: false, createdAt: '2026-02-18T11:00:00.000Z', updatedAt: '2026-02-18T11:00:00.000Z' },
      { id: 'c003', issueId: 'i003', authorId: 'user1', body: 'Reproduced on iPhone 14 Pro. The z-index of the menu overlay is too low.', isEdited: false, createdAt: '2026-02-17T16:00:00.000Z', updatedAt: '2026-02-17T16:00:00.000Z' },
    ];

    localStorage.setItem('canopy:projects', JSON.stringify([project, project2]));
    localStorage.setItem('canopy:boards', JSON.stringify([board]));
    localStorage.setItem('canopy:issues', JSON.stringify(issues));
    localStorage.setItem('canopy:sprints', JSON.stringify(sprints));
    localStorage.setItem('canopy:comments', JSON.stringify(comments));
    localStorage.setItem('canopy_currentProject', projectId);

    return projectId;
  });

  console.log(`Seeded project: ${projectId}`);
  await browser.close();
}

seedData().catch(console.error);
