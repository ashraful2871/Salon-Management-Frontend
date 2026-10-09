export type AdminReviewTab = "reported" | "low" | "all" | "hidden";

export type AdminReviewFilters = {
  tab?: string;
  salonId?: string;
  rating?: string;
  includeTest?: string;
  q?: string;
  sort?: string;
  page?: number;
};

export type AdminReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  status: "PUBLISHED" | "HIDDEN";
  hiddenReason: string | null;
  reportCount: number;
  moderatedAt: string | null;
  createdAt: string;
  salon: { id: string; name: string };
  /** Email masked by the API. */
  customer: { id: string; name: string; email: string };
  reports: { reason: string; note: string | null; createdAt: string }[];
};

export type AdminReviewListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  tabCounts: { reported: number; low: number; hidden: number };
};
