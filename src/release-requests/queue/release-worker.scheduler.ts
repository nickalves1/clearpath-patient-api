import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ReleaseWorkerService } from './release-worker.service.js';

@Injectable()
export class ReleaseWorkerScheduler {
  private readonly logger = new Logger(ReleaseWorkerScheduler.name);

  constructor(private readonly worker: ReleaseWorkerService) {}

  @Interval(5000)
  async poll(): Promise<void> {
    try {
      await this.worker.processNext();
    } catch (error) {
      this.logger.error('Worker poll failed', error);
    }
  }
}
