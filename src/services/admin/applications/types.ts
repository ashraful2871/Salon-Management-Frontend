import type { AdminListMeta } from "../users/types";

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AdminApplicationFilters = {
  search?: string;
  status?: string;
  page?: number;
};

export type AdminApplicationListMeta = AdminListMeta & {
  statusCounts?: Partial<Record<ApplicationStatus, number>>;
};

export type AdminApplication = {
  id: string;
  userId: string;
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  documentUrl: string | null;
  verificationStatus: boolean;
  applicationStatus: ApplicationStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    createdAt: string;
  };
};
