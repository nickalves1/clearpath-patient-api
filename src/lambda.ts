import { configure } from '@codegenie/serverless-express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { Handler } from 'aws-lambda';
import express from 'express';
import { ReleaseRequestsModule } from './release-requests/release-requests.module.js';

let cachedHandler: Handler;

async function bootstrap(): Promise<Handler> {
  const expressApp = express();
  const nestApp = await NestFactory.create(
    ReleaseRequestsModule,
    new ExpressAdapter(expressApp),
  );
  await nestApp.init();

  return configure({ app: expressApp });
}

export const handler: Handler = async (event, context, callback) => {
  cachedHandler = cachedHandler ?? (await bootstrap());
  return cachedHandler(event, context, callback);
};
