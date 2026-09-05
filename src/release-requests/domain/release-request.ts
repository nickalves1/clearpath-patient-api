export type ReleaseRequestStatus =
  'received' | 'verified' | 'scoped' | 'processing' | 'delivered';

export type ReleaseRequest = {
  id: string;
  patientId: string;
  hospitalIds: string[];
  dateRangeFrom: string;
  dateRangeTo: string;
  status: ReleaseRequestStatus;
  createdAt: Date;
  downloadUrl?: string;
  deliveredAt?: Date;
  notifiedAt?: Date;
};
