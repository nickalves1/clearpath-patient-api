export type QueueMessage = {
  releaseRequestId: string;
  receiptHandle: string;
};

export abstract class ReleaseRequestsQueue {
  abstract enqueue(releaseRequestId: string): Promise<void>;
  abstract receiveMessages(): Promise<QueueMessage[]>;
  abstract deleteMessage(receiptHandle: string): Promise<void>;
}
