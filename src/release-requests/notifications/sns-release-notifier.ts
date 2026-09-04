import { Injectable } from '@nestjs/common';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import {
  ReleaseNotifier,
  ReleaseRequestNotification,
} from './release-notifier.js';

const TOPIC_ARN =
  'arn:aws:sns:us-east-1:882034443824:clearpath-release-requests-delivered';

@Injectable()
export class SnsReleaseNotifier extends ReleaseNotifier {
  private readonly client = new SNSClient({ region: 'us-east-1' });

  async notifyDelivered(request: ReleaseRequestNotification): Promise<void> {
    await this.client.send(
      new PublishCommand({
        TopicArn: TOPIC_ARN,
        Message: JSON.stringify(request),
      }),
    );
  }
}
