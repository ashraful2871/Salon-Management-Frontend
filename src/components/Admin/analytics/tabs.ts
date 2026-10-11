/** The Analytics page tabs (`?tab=`). Plain module: the server page and the client tab strip both read it. */
export const ANALYTICS_TABS = [
  { key: "overview", label: "Overview" },
  { key: "bookings", label: "Bookings" },
  { key: "customers", label: "Customers" },
  { key: "salons", label: "Salons" },
  { key: "discovery", label: "Discovery" },
  { key: "assistant", label: "AI & assistant" },
  { key: "tryon", label: "Try-on" },
] as const;

export type AnalyticsTab = (typeof ANALYTICS_TABS)[number]["key"];
