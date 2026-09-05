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
      await this.deliverReleaseRequest(message.releaseRequestId);
      await this.queue.deleteMessage(message.receiptHandle);
    } catch (error) {
      this.logger.error(
        `Failed to process release request ${message.releaseRequestId}`,
        error,
      );
    }
  }

  async deliverReleaseRequest(releaseRequestId: string): Promise<void> {
    const request = await this.repository.findById(releaseRequestId);

    if (!request) {
      this.logger.warn(
        `Release request ${releaseRequestId} not found, skipping`,
      );
      return;
    }

    if (request.status === 'delivered' && request.notifiedAt) {
      this.logger.log(
        `Release request ${releaseRequestId} already fully delivered, skipping`,
      );
      return;
    }

    let downloadUrl = request.downloadUrl;

    if (!downloadUrl) {
      const packageContent = await this.packager.package(request);
      const key = `release-requests/${request.id}.json`;

      await this.packageStore.upload(key, packageContent);
      downloadUrl = await this.packageStore.getSignedDownloadUrl(
        key,
        SIGNED_URL_EXPIRY_SECONDS,
      );

      await this.repository.save({
        ...request,
        status: 'delivered',
        downloadUrl,
        deliveredAt: request.deliveredAt ?? new Date(),
      });
    }

    if (!request.notifiedAt) {
      await this.notifier.notifyDelivered({
        releaseRequestId: request.id,
        patientId: request.patientId,
        downloadUrl,
      });

      await this.repository.save({
        ...request,
        status: 'delivered',
        downloadUrl,
        deliveredAt: request.deliveredAt ?? new Date(),
        notifiedAt: new Date(),
      });
    }
  }
}
