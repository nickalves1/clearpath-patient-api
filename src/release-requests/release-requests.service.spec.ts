import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReleaseRequest } from './domain/release-request.js';
import { ReleaseRequestsRepository } from './repositories/release-requests.repository.js';
import { ReleaseRequestsService } from './release-requests.service.js';

class FakeReleaseRequestsRepository extends ReleaseRequestsRepository {
  public savedRequests: ReleaseRequest[] = [];

  async save(request: ReleaseRequest): Promise<void> {
    this.savedRequests.push(request);
  }

  async findById(id: string): Promise<ReleaseRequest | null> {
    return this.savedRequests.find((request) => request.id === id) ?? null;
  }
}

describe('ReleaseRequestsService', () => {
  let service: ReleaseRequestsService;
  let repository: FakeReleaseRequestsRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReleaseRequestsService,
        {
          provide: ReleaseRequestsRepository,
          useClass: FakeReleaseRequestsRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(ReleaseRequestsService);
    repository = moduleRef.get(
      ReleaseRequestsRepository,
    ) as FakeReleaseRequestsRepository;
  });

  it('saves the release request through whichever repository is bound', async () => {
    const request = await service.requestRelease({
      patientId: 'patient-123',
      hospitalIds: ['hospital-1'],
      dateRangeFrom: '2026-01-01',
      dateRangeTo: '2026-09-01',
    });

    expect(repository.savedRequests).toContainEqual(request);
  });

  it('finds a previously saved request by id', async () => {
    const created = await service.requestRelease({
      patientId: 'patient-456',
      hospitalIds: ['hospital-2'],
      dateRangeFrom: '2026-02-01',
      dateRangeTo: '2026-03-01',
    });

    const found = await service.findById(created.id);

    expect(found).toEqual(created);
  });
});
