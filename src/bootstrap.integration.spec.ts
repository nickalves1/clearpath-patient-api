import { NestFactory } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { AppModule } from './app.module.js';
import { AppConfigModule } from './config/app-config.module.js';
import { ReleaseRequestsModule } from './release-requests/release-requests.module.js';

describe('Module bootstrap (catches DI wiring errors like missing exports)', () => {
  it('boots AppModule (used by main.ts)', async () => {
    const appContext = await NestFactory.createApplicationContext(AppModule);
    expect(appContext).toBeDefined();
    await appContext.close();
  });

  it('boots ReleaseRequestsModule (used by lambda.ts and worker-lambda.ts)', async () => {
    const appContext = await NestFactory.createApplicationContext(ReleaseRequestsModule);
    expect(appContext).toBeDefined();
    await appContext.close();
  });

  it('boots AppConfigModule (used by authorizer.ts)', async () => {
    const appContext = await NestFactory.createApplicationContext(AppConfigModule);
    expect(appContext).toBeDefined();
    await appContext.close();
  });
});
