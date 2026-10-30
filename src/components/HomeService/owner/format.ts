import type { Tone } from "@/lib/status-tone";
import type {
  AdvanceStatus,
  ExpertVerification,
  HomeAudience,
  HomeChecklistItem,
  HomeCategory,
  OwnerHomeProfile,
} from "@/services/home-service/types";
import { dayOf } from "../booking/format";

export const HOME_BASE = "/dashboard/home-service";

export type OwnerHomeTab = "setup" | "settings" | "menu" | "experts" | "bookings" | "policy";

/** The tabs a branch can open before Home Service was ever turned on: the checklist links to these. */
export const BEFORE_TURN_ON: readonly OwnerHomeTab[] = ["setup", "menu", "experts"];

export const SIDE_LABEL: Record<HomeAudience, string> = { LADIES: "Ladies", GENTS: "Gents" };

export const ADVANCE_TEXT: Record<AdvanceStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Not paid", tone: "neutral" },
  HELD: { label: "Held", tone: "info" },
  APPLIED: { label: "Settled", tone: "success" },
  RELEASED: { label: "Refunded", tone: "neutral" },
  PARTIALLY_FORFEITED: { label: "Part kept", tone: "warning" },
  FORFEITED: { label: "Kept", tone: "warning" },
};

export const VERIFICATION_LABEL: Record<ExpertVerification, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

/** The menu's categories, the side's own first. */
export const CATEGORIES_FOR: Record<HomeAudience, HomeCategory[]> = {
  LADIES: ["FACIAL", "THREADING", "WAXING", "MAKEUP", "MEHEDI", "HAIR", "MANICURE_PEDICURE", "BRIDAL", "MASSAGE", "OTHER"],
  GENTS: ["HAIRCUT", "BEARD", "GROOMING", "FACIAL", "HAIR", "MASSAGE", "OTHER"],
};

export type Sides = { ladies: boolean; gents: boolean };

export const sideIsOpen = (home: OwnerHomeProfile, side: HomeAudience) =>
  side === "LADIES" ? home.platform.ladiesEnabled : home.platform.gentsEnabled;

/** What the branch chose; before any choice, every side it may offer. */
export const startingSides = (home: OwnerHomeProfile): Sides => {
  const { ladiesEnabled: ladies, gentsEnabled: gents } = home.profile;
  if (ladies || gents) return { ladies, gents };
  const open = home.allowedSides.filter((s) => sideIsOpen(home, s));
  return { ladies: open.includes("LADIES"), gents: open.includes("GENTS") };
};

/** The side's rows are only asked of a side the owner is turning on. */
export const checklistFor = (items: HomeChecklistItem[], sides: Sides) =>
  items.filter((i) => (i.key.startsWith("ladies") ? sides.ladies : i.key.startsWith("gents") ? sides.gents : true));

export const todayDhaka = () => dayOf(new Date().toISOString());

/** `date` + `days`, both YYYY-MM-DD. */
export const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
