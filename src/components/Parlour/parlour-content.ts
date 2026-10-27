import {
  Baby,
  Brush,
  CalendarCheck,
  Crown,
  Feather,
  Flame,
  Flower2,
  Gem,
  Hand,
  HeartHandshake,
  Palette,
  Scissors,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Tag,
  Wallet,
  Wind,
  type LucideIcon,
} from "lucide-react";

export type ParlourAudience = "LADIES" | "GENTS";

type Tile = {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Where it goes: the salon list, filtered to this audience. */
  href: string;
};

type Faq = { q: string; a: string };

/**
 * Every Tailwind class a page uses for its look, written out in full so the
 * compiler sees them. The rest of the page is shared.
 */
type Theme = {
  heroBg: string;
  eyebrow: string;
  accentText: string;
  primaryButton: string;
  outlineButton: string;
  nearIcon: string;
  chip: string;
  tileIcon: string;
  tileHover: string;
  band: string;
  bandCard: string;
  bandIcon: string;
  stepNumber: string;
  ctaBg: string;
  mosaicFallback: string;
};

export type ParlourContent = {
  audience: ParlourAudience;
  /** "Ladies parlour" */
  singular: string;
  /** "ladies parlours" */
  plural: string;
  path: string;
  meta: { title: string; description: string };
  hero: {
    eyebrow: string;
    titleStart: string;
    titleAccent: string;
    subtitle: string;
    searchPlaceholder: string;
    chips: { label: string; href: string }[];
    trust: string[];
  };
  services: { title: string; description: string; tiles: Tile[] };
  occasions: {
    overline: string;
    title: string;
    description: string;
    tiles: Tile[];
  };
  features: { title: string; description: string; icon: LucideIcon }[];
  steps: { title: string; description: string }[];
  faqs: Faq[];
  cta: { title: string; description: string };
  theme: Theme;
};

const list = (audience: ParlourAudience, query: string) =>
  `/salons?audience=${audience}${query ? `&${query}` : ""}`;

// The same honest promises on both pages. Each is true today: an admin
// approves every salon, menus carry prices, slots are live, reviews come
// after a visit, and a booking holds only a deposit.
const FEATURES = (place: string): ParlourContent["features"] => [
  {
    title: `Approved ${place}s`,
    description: "Our team checks every salon before it can take a booking.",
    icon: ShieldCheck,
  },
  {
    title: "Prices up front",
    description: "See every service and its price before you choose.",
    icon: Tag,
  },
  {
    title: "Book a real time slot",
    description: "Pick an open time and walk in when it's yours. No queue.",
    icon: CalendarCheck,
  },
  {
    title: "Reviews after a visit",
    description: "Ratings come from customers once their visit is done.",
    icon: Star,
  },
  {
    title: "Small deposit only",
    description: "A deposit holds your slot and counts toward your bill.",
    icon: Wallet,
  },
];

const SHARED_FAQS = (place: string): Faq[] => [
  {
    q: "Do I pay for the whole service online?",
    a: `No. A small deposit from your wallet holds your slot, and it counts toward your bill. You pay the rest at the ${place}. Some ${place}s also let you pay the full bill in the app.`,
  },
  {
    q: "Can I cancel a booking?",
    a: `Yes. Each ${place} sets its own free-cancellation window, and you see it before you book. Cancel inside it and your deposit goes back to your wallet.`,
  },
  {
    q: "How are the ratings worked out?",
    a: "Only customers who have visited can leave a review. The stars you see are the average of those reviews, with the number of reviews next to them.",
  },
];

