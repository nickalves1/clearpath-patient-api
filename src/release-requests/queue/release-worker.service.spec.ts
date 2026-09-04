import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReleaseRequest } from '../domain/release-request.js';
import { ReleaseNotifier, ReleaseRequestNotification } from '../notifications/release-notifier.js';
import { ReleasePackageStore } from '../packaging/release-package-store.js';
import { StudyPackager } from '../packaging/study-packager.js';
import { ReleaseRequestsRepository } from '../repositories/release-requests.repository.js';
import { QueueMessage, ReleaseRequestsQueue } from './release-requests-queue.js';
import { ReleaseWorkerService } from './release-worker.service.js';

const EXISTING_REQUEST: ReleaseRequest = {
  id: 'request-1',
  patientId: 'patient-1',
  hospitalIds: ['hospital-1'],
  dateRangeFrom: '2026-01-01',
  dateRangeTo: '2026-09-01',
  status: 'received',
  createdAt: new Date('2026-01-01'),
};

class FakeQueue extends ReleaseRequestsQueue {
  deleted: string[] = [];
  messages: QueueMessage[] = [{ releaseRequestId: EXISTING_REQUEST.id, receiptHandle: 'receipt-1' }];

  async enqueue(): Promise<void> {}
  async receiveMessages() { return this.messages; }
  async deleteMessage(receiptHandle: string) { this.deleted.push(receiptHandle); }
}

class FakeRepository extends ReleaseRequestsRepository {
  saved: ReleaseRequest[] = [EXISTING_REQUEST];

  async save(request: ReleaseRequest) {
    this.saved = this.saved.filter((r) => r.id !== request.id).concat(request);
  }

  async findById(id: string) {
    return this.saved.find((r) => r.id === id) ?? null;
  }
}

class FakePackager extends StudyPackager {
  async package() { return Buffer.from('fake-package'); }
}

class FakePackageStore extends ReleasePackageStore {
  async upload(): Promise<void> {}
  async getSignedDownloadUrl() { return 'https://example.com/signed-url'; }
}

class FakeNotifier extends ReleaseNotifier {
  notified: ReleaseRequestNotification[] = [];
  async notifyDelivered(notification: ReleaseRequestNotification) { this.notified.push(notification); }
}

describe('ReleaseWorkerService', () => {
  let worker: ReleaseWorkerService;
  let queue: FakeQueue;
  let repository: FakeRepository;
  let notifier: FakeNotifier;
  let packageStore: FakePackageStore;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReleaseWorkerService,
        { provide: ReleaseRequestsQueue, useClass: FakeQueue },
        { provide: ReleaseRequestsRepository, useClass: FakeRepository },
        { provide: StudyPackager, useClass: FakePackager },
        { provide: ReleasePackageStore, useClass: FakePackageStore },
        { provide: ReleaseNotifier, useClass: FakeNotifier },
      ],
    }).compile();

    worker = moduleRef.get(ReleaseWorkerService);
    queue = moduleRef.get(ReleaseRequestsQueue) as FakeQueue;
    repository = moduleRef.get(ReleaseRequestsRepository) as FakeRepository;
    notifier = moduleRef.get(ReleaseNotifier) as FakeNotifier;
    packageStore = moduleRef.get(ReleasePackageStore) as FakePackageStore;
  });

  it('delivers a release request end to end and acknowledges the message', async () => {
    await worker.processNext();

    const updated = await repository.findById(EXISTING_REQUEST.id);
    expect(updated?.status).toBe('delivered');
    expect(updated?.downloadUrl).toBe('https://example.com/signed-url');
    expect(updated?.deliveredAt).toBeInstanceOf(Date);

    expect(notifier.notified).toEqual([
      {
        releaseRequestId: EXISTING_REQUEST.id,
        patientId: EXISTING_REQUEST.patientId,
        downloadUrl: 'https://example.com/signed-url',
      },
    ]);

    expect(queue.deleted).toEqual(['receipt-1']);
  });

  it('does not acknowledge the message when processing fails', async () => {
    packageStore.upload = async () => {
      throw new Error('S3 is down');
    };

    await worker.processNext();

    expect(queue.deleted).toEqual([]);
  });
});