import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { IdempotencyStore } from '../idempotency/idempotency-store.js';
import { CreateReleaseRequestDto } from './dto/create-release-request.dto.js';
import { ReleaseRequestsService } from './release-requests.service.js';

@Controller('release-requests')
export class ReleaseRequestsController {
    constructor(
        private readonly service: ReleaseRequestsService,
        private readonly idempotencyStore: IdempotencyStore,
    ) {}

    @Post()
    async create(
        @Body() dto: CreateReleaseRequestDto,
        @Headers('idempotency-key') idempotencyKey: string,
    ) {
        if (!idempotencyKey) {
            throw new BadRequestException('The Idempotency-Key header is required');
        }

        const claimed = await this.idempotencyStore.claim(idempotencyKey);

        if (!claimed) {
            throw new ConflictException('This request was already processed');
        }

        return this.service.requestRelease(dto);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const request = await this.service.findById(id);

        if (!request) {
            throw new NotFoundException(`Release request ${id} not found`);
        }

        return request;
    }
}