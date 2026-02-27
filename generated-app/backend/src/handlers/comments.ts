import { CreateCommentSchema } from '@canopy/shared';
import { putItem, queryItems } from '../lib/db';

const now = () => new Date().toISOString();

function stripDynamoKeys(item: Record<string, any>) {
  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, GSI3PK, GSI3SK, entityType, ...rest } = item;
  return rest;
}

export async function addComment(issueId: string, body: unknown) {
  const parsed = CreateCommentSchema.parse({ ...body as any, issueId });
  const id = crypto.randomUUID();
  const timestamp = now();

  const comment = {
    ...parsed,
    id,
    authorId: (body as any)?.authorId || crypto.randomUUID(),
    isEdited: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await putItem({
    PK: `ISSUE#${issueId}`,
    SK: `COMMENT#${timestamp}#${id}`,
    entityType: 'COMMENT',
    ...comment,
  });

  return { statusCode: 201, body: comment };
}

export async function listComments(issueId: string) {
  const items = await queryItems({
    pk: `ISSUE#${issueId}`,
    skPrefix: 'COMMENT#',
  });

  const comments = items
    .filter((item: any) => item.entityType === 'COMMENT')
    .map(stripDynamoKeys);

  return { statusCode: 200, body: comments };
}
