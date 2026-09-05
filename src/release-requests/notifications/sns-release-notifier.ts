import { Injectable } from '@nestjs/common';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { AppConfigService } from '../../config/app-config.service.js';
import {
  ReleaseNotifier,
  ReleaseRequestNotification,
} from './release-notifier.js';

@Injectable()
export class SnsReleaseNotifier extends ReleaseNotifier {
  private readonly client = new SNSClient({ region: 'us-east-1' });

  constructor(private readonly appConfig: AppConfigService) {
    super();
  }

  async notifyDelivered(request: ReleaseRequestNotification): Promise<void> {
    await this.client.send(
      new PublishCommand({
        TopicArn: this.appConfig.releaseDeliveredTopicArn,
        Message: JSON.stringify(request),
      }),
    );
  }
}
