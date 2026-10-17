/** One bell row (`GET /owner/notifications`). */
export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  salonId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPage = {
  items: AppNotification[];
  unread: number;
  nextCursor: string | null;
};

export type BookingEmailMode = "EVERY" | "DIGEST" | "NONE";

/** One row of Settings → Notifications; event names come from the API only. */
export type NotificationPrefRow = {
  event: string;
  label: string;
  group: "Bookings" | "Reviews" | "Money" | "Business";
  email: boolean;
  inApp: boolean;
  /** Security/money notices: the email cannot be switched off. */
  emailLocked: boolean;
  /** An owner's new-booking emails follow `bookingEmailMode` instead. */
  emailByMode: boolean;
};

export type NotificationPrefs = {
  events: NotificationPrefRow[];
  /** Null for managers and staff (owners only). */
  bookingEmailMode: BookingEmailMode | null;
};
