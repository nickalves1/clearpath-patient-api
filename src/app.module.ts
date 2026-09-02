import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ReleaseRequestsModule } from './release-requests/release-requests.module.js';

@Module({
  imports: [ReleaseRequestsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
