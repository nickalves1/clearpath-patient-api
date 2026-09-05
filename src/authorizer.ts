import { NestFactory } from '@nestjs/core';
import type { Handler } from 'aws-lambda';
import { AppConfigModule } from './config/app-config.module.js';
import { AppConfigService } from './config/app-config.service.js';

let cachedConfig: AppConfigService;

async function bootstrap(): Promise<AppConfigService> {
  const appContext = await NestFactory.createApplicationContext(AppConfigModule);
  return appContext.get(AppConfigService);
}

export const handler: Handler = async (event) => {
  cachedConfig = cachedConfig ?? (await bootstrap());

  const providedSecret = event.headers?.['x-api-key'];

  return {
    isAuthorized: providedSecret === cachedConfig.sharedSecret,
  };
};
