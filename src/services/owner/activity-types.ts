/** One row of Activity (`GET /owner/activity`); no before/after data, ever. */
export type ActivityItem = {
  id: string;
  at: string;
  actor: { id: string | null; name: string; role: string };
  salon: { id: string; name: string } | null;
  action: string;
  /** Plain words after the actor's name, e.g. "checked in a customer". */
  text: string;
  detail: string | null;
  link: string | null;
};

export const ACTIVITY_GROUPS = [
  { value: "bookings", label: "Bookings" },
  { value: "customers", label: "Customers & reviews" },
  { value: "catalogue", label: "Branch & services" },
  { value: "team", label: "Team" },
] as const;

export type ActivityGroup = (typeof ACTIVITY_GROUPS)[number]["value"];

export type ActivityFilters = {
  salonId?: string;
  actor?: string;
  action?: ActivityGroup;
  from?: string;
  to?: string;
};

export type ActivityPage = {
  items: ActivityItem[];
  nextCursor: string | null;
  /** Everyone who did something here in the last 90 days (page 1 only). */
  actors: { id: string; name: string }[];
};

/** The page's "When" filter (`?range`); 30 days when absent. */
export const ACTIVITY_RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
] as const;

export type ActivityRange = (typeof ACTIVITY_RANGES)[number]["value"];
