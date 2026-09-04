export abstract class ReleasePackageStore {
  abstract upload(key: string, content: Buffer): Promise<void>;
  abstract getSignedDownloadUrl(
    key: string,
    expiresInSeconds: number,
  ): Promise<string>;
}
