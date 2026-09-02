import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { CreateReleaseRequestDto } from './dto/create-release-request.dto.js';
import { ReleaseRequestsService } from './release-requests.service.js';

@Controller('release-requests')
export class ReleaseRequestsController {
    constructor(private readonly service: ReleaseRequestsService) {}

    @Post()
    create(@Body() dto: CreateReleaseRequestDto) {
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