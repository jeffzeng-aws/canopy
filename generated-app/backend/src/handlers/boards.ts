import { UpdateBoardSchema } from '@canopy/shared';
import { getItem, queryItems, updateItem } from '../lib/db';

const now = () => new Date().toISOString();

function stripDynamoKeys(item: Record<string, any>) {
  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, GSI3PK, GSI3SK, entityType, ...rest } = item;
  return rest;
}

export async function getBoard(projectId: string) {
  const items = await queryItems({
    pk: `PROJ#${projectId}`,
    skPrefix: 'BOARD#',
  });

  const board = items.find((item: any) => item.entityType === 'BOARD');
  if (!board) {
    return { statusCode: 404, body: { error: { code: 'NOT_FOUND', message: 'Board not found' } } };
  }

  return { statusCode: 200, body: stripDynamoKeys(board) };
}

export async function updateBoard(id: string, body: unknown) {
  const parsed = UpdateBoardSchema.parse(body);

  // Find the board by scanning (board ID in SK)
  // We need to find the project this board belongs to
  const boardItem = await getItem(`BOARD#${id}`, 'METADATA');

  // Try alternative: boards stored under project PK
  // We'll need to handle both cases
  if (!boardItem) {
    return { statusCode: 404, body: { error: { code: 'NOT_FOUND', message: 'Board not found' } } };
  }

  const updates = { ...parsed, updatedAt: now() };
  await updateItem({
    pk: boardItem.PK as string,
    sk: boardItem.SK as string,
    updates,
  });

  const updated = { ...stripDynamoKeys(boardItem), ...updates };
  return { statusCode: 200, body: updated };
}