export const LADIES: ParlourContent = {
  audience: "LADIES",
  singular: "Ladies parlour",
  plural: "ladies parlours",
  path: "/ladies-parlour",
  meta: {
    title: "Ladies parlours near you",
    description:
      "Book trusted ladies parlours for haircuts, facials, keratin, threading and bridal makeup. See prices, real reviews and open times.",
  },
  hero: {
    eyebrow: "For her",
    titleStart: "Beauty, booked",
    titleAccent: "your way",
    subtitle:
      "Find a ladies parlour you'll love for hair, skin, nails and bridal looks. See prices and reviews, then book an open time in a minute.",
    searchPlaceholder: "Facial, keratin, bridal makeup…",
    chips: [
      { label: "Threading", href: list("LADIES", "searchTerm=threading") },
      { label: "Hair spa", href: list("LADIES", "searchTerm=hair%20spa") },
      { label: "Gold facial", href: list("LADIES", "searchTerm=gold%20facial") },
      { label: "Bridal makeup", href: list("LADIES", "searchTerm=bridal") },
      { label: "Keratin", href: list("LADIES", "searchTerm=keratin") },
    ],
    trust: ["Ladies-only parlours", "Prices up front", "Pay a small deposit"],
  },
  services: {
    title: "Everything for hair, skin and nails",
    description: "Pick a service to see the ladies parlours that offer it.",
    tiles: [
      {
        title: "Haircut & blow-dry",
        description: "Layers, steps, trims and a smooth finish.",
        icon: Scissors,
        href: list("LADIES", "category=HAIRCUT"),
      },
      {
        title: "Hair treatment",
        description: "Keratin, rebonding and deep-conditioning hair spa.",
        icon: Sparkles,
        href: list("LADIES", "category=TREATMENT"),
      },
      {
        title: "Colour & highlights",
        description: "Global colour, balayage and root touch-ups.",
        icon: Palette,
        href: list("LADIES", "category=COLORING"),
      },
      {
        title: "Facial & skincare",
        description: "Gold, fruit and hydra facials for a fresh glow.",
        icon: Smile,
        href: list("LADIES", "category=FACIAL"),
      },
      {
        title: "Makeup",
        description: "Party, engagement and bridal looks.",
        icon: Brush,
        href: list("LADIES", "category=MAKEUP"),
      },
      {
        title: "Manicure & pedicure",
        description: "Soak, shape, polish and a relaxing massage.",
        icon: Hand,
        href: list("LADIES", "category=MANICURE"),
      },
      {
        title: "Threading & waxing",
        description: "Clean brows and smooth, gentle waxing.",
        icon: Feather,
        href: list("LADIES", "category=WAXING"),
      },
      {
        title: "Styling",
        description: "Curls, waves and updos for the big day.",
        icon: Wind,
        href: list("LADIES", "category=STYLING"),
      },
    ],
  },
  occasions: {
    overline: "Bride & occasions",
    title: "Look your best on every big day",
    description:
      "From holud to reception, find the parlour for your look. Book early: wedding season fills up fast.",
    tiles: [
      {
        title: "Bridal makeup",
        description: "Your full bridal look, with hair and draping.",
        icon: Crown,
        href: list("LADIES", "searchTerm=bridal"),
      },
      {
        title: "Holud & mehedi",
        description: "Hand-drawn mehedi, from simple to bridal.",
        icon: Flower2,
        href: list("LADIES", "searchTerm=mehedi"),
      },
      {
        title: "Party makeup",
        description: "Makeup and hairdo for weddings and parties.",
        icon: Gem,
        href: list("LADIES", "searchTerm=party"),
      },
      {
        title: "Pre-event glow",
        description: "A facial a few days before, for skin that shines.",
        icon: Sparkles,
        href: list("LADIES", "category=FACIAL"),
      },
    ],
  },
  features: FEATURES("parlour"),
  steps: [
    {
      title: "Choose your parlour",
      description: "Compare services, prices and reviews from ladies parlours near you.",
    },
    {
      title: "Pick a time",
      description: "Choose an open slot and hold it with a small deposit.",
    },
    {
      title: "Walk in and relax",
      description: "Your slot is waiting. Pay the rest at the parlour.",
    },
  ],
  faqs: [
    {
      q: "What's the difference between a ladies parlour and a unisex salon?",
      a: "A ladies parlour serves women only, and this page shows only those. A unisex salon serves everyone. The full salon list also includes unisex salons, which you can browse from \"See all\".",
    },
    {
      q: "How do I book bridal makeup?",
      a: "Search for bridal makeup, compare parlours by price and reviews, then book an open time. For a trial or anything special, contact the parlour from its page before the day.",
    },
    ...SHARED_FAQS("parlour"),
  ],
  cta: {
    title: "Run a ladies parlour?",
    description:
      "List it for free, show your menu and prices, and take bookings online from customers nearby.",
  },
  theme: {
    heroBg: "bg-gradient-to-b from-rose-50 via-rose-50/40 to-background",
    eyebrow: "border-rose-200 bg-white text-rose-700",
    accentText: "text-rose-600",
    primaryButton:
      "bg-rose-600 text-white shadow-[0_8px_24px_-8px_rgb(225_29_72/0.55)] hover:bg-rose-700",
    outlineButton: "border-rose-200 bg-white hover:bg-rose-50 hover:text-rose-700",
    nearIcon: "text-rose-600",
    chip: "border-rose-200 bg-white text-rose-800 hover:border-rose-300 hover:bg-rose-50",
    tileIcon: "bg-rose-100 text-rose-700",
    tileHover: "hover:border-rose-300 focus-visible:ring-rose-300",
    band: "bg-gradient-to-br from-rose-900 via-rose-800 to-[oklch(0.42_0.12_20)] text-white",
    bandCard:
      "border-white/15 bg-white/10 hover:bg-white/15 focus-visible:ring-white/60",
    bandIcon: "bg-white/15 text-rose-100",
    stepNumber: "bg-rose-600 text-white",
    ctaBg: "bg-rose-50 border-rose-100",
    mosaicFallback: "from-rose-200 via-rose-100 to-amber-50",
  },
};

