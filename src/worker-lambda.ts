import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { SQSBatchResponse, SQSEvent, SQSHandler } from 'aws-lambda';
import { ReleaseRequestsModule } from './release-requests/release-requests.module.js';
import { ReleaseWorkerService } from './release-requests/queue/release-worker.service.js';

const logger = new Logger('WorkerLambda');

let cachedWorker: ReleaseWorkerService;

async function bootstrap(): Promise<ReleaseWorkerService> {
  const appContext = await NestFactory.createApplicationContext(
    ReleaseRequestsModule,
  );
  return appContext.get(ReleaseWorkerService);
}

export const handler: SQSHandler = async (
  event: SQSEvent,
): Promise<SQSBatchResponse> => {
  cachedWorker = cachedWorker ?? (await bootstrap());

  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      await cachedWorker.deliverReleaseRequest(body.releaseRequestId);
    } catch (error) {
      logger.error(`Failed to process message ${record.messageId}`, error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
