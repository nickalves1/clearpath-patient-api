import { ReleaseRequest } from '../domain/release-request.js';

export abstract class StudyPackager {
  abstract package(request: ReleaseRequest): Promise<Buffer>;
}
