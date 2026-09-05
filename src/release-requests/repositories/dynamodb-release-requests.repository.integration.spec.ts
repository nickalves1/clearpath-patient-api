import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppConfigService } from '../../config/app-config.service.js';
import { ReleaseRequest } from '../domain/release-request.js';
import { DynamoDbReleaseRequestsRepository } from './dynamodb-release-requests.repository.js';

class FakeAppConfigService extends AppConfigService {
  override get releaseRequestsTableName(): string {
    return 'clearpath-release-requests';
  }
}

describe('DynamoDbReleaseRequestsRepository', () => {
  let repository: DynamoDbReleaseRequestsRepository;

  beforeEach(() => {
    repository = new DynamoDbReleaseRequestsRepository(new FakeAppConfigService());
  });

  it('saves a release request and reads it back immediately', async () => {
    const request: ReleaseRequest = {
      id: randomUUID(),
      patientId: 'patient-1',
      hospitalIds: ['hospital-1', 'hospital-2'],
      dateRangeFrom: '2026-01-01',
      dateRangeTo: '2026-09-01',
      status: 'received',
      createdAt: new Date(),
    };

    await repository.save(request);
    const found = await repository.findById(request.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(request.id);
    expect(found?.patientId).toBe(request.patientId);
    expect(found?.hospitalIds).toEqual(request.hospitalIds);
    expect(found?.createdAt).toBeInstanceOf(Date);
    expect(found?.status).toBe('received');
  });

  it('returns null for a release request that does not exist', async () => {
    const found = await repository.findById(randomUUID());

    expect(found).toBeNull();
  });

  it('persists optional fields correctly after an update', async () => {
    const request: ReleaseRequest = {
      id: randomUUID(),
      patientId: 'patient-2',
      hospitalIds: ['hospital-1'],
      dateRangeFrom: '2026-01-01',
      dateRangeTo: '2026-09-01',
      status: 'received',
      createdAt: new Date(),
    };

    await repository.save(request);

    const delivered: ReleaseRequest = {
      ...request,
      status: 'delivered',
      downloadUrl: 'https://example.com/signed',
      deliveredAt: new Date(),
    };

    await repository.save(delivered);
    const found = await repository.findById(request.id);

    expect(found?.status).toBe('delivered');
    expect(found?.downloadUrl).toBe('https://example.com/signed');
    expect(found?.deliveredAt).toBeInstanceOf(Date);
    expect(found?.notifiedAt).toBeUndefined();
  });
});
