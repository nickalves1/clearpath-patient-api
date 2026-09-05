import { Injectable } from '@nestjs/common';
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { AppConfigService } from '../../config/app-config.service.js';
import {
  QueueMessage,
  ReleaseRequestsQueue,
} from './release-requests-queue.js';

@Injectable()
export class SqsReleaseRequestsQueue extends ReleaseRequestsQueue {
  private readonly client = new SQSClient({ region: 'us-east-1' });

  constructor(private readonly appConfig: AppConfigService) {
    super();
  }

  async enqueue(releaseRequestId: string): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.appConfig.releaseRequestsQueueUrl,
        MessageBody: JSON.stringify({ releaseRequestId }),
      }),
    );
  }

  async receiveMessages(): Promise<QueueMessage[]> {
    const response = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: this.appConfig.releaseRequestsQueueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 5,
      }),
    );

    return (response.Messages ?? []).map((message) => {
      const body = JSON.parse(message.Body ?? '{}');

      return {
        releaseRequestId: body.releaseRequestId,
        receiptHandle: message.ReceiptHandle!,
      };
    });
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    await this.client.send(
      new DeleteMessageCommand({
        QueueUrl: this.appConfig.releaseRequestsQueueUrl,
        ReceiptHandle: receiptHandle,
      }),
    );
  }
}