export const GENTS: ParlourContent = {
  audience: "GENTS",
  singular: "Gents parlour",
  plural: "gents parlours",
  path: "/gents-parlour",
  meta: {
    title: "Gents parlours & barbers near you",
    description:
      "Book trusted gents parlours and barbers for haircuts, beard trims, shaves and facials. See prices, real reviews and open times.",
  },
  hero: {
    eyebrow: "For him",
    titleStart: "Sharp looks,",
    titleAccent: "no waiting",
    subtitle:
      "Find a gents parlour or barber for a fresh cut, beard trim or a hot towel shave. Book an open time and skip the queue.",
    searchPlaceholder: "Haircut, beard trim, shave…",
    chips: [
      { label: "Beard trim", href: list("GENTS", "searchTerm=beard") },
      { label: "Hot towel shave", href: list("GENTS", "searchTerm=shave") },
      { label: "Haircut & beard combo", href: list("GENTS", "searchTerm=combo") },
      { label: "Hair spa", href: list("GENTS", "searchTerm=hair%20spa") },
    ],
    trust: ["Gents-only parlours", "Prices up front", "Pay a small deposit"],
  },
  services: {
    title: "Cuts, beards and grooming",
    description: "Pick a service to see the gents parlours that offer it.",
    tiles: [
      {
        title: "Haircut",
        description: "Classic cuts, fades and a neat finish.",
        icon: Scissors,
        href: list("GENTS", "category=HAIRCUT"),
      },
      {
        title: "Beard trim & shape",
        description: "Trim, line-up and a hot towel finish.",
        icon: Feather,
        href: list("GENTS", "searchTerm=beard"),
      },
      {
        title: "Hot towel shave",
        description: "A classic straight-razor shave.",
        icon: Flame,
        href: list("GENTS", "searchTerm=shave"),
      },
      {
        title: "Hair & beard colour",
        description: "Cover greys or change your shade.",
        icon: Palette,
        href: list("GENTS", "category=COLORING"),
      },
      {
        title: "Facial & cleanup",
        description: "Deep cleanse and charcoal facials.",
        icon: Smile,
        href: list("GENTS", "category=FACIAL"),
      },
      {
        title: "Hair treatment",
        description: "Hair spa, anti-dandruff and keratin.",
        icon: Sparkles,
        href: list("GENTS", "category=TREATMENT"),
      },
      {
        title: "Head massage",
        description: "Oil massage for the head, neck and shoulders.",
        icon: HeartHandshake,
        href: list("GENTS", "category=MASSAGE"),
      },
      {
        title: "Kids haircut",
        description: "Quick, neat cuts with patient barbers.",
        icon: Baby,
        href: list("GENTS", "searchTerm=kids"),
      },
    ],
  },
  occasions: {
    overline: "Groom & occasions",
    title: "Ready for the big day",
    description:
      "A fresh cut, a clean shave and a glow the week of the wedding. Book early in wedding season.",
    tiles: [
      {
        title: "Haircut & beard combo",
        description: "A full cut plus beard shape, at a combo price.",
        icon: Scissors,
        href: list("GENTS", "searchTerm=combo"),
      },
      {
        title: "Hot towel shave",
        description: "The smoothest finish for photos.",
        icon: Flame,
        href: list("GENTS", "searchTerm=shave"),
      },
      {
        title: "Facial",
        description: "Clear, fresh skin a few days before.",
        icon: Gem,
        href: list("GENTS", "category=FACIAL"),
      },
      {
        title: "Hair colour",
        description: "Even colour that looks natural.",
        icon: Palette,
        href: list("GENTS", "category=COLORING"),
      },
    ],
  },
  features: FEATURES("parlour"),
  steps: [
    {
      title: "Choose your barber",
      description: "Compare services, prices and reviews from gents parlours near you.",
    },
    {
      title: "Pick a time",
      description: "Choose an open slot and hold it with a small deposit.",
    },
    {
      title: "Walk in, skip the queue",
      description: "Your chair is waiting. Pay the rest at the parlour.",
    },
  ],
  faqs: [
    {
      q: "What's the difference between a gents parlour and a unisex salon?",
      a: "A gents parlour serves men only, and this page shows only those. A unisex salon serves everyone. The full salon list also includes unisex salons, which you can browse from \"See all\".",
    },
    ...SHARED_FAQS("parlour"),
  ],
  cta: {
    title: "Run a gents parlour or barber shop?",
    description:
      "List it for free, show your menu and prices, and take bookings online from customers nearby.",
  },
  theme: {
    heroBg: "bg-gradient-to-b from-stone-100 via-stone-50 to-background",
    eyebrow: "border-stone-300 bg-white text-stone-700",
    accentText: "text-primary",
    primaryButton:
      "bg-charcoal text-white shadow-[0_8px_24px_-8px_rgb(0_0_0/0.45)] hover:bg-charcoal-800",
    outlineButton: "border-stone-300 bg-white hover:bg-stone-50",
    nearIcon: "text-primary",
    chip: "border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50",
    tileIcon: "bg-stone-100 text-stone-800",
    tileHover: "hover:border-stone-400 focus-visible:ring-stone-300",
    band: "bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-700 text-white",
    bandCard:
      "border-white/10 bg-white/5 hover:bg-white/10 focus-visible:ring-white/60",
    bandIcon: "bg-primary/25 text-gold-light",
    stepNumber: "bg-charcoal text-white",
    ctaBg: "bg-stone-100 border-stone-200",
    mosaicFallback: "from-stone-300 via-stone-200 to-amber-50",
  },
};
