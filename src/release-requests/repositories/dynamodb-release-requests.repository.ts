import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { AppConfigService } from '../../config/app-config.service.js';
import { ReleaseRequest } from '../domain/release-request.js';
import { ReleaseRequestsRepository } from './release-requests.repository.js';

@Injectable()
export class DynamoDbReleaseRequestsRepository extends ReleaseRequestsRepository {
  private readonly documentClient: DynamoDBDocumentClient;

  constructor(private readonly appConfig: AppConfigService) {
    super();

    const localEndpoint = process.env.DYNAMODB_ENDPOINT;

    const client = new DynamoDBClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      ...(localEndpoint && {
        endpoint: localEndpoint,
        credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
      }),
    });

    this.documentClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  async save(request: ReleaseRequest): Promise<void> {
    await this.documentClient.send(
      new PutCommand({
        TableName: this.appConfig.releaseRequestsTableName,
        Item: {
          ...request,
          createdAt: request.createdAt.toISOString(),
          deliveredAt: request.deliveredAt?.toISOString(),
          notifiedAt: request.notifiedAt?.toISOString(),
        },
      }),
    );
  }

  async findById(id: string): Promise<ReleaseRequest | null> {
    const response = await this.documentClient.send(
      new GetCommand({
        TableName: this.appConfig.releaseRequestsTableName,
        Key: { id },
        ConsistentRead: true,
      }),
    );

    if (!response.Item) {
      return null;
    }

    const item = response.Item;

    return {
      ...item,
      createdAt: new Date(item.createdAt),
      deliveredAt: item.deliveredAt ? new Date(item.deliveredAt) : undefined,
      notifiedAt: item.notifiedAt ? new Date(item.notifiedAt) : undefined,
    } as ReleaseRequest;
  }
}
