import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { createProject, listProjects, getProject, updateProject, deleteProject } from './handlers/projects';
import { createIssue, listIssues, getIssue, updateIssue, deleteIssue, bulkUpdateIssues } from './handlers/issues';
import { createSprint, listSprints, updateSprint } from './handlers/sprints';
import { getBoard, updateBoard } from './handlers/boards';
import { addComment } from './handlers/comments';
import { search } from './handlers/search';

function parseBody(event: APIGatewayProxyEventV2): unknown {
  if (!event.body) return {};
  try {
    return JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body);
  } catch {
    return {};
  }
}

function parseQueryString(event: APIGatewayProxyEventV2): Record<string, string | undefined> {
  return event.queryStringParameters || {};
}

function response(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
    body: JSON.stringify(body),
  };
}

type RouteHandler = (event: APIGatewayProxyEventV2) => Promise<{ statusCode: number; body: unknown }>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
}

const routes: Route[] = [
  // Projects
  {
    method: 'POST',
    pattern: /^\/projects\/?$/,
    handler: async (event) => createProject(parseBody(event)),
  },
  {
    method: 'GET',
    pattern: /^\/projects\/?$/,
    handler: async () => listProjects(),
  },
  {
    method: 'GET',
    pattern: /^\/projects\/([^/]+)\/?$/,
    handler: async (event) => {
      const id = event.rawPath.match(/^\/projects\/([^/]+)\/?$/)![1];
      return getProject(id);
    },
  },
  {
    method: 'PUT',
    pattern: /^\/projects\/([^/]+)\/?$/,
    handler: async (event) => {
      const id = event.rawPath.match(/^\/projects\/([^/]+)\/?$/)![1];
      return updateProject(id, parseBody(event));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/projects\/([^/]+)\/?$/,
    handler: async (event) => {
      const id = event.rawPath.match(/^\/projects\/([^/]+)\/?$/)![1];
      return deleteProject(id);
    },
  },

  // Issues
  {
    method: 'POST',
    pattern: /^\/projects\/([^/]+)\/issues\/?$/,
    handler: async (event) => {
      const projectId = event.rawPath.match(/^\/projects\/([^/]+)\/issues\/?$/)![1];
      return createIssue(projectId, parseBody(event));
    },
  },
  {
    method: 'GET',
    pattern: /^\/projects\/([^/]+)\/issues\/?$/,
    handler: async (event) => {
      const projectId = event.rawPath.match(/^\/projects\/([^/]+)\/issues\/?$/)![1];
      return listIssues(projectId);
    },
  },
  {
    method: 'GET',
    pattern: /^\/issues\/([^/]+)\/?$/,
    handler: async (event) => {
      const id = event.rawPath.match(/^\/issues\/([^/]+)\/?$/)![1];
      return getIssue(id);
    },
  },
  {
    method: 'PUT',
    pattern: /^\/issues\/bulk\/?$/,
    handler: async (event) => bulkUpdateIssues(parseBody(event)),
  },
  {
    method: 'PUT',
    pattern: /^\/issues\/([^/]+)\/?$/,
    handler: async (event) => {
      const id = event.rawPath.match(/^\/issues\/([^/]+)\/?$/)![1];
      return updateIssue(id, parseBody(event));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/issues\/([^/]+)\/?$/,
    handler: async (event) => {
      const id = event.rawPath.match(/^\/issues\/([^/]+)\/?$/)![1];
      return deleteIssue(id);
    },
  },

  // Comments
  {
    method: 'POST',
    pattern: /^\/issues\/([^/]+)\/comments\/?$/,
    handler: async (event) => {
      const issueId = event.rawPath.match(/^\/issues\/([^/]+)\/comments\/?$/)![1];
      return addComment(issueId, parseBody(event));
    },
  },

  // Sprints
  {
    method: 'POST',
    pattern: /^\/projects\/([^/]+)\/sprints\/?$/,
    handler: async (event) => {
      const projectId = event.rawPath.match(/^\/projects\/([^/]+)\/sprints\/?$/)![1];
      return createSprint(projectId, parseBody(event));
    },
  },
  {
    method: 'GET',
    pattern: /^\/projects\/([^/]+)\/sprints\/?$/,
    handler: async (event) => {
      const projectId = event.rawPath.match(/^\/projects\/([^/]+)\/sprints\/?$/)![1];
      return listSprints(projectId);
    },
  },
  {
    method: 'PUT',
    pattern: /^\/sprints\/([^/]+)\/?$/,
    handler: async (event) => {
      const id = event.rawPath.match(/^\/sprints\/([^/]+)\/?$/)![1];
      return updateSprint(id, parseBody(event));
    },
  },

  // Boards
  {
    method: 'GET',
    pattern: /^\/projects\/([^/]+)\/board\/?$/,
    handler: async (event) => {
      const projectId = event.rawPath.match(/^\/projects\/([^/]+)\/board\/?$/)![1];
      return getBoard(projectId);
    },
  },
  {
    method: 'PUT',
    pattern: /^\/boards\/([^/]+)\/?$/,
    handler: async (event) => {
      const id = event.rawPath.match(/^\/boards\/([^/]+)\/?$/)![1];
      return updateBoard(id, parseBody(event));
    },
  },

  // Search
  {
    method: 'GET',
    pattern: /^\/search\/?$/,
    handler: async (event) => {
      const qs = parseQueryString(event);
      return search({
        q: qs.q || '',
        projectId: qs.projectId,
        type: qs.type || 'all',
        limit: qs.limit ? parseInt(qs.limit) : 20,
      });
    },
  },
];

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext?.http?.method || 'GET';
  const path = event.rawPath || '/';

  console.log(`${method} ${path}`);

  if (method === 'OPTIONS') {
    return response(200, {});
  }

  try {
    for (const route of routes) {
      if (route.method === method && route.pattern.test(path)) {
        const result = await route.handler(event);
        return response(result.statusCode, result.body);
      }
    }

    return response(404, { error: { code: 'NOT_FOUND', message: `Route not found: ${method} ${path}` } });
  } catch (err: any) {
    console.error('Handler error:', err);

    if (err.name === 'ZodError') {
      return response(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: err.errors,
        },
      });
    }

    return response(500, {
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message || 'Internal server error',
      },
    });
  }
}
