import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLE_NAME = process.env.TABLE_NAME || 'canopy-projects-table';

export async function putItem(item: Record<string, unknown>) {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }));
}

export async function getItem(pk: string, sk: string) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
  }));
  return result.Item;
}

export async function queryItems(params: {
  indexName?: string;
  pk: string;
  skPrefix?: string;
  skValue?: string;
  limit?: number;
  scanForward?: boolean;
}) {
  const { indexName, pk, skPrefix, skValue, limit, scanForward = true } = params;

  const pkAttr = indexName ? `${indexName}PK` : 'PK';
  const skAttr = indexName ? `${indexName}SK` : 'SK';

  let keyCondition = `${pkAttr} = :pk`;
  const expressionValues: Record<string, unknown> = { ':pk': pk };

  if (skPrefix) {
    keyCondition += ` AND begins_with(${skAttr}, :skPrefix)`;
    expressionValues[':skPrefix'] = skPrefix;
  } else if (skValue) {
    keyCondition += ` AND ${skAttr} = :skVal`;
    expressionValues[':skVal'] = skValue;
  }

  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: indexName,
    KeyConditionExpression: keyCondition,
    ExpressionAttributeValues: expressionValues,
    Limit: limit,
    ScanIndexForward: scanForward,
  }));

  return result.Items || [];
}

export async function deleteItem(pk: string, sk: string) {
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
  }));
}

export async function scanAll(limit?: number) {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    Limit: limit,
  }));
  return result.Items || [];
}

export async function updateItem(params: {
  pk: string;
  sk: string;
  updates: Record<string, unknown>;
}) {
  const { pk, sk, updates } = params;
  const updateExpressions: string[] = [];
  const expressionNames: Record<string, string> = {};
  const expressionValues: Record<string, unknown> = {};

  Object.entries(updates).forEach(([key, value], i) => {
    const nameKey = `#field${i}`;
    const valueKey = `:val${i}`;
    updateExpressions.push(`${nameKey} = ${valueKey}`);
    expressionNames[nameKey] = key;
    expressionValues[valueKey] = value;
  });

  if (updateExpressions.length === 0) return;

  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionNames,
    ExpressionAttributeValues: expressionValues,
  }));
}
