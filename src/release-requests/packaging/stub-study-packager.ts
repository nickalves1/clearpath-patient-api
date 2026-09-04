import { Injectable } from '@nestjs/common';
import { ReleaseRequest } from '../domain/release-request.js';
import { StudyPackager } from './study-packager.js';

@Injectable()
export class StubStudyPackager extends StudyPackager {
  async package(request: ReleaseRequest): Promise<Buffer> {
    const placeholder = JSON.stringify({
      note: 'Stub package — real study files land with phase 02 (S3 study upload).',
      releaseRequestId: request.id,
      patientId: request.patientId,
      hospitalIds: request.hospitalIds,
    });

    return Buffer.from(placeholder, 'utf-8');
  }
}
