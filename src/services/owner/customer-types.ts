/** `GET /owner/customers` and `/owner/customers/:id` (backend owner.customers.ts). */

export const CUSTOMER_SEGMENTS = [
  { value: "new", label: "New" },
  { value: "regular", label: "Regulars" },
  { value: "lapsed", label: "Lapsed" },
  { value: "noshow", label: "No-show risk" },
] as const;

export type CustomerSegment = (typeof CUSTOMER_SEGMENTS)[number]["value"];

export type CustomerFilters = {
  salonId?: string;
  segment?: CustomerSegment;
  search?: string;
};

/** Phone and email are full for the owner, masked for staff (`contactMasked`). */
type Contact = {
  phone: string | null;
  email: string | null;
  contactMasked: boolean;
};

export type OwnerCustomer = Contact & {
  customerId: string;
  name: string;
  profilePhoto: string | null;
  visits: number;
  bookings: number;
  firstVisit: string | null;
  lastVisit: string | null;
  lastBookingAt: string;
  spentMinor: number;
  noShows: number;
  tags: string[];
};

export type CustomerCounts = Record<"all" | CustomerSegment, number>;

export type CustomerPage = {
  items: OwnerCustomer[];
  nextCursor: string | null;
  /** First page only. */
  counts: CustomerCounts | null;
};

export type CustomerTimelineItem = {
  id: string;
  token: string | null;
  appointmentDate: string;
  startTime: string;
  status: string;
  totalMinor: number;
  depositMinor: number;
  depositStatus: string;
  bookedVia: string;
  salon: { id: string; name: string };
  service: { id: string; name: string };
  staff: { id: string; name: string } | null;
  rating: number | null;
};

export type CustomerReview = {
  id: string;
  rating: number;
  comment: string | null;
  status: "PUBLISHED" | "HIDDEN";
  hiddenReason: string | null;
  createdAt: string;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  salon: { id: string; name: string };
};

export type CustomerNote = { note: string | null; tags: string[]; updatedAt: string | null };

export type CustomerDetail = {
  customer: Contact & { customerId: string; name: string; profilePhoto: string | null; memberSince: string };
  stats: {
    bookings: number;
    visits: number;
    cancelled: number;
    noShows: number;
    forfeits: number;
    spentMinor: number;
    firstVisit: string | null;
    lastVisit: string | null;
    favouriteService: { id: string; name: string; count: number } | null;
    favouriteStylist: { id: string; name: string; count: number } | null;
  };
  timeline: CustomerTimelineItem[];
  reviews: CustomerReview[];
  note: CustomerNote;
};

export const customersQuery = (filters: CustomerFilters, cursor?: string) => {
  const query = new URLSearchParams();
  if (filters.salonId) query.set("salonId", filters.salonId);
  if (filters.segment) query.set("segment", filters.segment);
  if (filters.search) query.set("search", filters.search);
  if (cursor) query.set("cursor", cursor);
  return query.toString();
};
