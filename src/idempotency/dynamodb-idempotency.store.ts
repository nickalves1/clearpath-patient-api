import { Injectable } from '@nestjs/common';
import {
  ConditionalCheckFailedException,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { IdempotencyStore } from './idempotency-store.js';

const TABLE_NAME = 'clearpath-idempotency-keys';

@Injectable()
export class DynamoDbIdempotencyStore extends IdempotencyStore {
  private readonly documentClient: DynamoDBDocumentClient;

  constructor() {
    super();

    const localEndpoint = process.env.DYNAMODB_ENDPOINT;

    const client = new DynamoDBClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      ...(localEndpoint && {
        endpoint: localEndpoint,
        credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
      }),
    });

    this.documentClient = DynamoDBDocumentClient.from(client);
  }

  async claim(key: string): Promise<boolean> {
    try {
      await this.documentClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: { idempotencyKey: key },
          ConditionExpression: 'attribute_not_exists(idempotencyKey)',
        }),
      );

      return true;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false;
      }

      throw error;
    }
  }
}
