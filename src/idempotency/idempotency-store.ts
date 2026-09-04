export abstract class IdempotencyStore {
  abstract claim(key: string): Promise<boolean>;
}
