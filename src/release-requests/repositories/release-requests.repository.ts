import { ReleaseRequest } from '../domain/release-request.js';

export abstract class ReleaseRequestsRepository {
  abstract save(request: ReleaseRequest): Promise<void>;
  abstract findById(id: string): Promise<ReleaseRequest | null>;
}
