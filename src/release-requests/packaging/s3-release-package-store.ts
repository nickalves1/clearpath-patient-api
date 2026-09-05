import { Injectable } from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from '../../config/app-config.service.js';
import { ReleasePackageStore } from './release-package-store.js';

@Injectable()
export class S3ReleasePackageStore extends ReleasePackageStore {
  private readonly client = new S3Client({ region: 'us-east-1' });

  constructor(private readonly appConfig: AppConfigService) {
    super();
  }

  async upload(key: string, content: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.appConfig.releasePackagesBucketName,
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
      Bucket: this.appConfig.releasePackagesBucketName,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}
