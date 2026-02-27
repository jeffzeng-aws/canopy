import { CreateProjectSchema, UpdateProjectSchema } from '@canopy/shared';
import { putItem, getItem, queryItems, deleteItem, updateItem } from '../lib/db';

const now = () => new Date().toISOString();

export async function createProject(body: unknown) {
  const parsed = CreateProjectSchema.parse(body);
  const id = crypto.randomUUID();
  const timestamp = now();

  const project = {
    ...parsed,
    id,
    issueCounter: 0,
    isArchived: false,
    settings: {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await putItem({
    PK: `PROJ#${id}`,
    SK: 'METADATA',
    GSI1PK: 'PROJECTS',
    GSI1SK: `PROJ#${timestamp}`,
    entityType: 'PROJECT',
    ...project,
  });

  // Create default board for the project
  const boardId = crypto.randomUUID();
  const defaultColumns = [
    { id: crypto.randomUUID(), name: 'To Do', statusCategory: 'todo', sortOrder: 0, color: '#8896A6' },
    { id: crypto.randomUUID(), name: 'In Progress', statusCategory: 'in_progress', sortOrder: 1, color: '#2196F3' },
    { id: crypto.randomUUID(), name: 'In Review', statusCategory: 'in_progress', sortOrder: 2, color: '#E9C46A' },
    { id: crypto.randomUUID(), name: 'Done', statusCategory: 'done', sortOrder: 3, color: '#40916C' },
  ];

  await putItem({
    PK: `PROJ#${id}`,
    SK: `BOARD#${boardId}`,
    entityType: 'BOARD',
    id: boardId,
    projectId: id,
    name: 'Board',
    columns: defaultColumns,
    swimlaneBy: 'none',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return { statusCode: 201, body: project };
}

export async function listProjects() {
  const items = await queryItems({
    indexName: 'GSI1',
    pk: 'PROJECTS',
  });

  const projects = items
    .filter((item: any) => item.entityType === 'PROJECT')
    .map(stripDynamoKeys);

  return { statusCode: 200, body: projects };
}

export async function getProject(id: string) {
  const item = await getItem(`PROJ#${id}`, 'METADATA');
  if (!item) {
    return { statusCode: 404, body: { error: { code: 'NOT_FOUND', message: 'Project not found' } } };
  }
  return { statusCode: 200, body: stripDynamoKeys(item) };
}

export async function updateProject(id: string, body: unknown) {
  const parsed = UpdateProjectSchema.parse(body);
  const existing = await getItem(`PROJ#${id}`, 'METADATA');
  if (!existing) {
    return { statusCode: 404, body: { error: { code: 'NOT_FOUND', message: 'Project not found' } } };
  }

  const updates = { ...parsed, updatedAt: now() };
  await updateItem({ pk: `PROJ#${id}`, sk: 'METADATA', updates });

  const updated = { ...stripDynamoKeys(existing), ...updates };
  return { statusCode: 200, body: updated };
}

export async function deleteProject(id: string) {
  await deleteItem(`PROJ#${id}`, 'METADATA');
  return { statusCode: 200, body: { success: true } };
}

function stripDynamoKeys(item: Record<string, any>) {
  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, GSI3PK, GSI3SK, entityType, ...rest } = item;
  return rest;
}
