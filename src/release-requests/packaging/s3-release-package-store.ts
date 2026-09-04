import { Injectable } from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ReleasePackageStore } from './release-package-store.js';

const BUCKET_NAME = 'clearpath-patient-api-release-packages-882034443824';

@Injectable()
export class S3ReleasePackageStore extends ReleasePackageStore {
  private readonly client = new S3Client({ region: 'us-east-1' });

  async upload(key: string, content: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: content,
      }),
    );
  }

  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds: number,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}
