import { Injectable, Logger } from '@nestjs/common';
import { ReleaseRequest } from '../domain/release-request.js';
import { ReleaseNotifier } from '../notifications/release-notifier.js';
import { ReleasePackageStore } from '../packaging/release-package-store.js';
import { StudyPackager } from '../packaging/study-packager.js';
import { ReleaseRequestsRepository } from '../repositories/release-requests.repository.js';
import {
  QueueMessage,
  ReleaseRequestsQueue,
} from './release-requests-queue.js';

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

@Injectable()
export class ReleaseWorkerService {
  private readonly logger = new Logger(ReleaseWorkerService.name);

  constructor(
    private readonly queue: ReleaseRequestsQueue,
    private readonly repository: ReleaseRequestsRepository,
    private readonly packager: StudyPackager,
    private readonly packageStore: ReleasePackageStore,
    private readonly notifier: ReleaseNotifier,
  ) {}

  async processNext(): Promise<void> {
    const messages = await this.queue.receiveMessages();

    for (const message of messages) {
      await this.processMessage(message);
    }
  }

  private async processMessage(message: QueueMessage): Promise<void> {
    try {
      const request = await this.repository.findById(message.releaseRequestId);

      if (!request) {
        this.logger.warn(
          `Release request ${message.releaseRequestId} not found, dropping message`,
        );
        await this.queue.deleteMessage(message.receiptHandle);
        return;
      }

      const packageContent = await this.packager.package(request);
      const key = `release-requests/${request.id}.json`;

      await this.packageStore.upload(key, packageContent);
      const downloadUrl = await this.packageStore.getSignedDownloadUrl(
        key,
        SIGNED_URL_EXPIRY_SECONDS,
      );

      const deliveredRequest: ReleaseRequest = {
        ...request,
        status: 'delivered',
        downloadUrl,
        deliveredAt: new Date(),
      };

      await this.repository.save(deliveredRequest);

      await this.notifier.notifyDelivered({
        releaseRequestId: request.id,
        patientId: request.patientId,
        downloadUrl,
      });

      await this.queue.deleteMessage(message.receiptHandle);
    } catch (error) {
      this.logger.error(
        `Failed to process release request ${message.releaseRequestId}`,
        error,
      );
    }
  }
}
