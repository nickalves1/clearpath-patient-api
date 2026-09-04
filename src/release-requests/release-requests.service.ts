import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ReleaseRequest } from './domain/release-request.js';
import { ReleaseRequestsRepository } from './repositories/release-requests.repository.js';

@Injectable()
export class ReleaseRequestsService {
  constructor(private readonly repository: ReleaseRequestsRepository) {}

  async requestRelease(input: {
    patientId: string;
    hospitalIds: string[];
    dateRangeFrom: string;
    dateRangeTo: string;
  }): Promise<ReleaseRequest> {
    const request: ReleaseRequest = {
      id: randomUUID(),
      patientId: input.patientId,
      hospitalIds: input.hospitalIds,
      dateRangeFrom: input.dateRangeFrom,
      dateRangeTo: input.dateRangeTo,
      status: 'received',
      createdAt: new Date(),
    };

    await this.repository.save(request);

    return request;
  }

  async findById(id: string): Promise<ReleaseRequest | null> {
    return this.repository.findById(id);
  }
}
