import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CanopyStack } from '../lib/canopy-stack';

describe('CanopyStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new CanopyStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  // Template structure test (replaces snapshot to avoid CI/local hash divergence)
  test('produces valid CloudFormation template', () => {
    const json = template.toJSON();
    expect(json).toBeDefined();
    expect(json.Resources).toBeDefined();
    expect(Object.keys(json.Resources).length).toBeGreaterThan(5);
    expect(json.Outputs).toBeDefined();
  });

  // DynamoDB table assertions
  test('creates DynamoDB table with correct key schema', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'canopy-projects-table',
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    });
  });

  test('DynamoDB table has 3 GSIs', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'GSI1PK', KeyType: 'HASH' },
            { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
          ],
        }),
        Match.objectLike({
          IndexName: 'GSI2',
          KeySchema: [
            { AttributeName: 'GSI2PK', KeyType: 'HASH' },
            { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
          ],
        }),
        Match.objectLike({
          IndexName: 'GSI3',
          KeySchema: [
            { AttributeName: 'GSI3PK', KeyType: 'HASH' },
            { AttributeName: 'GSI3SK', KeyType: 'RANGE' },
          ],
        }),
      ]),
    });
  });

  // Lambda assertions
  test('creates Lambda function with Node.js 20', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'canopy-api-handler',
      Runtime: 'nodejs20.x',
      MemorySize: 512,
      Timeout: 30,
    });
  });

  test('Lambda has TABLE_NAME environment variable', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: Match.objectLike({
          TABLE_NAME: Match.anyValue(),
        }),
      },
    });
  });

  // API Gateway assertions
  test('creates HTTP API with CORS', () => {
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      Name: 'canopy-api',
      ProtocolType: 'HTTP',
      CorsConfiguration: Match.objectLike({
        AllowMethods: Match.arrayWith(['GET', 'POST', 'PUT', 'DELETE']),
        AllowOrigins: ['*'],
      }),
    });
  });

  // S3 bucket assertions
  test('creates S3 bucket for frontend', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  // CloudFront assertions
  test('creates CloudFront distribution', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultRootObject: 'index.html',
      }),
    });
  });

  // IAM assertions - Lambda has DynamoDB permissions
  test('Lambda has DynamoDB read/write permissions', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith([
              'dynamodb:BatchGetItem',
              'dynamodb:Query',
              'dynamodb:GetItem',
              'dynamodb:Scan',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
            ]),
            Effect: 'Allow',
          }),
        ]),
        Version: '2012-10-17',
      },
    });
  });

  // Stack outputs
  test('has required stack outputs', () => {
    template.hasOutput('ApiUrl', {});
    template.hasOutput('FrontendBucketName', {});
    template.hasOutput('DistributionId', {});
    template.hasOutput('DistributionDomain', {});
  });
});
