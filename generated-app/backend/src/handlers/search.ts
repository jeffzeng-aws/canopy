import { SearchQuerySchema } from '@canopy/shared';
import { scanAll } from '../lib/db';

function stripDynamoKeys(item: Record<string, any>) {
  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, GSI3PK, GSI3SK, entityType, ...rest } = item;
  return rest;
}

export async function search(query: unknown) {
  const parsed = SearchQuerySchema.parse(query);
  const { q, projectId, type, limit } = parsed;
  const searchTerm = q.toLowerCase();

  const allItems = await scanAll(500);

  let issues: any[] = [];
  let projects: any[] = [];

  if (type === 'all' || type === 'issues') {
    issues = allItems
      .filter((item: any) => {
        if (item.entityType !== 'ISSUE') return false;
        if (projectId && item.projectId !== projectId) return false;
        const summary = (item.summary || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const key = (item.key || '').toLowerCase();
        return summary.includes(searchTerm) || description.includes(searchTerm) || key.includes(searchTerm);
      })
      .slice(0, limit)
      .map(stripDynamoKeys);
  }

  if (type === 'all' || type === 'projects') {
    projects = allItems
      .filter((item: any) => {
        if (item.entityType !== 'PROJECT') return false;
        const name = (item.name || '').toLowerCase();
        const key = (item.key || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        return name.includes(searchTerm) || key.includes(searchTerm) || description.includes(searchTerm);
      })
      .slice(0, limit)
      .map(stripDynamoKeys);
  }

  return {
    statusCode: 200,
    body: {
      issues,
      projects,
      total: issues.length + projects.length,
    },
  };
}
