import { Module } from '@nestjs/common';
import { DynamoDbIdempotencyStore } from './dynamodb-idempotency.store.js';
import { IdempotencyStore } from './idempotency-store.js';

@Module({
  providers: [
    {
      provide: IdempotencyStore,
      useClass: DynamoDbIdempotencyStore,
    },
  ],
  exports: [IdempotencyStore],
})
export class IdempotencyModule {}
