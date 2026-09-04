import { Injectable } from '@nestjs/common';
import { ReleaseRequest } from '../domain/release-request.js';
import { ReleaseRequestsRepository } from './release-requests.repository.js';

@Injectable()
export class InMemoryReleaseRequestsRepository extends ReleaseRequestsRepository {
  private readonly requests = new Map<string, ReleaseRequest>();

  async save(request: ReleaseRequest): Promise<void> {
    this.requests.set(request.id, request);
  }

  async findById(id: string): Promise<ReleaseRequest | null> {
    return this.requests.get(id) ?? null;
  }
}
