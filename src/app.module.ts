import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ReleaseRequestsModule } from './release-requests/release-requests.module.js';

@Module({
  imports: [ScheduleModule.forRoot(), ReleaseRequestsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
