/** `GET /owner/daily-close` + history (owner Phase 14). Money in poisha. */
export type DailyCloseExpected = {
  /** Counter cash taken that Dhaka day: bills + tips. */
  cashMinor: number;
  cardMinor: number;
  mobileMinor: number;
  tipsMinor: number;
  payments: number;
};

export type DailyCloseRow = {
  id: string;
  salonId: string;
  salonName: string;
  date: string;
  expectedCashMinor: number;
  countedCashMinor: number;
  cardMinor: number;
  mobileMinor: number;
  /** counted - expected: negative = short. */
  differenceMinor: number;
  note: string | null;
  closedById: string;
  closedByName: string | null;
  createdAt: string;
};

export type DailyCloseDay = {
  salonId: string;
  date: string;
  expected: DailyCloseExpected;
  close: DailyCloseRow | null;
  canReopen: boolean;
};
