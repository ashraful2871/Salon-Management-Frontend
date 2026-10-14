/** `GET /owner/reviews` (backend owner.reviews.ts) and `/reviews/:id/reply`. */

/** The Reviews page's `?show=` pills; "unreplied" is the default. */
export const SHOW_OPTIONS = [
  { value: "unreplied", label: "Needs a reply" },
  { value: "all", label: "All" },
  { value: "replied", label: "Replied" },
] as const;

export type ReviewFilters = {
  salonId?: string;
  rating?: number;
  /** "false" = still answerable; "true" = answered. */
  replied?: "true" | "false";
};

export type OwnerReview = {
  id: string;
  rating: number;
  /** Null on a HIDDEN review: its text is never shown. */
  comment: string | null;
  status: "PUBLISHED" | "HIDDEN";
  hiddenReason: string | null;
  createdAt: string;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  customer: { id: string; name: string; profilePhoto: string | null };
  salon: { id: string; name: string };
  staff: { id: string; name: string } | null;
  serviceName: string | null;
  visitDate: string;
  canReply: boolean;
  canEditReply: boolean;
};

export type ReviewSummary = {
  average: number;
  count: number;
  unreplied: number;
  breakdown: { stars: number; count: number }[];
  staff: { staffId: string; name: string; average: number; count: number }[];
};

export type ReviewPage = {
  items: OwnerReview[];
  nextCursor: string | null;
  /** First page only. */
  summary: ReviewSummary | null;
};

export type ReviewReply = { id: string; salonId: string; ownerReply: string; ownerRepliedAt: string };

export const reviewsQuery = (filters: ReviewFilters, cursor?: string) => {
  const query = new URLSearchParams();
  if (filters.salonId) query.set("salonId", filters.salonId);
  if (filters.rating) query.set("rating", String(filters.rating));
  if (filters.replied) query.set("replied", filters.replied);
  if (cursor) query.set("cursor", cursor);
  return query.toString();
};
