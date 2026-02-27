import { CreateSprintSchema, UpdateSprintSchema } from '@canopy/shared';
import { putItem, getItem, queryItems, updateItem } from '../lib/db';

const now = () => new Date().toISOString();

function stripDynamoKeys(item: Record<string, any>) {
  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, GSI3PK, GSI3SK, entityType, ...rest } = item;
  return rest;
}

export async function createSprint(projectId: string, body: unknown) {
  const parsed = CreateSprintSchema.parse({ ...body as any, projectId });
  const id = crypto.randomUUID();
  const timestamp = now();

  const sprint = {
    ...parsed,
    id,
    status: 'future' as const,
    velocity: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await putItem({
    PK: `SPRINT#${id}`,
    SK: 'METADATA',
    GSI1PK: `PROJ#${projectId}`,
    GSI1SK: `SPRINT#${sprint.status}#${timestamp}`,
    entityType: 'SPRINT',
    ...sprint,
  });

  return { statusCode: 201, body: sprint };
}

export async function listSprints(projectId: string) {
  const items = await queryItems({
    indexName: 'GSI1',
    pk: `PROJ#${projectId}`,
    skPrefix: 'SPRINT#',
  });

  const sprints = items
    .filter((item: any) => item.entityType === 'SPRINT')
    .map(stripDynamoKeys);

  return { statusCode: 200, body: sprints };
}

export async function updateSprint(id: string, body: unknown) {
  const parsed = UpdateSprintSchema.parse(body);
  const existing = await getItem(`SPRINT#${id}`, 'METADATA');
  if (!existing) {
    return { statusCode: 404, body: { error: { code: 'NOT_FOUND', message: 'Sprint not found' } } };
  }

  const timestamp = now();
  const updates: Record<string, any> = { ...parsed, updatedAt: timestamp };

  // Handle sprint start
  if (parsed.status === 'active' && existing.status === 'future') {
    if (!updates.startDate) {
      updates.startDate = timestamp;
    }
  }

  // Handle sprint complete
  if (parsed.status === 'completed' && existing.status === 'active') {
    updates.completedAt = timestamp;
    // Calculate velocity from completed issues
    const sprintIssues = await queryItems({
      indexName: 'GSI3',
      pk: `SPRINT#${id}`,
    });
    const velocity = sprintIssues
      .filter((item: any) => item.status === 'done')
      .reduce((sum: number, item: any) => sum + (item.storyPoints || 0), 0);
    updates.velocity = velocity;
  }

  // Update GSI keys if status changed
  if (parsed.status) {
    updates.GSI1SK = `SPRINT#${parsed.status}#${existing.createdAt}`;
  }

  await updateItem({
    pk: `SPRINT#${id}`,
    sk: 'METADATA',
    updates,
  });

  const updated = { ...stripDynamoKeys(existing), ...updates };
  return { statusCode: 200, body: updated };
}
