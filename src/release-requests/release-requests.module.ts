import { Module } from "@nestjs/common";
import { IdempotencyModule } from '../idempotency/idempotency.module.js';
import { ReleaseRequestsController } from "./release-requests.controller.js";
import { ReleaseRequestsService } from "./release-requests.service.js";
import { InMemoryReleaseRequestsRepository } from "./repositories/in-memory-release-requests.repository.js";
import { ReleaseRequestsRepository } from "./repositories/release-requests.repository.js";

@Module({
    imports: [IdempotencyModule],
    controllers: [ReleaseRequestsController],
    providers: [
        ReleaseRequestsService,
        {
            provide: ReleaseRequestsRepository,
            useClass: InMemoryReleaseRequestsRepository,
        },
    ],
})
export class ReleaseRequestsModule {}