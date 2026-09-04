export abstract class ReleaseNotifier {
  abstract notifyDelivered(request: ReleaseRequestNotification): Promise<void>;
}

export type ReleaseRequestNotification = {
  releaseRequestId: string;
  patientId: string;
  downloadUrl: string;
};
