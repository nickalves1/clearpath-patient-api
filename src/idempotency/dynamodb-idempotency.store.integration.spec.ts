import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { DynamoDbIdempotencyStore } from './dynamodb-idempotency.store.js';

describe('DynamoDbIdempotencyStore', () => {
  let store: DynamoDbIdempotencyStore;

  beforeEach(() => {
    store = new DynamoDbIdempotencyStore();
  });

  it('claims a key that has never been used', async () => {
    const key = randomUUID();

    const claimed = await store.claim(key);

    expect(claimed).toBe(true);
  });

  it('refuses to claim a key that was already claimed', async () => {
    const key = randomUUID();

    await store.claim(key);
    const secondAttempt = await store.claim(key);

    expect(secondAttempt).toBe(false);
  });
});
