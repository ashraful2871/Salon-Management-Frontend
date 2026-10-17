/** `GET /owner/home` (backend `modules/Owner/owner.home.ts`). Money is poisha. */
export type SetupItem =
  | "services"
  | "staff"
  | "hours"
  | "slots14d"
  | "exactPin"
  | "photos3"
  | "payoutAccount"
  | "kyc";

export type WeekTotals = {
  revenueMinor: number;
  bookings: number;
  newCustomers: number;
  /** Percent of finished bookings (completed + no-show) that were no-shows. */
  noShowRate: number;
  rating: number | null;
};

export type OwnerHomeData = {
  scope: { salonId: string | null; salonCount: number; today: string };
  attention: {
    pendingConfirm: number;
    checkedInOver2h: number;
    unrecordedPayment: number;
    unrepliedReviews: number;
    appealsOpen: number;
    duesMinor?: number;
    payoutFailed?: number;
    accountUnverified?: boolean;
    approximatePins: number;
    noSlotsNext7Days: string[];
    noSlotsNext7DaysCount: number;
  };
  today: {
    bookings: number;
    checkedIn: number;
    completed: number;
    noShows: number;
    takingsMinor: number;
    next: Array<{
      id: string;
      token: string | null;
      time: string;
      customerName: string;
      serviceName: string;
      staffName: string | null;
    }>;
  };
  setup: {
    percent: number;
    items: SetupItem[];
    salons: Array<{ salonId: string; salonName: string; percent: number; done: Record<SetupItem, boolean> }>;
    incompleteCount: number;
  };
  week: {
    days: string[];
    current: WeekTotals;
    previous: WeekTotals;
    series: {
      revenue: number[];
      bookings: number[];
      newCustomers: number[];
      noShowRate: number[];
      rating: Array<number | null>;
    };
  };
  branches: Array<{
    salonId: string;
    salonName: string;
    bookings: number;
    noShows: number;
    takingsMinor: number;
    rating: number;
    totalReviews: number;
    openSlotsToday: number;
  }> | null;
  branchesTotal: number;
};
