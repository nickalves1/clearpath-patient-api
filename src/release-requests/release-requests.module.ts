import { Module } from '@nestjs/common';
import { IdempotencyModule } from '../idempotency/idempotency.module.js';
import { ReleaseNotifier } from './notifications/release-notifier.js';
import { SnsReleaseNotifier } from './notifications/sns-release-notifier.js';
import { ReleasePackageStore } from './packaging/release-package-store.js';
import { S3ReleasePackageStore } from './packaging/s3-release-package-store.js';
import { StubStudyPackager } from './packaging/stub-study-packager.js';
import { StudyPackager } from './packaging/study-packager.js';
import { ReleaseRequestsQueue } from './queue/release-requests-queue.js';
import { ReleaseWorkerScheduler } from './queue/release-worker.scheduler.js';
import { ReleaseWorkerService } from './queue/release-worker.service.js';
import { SqsReleaseRequestsQueue } from './queue/sqs-release-requests-queue.js';
import { ReleaseRequestsController } from './release-requests.controller.js';
import { ReleaseRequestsService } from './release-requests.service.js';
import { InMemoryReleaseRequestsRepository } from './repositories/in-memory-release-requests.repository.js';
import { ReleaseRequestsRepository } from './repositories/release-requests.repository.js';

@Module({
  imports: [IdempotencyModule],
  controllers: [ReleaseRequestsController],
  providers: [
    ReleaseRequestsService,
    ReleaseWorkerService,
    ReleaseWorkerScheduler,
    {
      provide: ReleaseRequestsRepository,
      useClass: InMemoryReleaseRequestsRepository,
    },
    { provide: ReleaseRequestsQueue, useClass: SqsReleaseRequestsQueue },
    { provide: StudyPackager, useClass: StubStudyPackager },
    { provide: ReleasePackageStore, useClass: S3ReleasePackageStore },
    { provide: ReleaseNotifier, useClass: SnsReleaseNotifier },
  ],
})
export class ReleaseRequestsModule {}
