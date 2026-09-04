import { Injectable } from '@nestjs/common';
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import {
  QueueMessage,
  ReleaseRequestsQueue,
} from './release-requests-queue.js';

const QUEUE_URL =
  'https://sqs.us-east-1.amazonaws.com/882034443824/clearpath-release-requests-queue';

@Injectable()
export class SqsReleaseRequestsQueue extends ReleaseRequestsQueue {
  private readonly client = new SQSClient({ region: 'us-east-1' });

  async enqueue(releaseRequestId: string): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({ releaseRequestId }),
      }),
    );
  }

  async receiveMessages(): Promise<QueueMessage[]> {
    const response = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
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
        QueueUrl: QUEUE_URL,
        ReceiptHandle: receiptHandle,
      }),
    );
  }
}
