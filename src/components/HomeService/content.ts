import {
  BadgeCheck,
  Brush,
  CalendarCheck,
  Crown,
  Eye,
  Feather,
  Flower2,
  Hand,
  HeartHandshake,
  KeyRound,
  LifeBuoy,
  MapPin,
  Scissors,
  Smile,
  Sparkles,
  UserCheck,
  Wallet,
  Wind,
  type LucideIcon,
} from "lucide-react";

import { policyShortLine } from "@/lib/home-policy";
import { SITE } from "@/lib/site";
import type { HomeServiceSettings } from "@/services/settings/getPublicSettings";
import type { HomeAudience, HomeCategory, HomeExpertSort } from "@/services/home-service/types";

/** Static copy for the Home Service pages. Live numbers come from the API. */

export type HomeSide = { audience: HomeAudience; slug: "ladies" | "gents"; href: string; title: string };

export const SIDES: Record<HomeAudience, HomeSide> = {
  LADIES: { audience: "LADIES", slug: "ladies", href: "/home-service/ladies", title: "Ladies at Home" },
  GENTS: { audience: "GENTS", slug: "gents", href: "/home-service/gents", title: "Gents at Home" },
};

export const CATEGORY_LABEL: Record<HomeCategory, string> = {
  FACIAL: "Facial",
  THREADING: "Threading",
  WAXING: "Waxing",
  MAKEUP: "Makeup",
  MEHEDI: "Mehedi",
  HAIR: "Hair",
  MANICURE_PEDICURE: "Mani & pedi",
  BRIDAL: "Bridal",
  MASSAGE: "Massage",
  HAIRCUT: "Haircut",
  BEARD: "Beard",
  GROOMING: "Grooming",
  OTHER: "Other",
};

export const CATEGORY_ICON: Record<HomeCategory, LucideIcon> = {
  FACIAL: Smile,
  THREADING: Eye,
  WAXING: Feather,
  MAKEUP: Brush,
  MEHEDI: Flower2,
  HAIR: Wind,
  MANICURE_PEDICURE: Hand,
  BRIDAL: Crown,
  MASSAGE: HeartHandshake,
  HAIRCUT: Scissors,
  BEARD: Scissors,
  GROOMING: Sparkles,
  OTHER: Sparkles,
};

export const isHomeCategory = (v?: string): v is HomeCategory => !!v && v in CATEGORY_LABEL;

/** "Sharmin Hossain" → "SH", for an expert without a photo. */
export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

export const SORT_LABEL: Record<HomeExpertSort, string> = {
  rating: "Top rated",
  distance: "Nearest",
  soonest: "Soonest free",
};

export const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: MapPin, title: "Set your location", text: "See the experts whose salon reaches your home." },
  { icon: Sparkles, title: "Pick services and an expert", text: "Compare ratings, jobs done and prices." },
  { icon: CalendarCheck, title: "Choose a time", text: "Any open slot in the next 7 days." },
  { icon: Wallet, title: "Pay half now, half at home", text: "The advance holds your slot; pay the rest after." },
];

export const SAFETY: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: UserCheck, title: "Female experts only for ladies", text: "Every Ladies at Home booking goes to a woman. Always." },
  { icon: BadgeCheck, title: "ID-verified", text: "We check each expert's national ID and a selfie before they can take a booking." },
  { icon: KeyRound, title: "Start code", text: "The visit starts only when you give the expert your 4-digit code." },
  { icon: LifeBuoy, title: "Help button", text: "One tap during the visit reaches our support team straight away." },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: "Who comes to my home?",
    a: "An expert from a salon listed on " +
      SITE.name +
      ". Ladies at Home is always a female expert, and every expert's ID is verified by our team before their first booking.",
  },
  {
    q: "How does the payment work?",
    a: "You pay an advance online when you book (from your wallet, bKash or card) and the rest at home after the service. The advance is held by us and only reaches the salon once the visit is done.",
  },
  {
    q: "What if I need to cancel?",
    a: "The cancellation terms are shown before you pay and you agree to them on the review step. If the salon or we cancel, you always get the full advance back.",
  },
  {
    q: "Does the expert bring everything?",
    a: "Yes. Each service lists what the expert brings. You only need a chair, a little space and good light.",
  },
  {
    q: "What if something feels wrong during the visit?",
    a: "Use the Help button on your booking. It reaches our support team at once, and you can stop the visit at any time.",
  },
];

/** The policy line every Home Service page shows, from the public settings. */
export const policyLineOf = (s: HomeServiceSettings) =>
  policyShortLine({
    policy: s["homeService.customerCancelPolicy"],
    freeCancelHours: s["homeService.freeCancelHours"],
    maxRescheduleCount: s["homeService.maxRescheduleCount"],
  });

/** Is this side open on the platform at all? */
export const sideEnabled = (s: HomeServiceSettings, audience: HomeAudience) =>
  s["homeService.enabled"] &&
  (audience === "LADIES" ? s["homeService.ladiesEnabled"] : s["homeService.gentsEnabled"]);

export const trackSide = (audience: HomeAudience) => `audience:${SIDES[audience].slug}` as const;

export const durationText = (min: number) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

