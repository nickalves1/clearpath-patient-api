import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GetParametersByPathCommand, SSMClient } from '@aws-sdk/client-ssm';

@Injectable()
export class AppConfigService implements OnModuleInit {
  private readonly logger = new Logger(AppConfigService.name);
  private readonly client = new SSMClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
  private readonly values = new Map<string, string>();

  async onModuleInit(): Promise<void> {
    const response = await this.client.send(
      new GetParametersByPathCommand({
        Path: '/clearpath/patient-api',
        Recursive: true,
        WithDecryption: true,
      }),
    );

    for (const param of response.Parameters ?? []) {
      if (param.Name && param.Value) {
        this.values.set(param.Name, param.Value);
      }
    }

    this.logger.log(`Loaded ${this.values.size} parameters from SSM`);
  }

  get idempotencyKeysTableName(): string {
    return this.getValue('/clearpath/patient-api/dynamodb/idempotency-keys-table-name');
  }

  get releaseRequestsTableName(): string {
    return this.getValue('/clearpath/patient-api/dynamodb/release-requests-table-name');
  }

  get releasePackagesBucketName(): string {
    return this.getValue('/clearpath/patient-api/s3/release-packages-bucket-name');
  }

  get releaseDeliveredTopicArn(): string {
    return this.getValue('/clearpath/patient-api/sns/release-delivered-topic-arn');
  }

  get releaseRequestsQueueUrl(): string {
    return this.getValue('/clearpath/patient-api/sqs/release-requests-queue-url');
  }

  get sharedSecret(): string {
    return this.getValue('/clearpath/patient-api/auth/shared-secret');
  }

  private getValue(key: string): string {
    const value = this.values.get(key);

    if (!value) {
      throw new Error(`Missing SSM parameter: ${key}`);
    }

    return value;
  }
}