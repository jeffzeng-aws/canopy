import { CreateIssueSchema, UpdateIssueSchema, BulkUpdateIssuesSchema } from '@canopy/shared';
import { putItem, getItem, queryItems, deleteItem, updateItem } from '../lib/db';

const now = () => new Date().toISOString();

function stripDynamoKeys(item: Record<string, any>) {
  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, GSI3PK, GSI3SK, entityType, ...rest } = item;
  return rest;
}

export async function createIssue(projectId: string, body: unknown) {
  const parsed = CreateIssueSchema.parse({ ...body as any, projectId });
  const id = crypto.randomUUID();
  const timestamp = now();

  // Get project to generate issue key
  const project = await getItem(`PROJ#${projectId}`, 'METADATA');
  if (!project) {
    return { statusCode: 404, body: { error: { code: 'NOT_FOUND', message: 'Project not found' } } };
  }

  const issueCounter = (project.issueCounter || 0) + 1;
  const key = `${project.key}-${issueCounter}`;

  // Update project issue counter
  await updateItem({
    pk: `PROJ#${projectId}`,
    sk: 'METADATA',
    updates: { issueCounter, updatedAt: timestamp },
  });

  const issue = {
    ...parsed,
    id,
    key,
    status: 'todo',
    reporterId: parsed.assigneeId || crypto.randomUUID(),
    sortOrder: issueCounter * 1000,
    timeSpent: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const dynamoItem: Record<string, any> = {
    PK: `ISSUE#${id}`,
    SK: 'METADATA',
    GSI1PK: `PROJ#${projectId}`,
    GSI1SK: `ISSUE#${issue.status}#${issue.sortOrder}`,
    entityType: 'ISSUE',
    ...issue,
  };

  if (parsed.assigneeId) {
    dynamoItem.GSI2PK = `USER#${parsed.assigneeId}`;
    dynamoItem.GSI2SK = timestamp;
  }

  if (parsed.sprintId) {
    dynamoItem.GSI3PK = `SPRINT#${parsed.sprintId}`;
    dynamoItem.GSI3SK = `${issue.sortOrder}`;
  }

  await putItem(dynamoItem);

  return { statusCode: 201, body: issue };
}

export async function listIssues(projectId: string) {
  const items = await queryItems({
    indexName: 'GSI1',
    pk: `PROJ#${projectId}`,
    skPrefix: 'ISSUE#',
  });

  const issues = items
    .filter((item: any) => item.entityType === 'ISSUE')
    .map(stripDynamoKeys);

  return { statusCode: 200, body: issues };
}

export async function getIssue(id: string) {
  const item = await getItem(`ISSUE#${id}`, 'METADATA');
  if (!item) {
    return { statusCode: 404, body: { error: { code: 'NOT_FOUND', message: 'Issue not found' } } };
  }
  return { statusCode: 200, body: stripDynamoKeys(item) };
}

export async function updateIssue(id: string, body: unknown) {
  const parsed = UpdateIssueSchema.parse(body);
  const existing = await getItem(`ISSUE#${id}`, 'METADATA');
  if (!existing) {
    return { statusCode: 404, body: { error: { code: 'NOT_FOUND', message: 'Issue not found' } } };
  }

  const timestamp = now();
  const updates: Record<string, any> = { ...parsed, updatedAt: timestamp };

  // If status changes to done category, set resolvedAt
  if (parsed.status && parsed.status === 'done' && existing.status !== 'done') {
    updates.resolvedAt = timestamp;
  }

  // Update GSI keys if relevant fields changed
  const gsiUpdates: Record<string, any> = {};
  if (parsed.status !== undefined || parsed.sortOrder !== undefined) {
    gsiUpdates.GSI1SK = `ISSUE#${parsed.status || existing.status}#${parsed.sortOrder ?? existing.sortOrder}`;
  }
  if (parsed.assigneeId !== undefined) {
    gsiUpdates.GSI2PK = parsed.assigneeId ? `USER#${parsed.assigneeId}` : undefined;
    gsiUpdates.GSI2SK = parsed.assigneeId ? timestamp : undefined;
  }
  if (parsed.sprintId !== undefined) {
    gsiUpdates.GSI3PK = parsed.sprintId ? `SPRINT#${parsed.sprintId}` : undefined;
    gsiUpdates.GSI3SK = parsed.sprintId ? `${parsed.sortOrder ?? existing.sortOrder}` : undefined;
  }

  await updateItem({
    pk: `ISSUE#${id}`,
    sk: 'METADATA',
    updates: { ...updates, ...gsiUpdates },
  });

  const updated = { ...stripDynamoKeys(existing), ...updates };
  return { statusCode: 200, body: updated };
}

export async function deleteIssue(id: string) {
  await deleteItem(`ISSUE#${id}`, 'METADATA');
  return { statusCode: 200, body: { success: true } };
}

export async function bulkUpdateIssues(body: unknown) {
  const parsed = BulkUpdateIssuesSchema.parse(body);
  const results: any[] = [];

  for (const issueId of parsed.issueIds) {
    const result = await updateIssue(issueId, parsed.update);
    if (result.statusCode === 200) {
      results.push(result.body);
    }
  }

  return { statusCode: 200, body: results };
}
