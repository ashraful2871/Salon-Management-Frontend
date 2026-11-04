import {
  CalendarCheck,
  Crown,
  Flower2,
  Gem,
  ShieldCheck,
  Sparkles,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type Treatment = {
  title: string;
  description: string;
  /** The salon list, filtered to ladies parlours (and unisex salons). */
  href: string;
};

type Item = Treatment & { icon: LucideIcon };

/** `/salons?audience=LADIES&…`: the list keeps the ladies filter on. */
export const ladiesList = (query = "") =>
  `/salons?audience=LADIES${query ? `&${query}` : ""}`;

export const SEE_ALL = ladiesList("sort=rating");

export const POPULAR = [
  { label: "Threading", href: ladiesList("searchTerm=threading") },
  { label: "Hair spa", href: ladiesList("searchTerm=hair%20spa") },
  { label: "Gold facial", href: ladiesList("searchTerm=gold%20facial") },
  { label: "Bridal makeup", href: ladiesList("searchTerm=bridal") },
  { label: "Keratin", href: ladiesList("searchTerm=keratin") },
];

// Each is true today: an admin approves every salon, menus carry prices,
// slots are live, and booking is free (booking.depositsEnabled is off). If
// deposits are switched back on, restore the "Small deposit only" copy here
// and in the FAQ below.
export const PROMISES: { title: string; text: string; icon: LucideIcon }[] = [
  {
    title: "Approved parlours",
    text: "Checked by our team before they take a booking.",
    icon: ShieldCheck,
  },
  {
    title: "Prices up front",
    text: "Every service and its price, before you choose.",
    icon: Tag,
  },
  {
    title: "Your own time slot",
    text: "Pick an open time and walk in. No queue.",
    icon: CalendarCheck,
  },
  {
    title: "Free to book",
    text: "No deposit, no card. Pay at the parlour after your service.",
    icon: Wallet,
  },
];

export const MENU: Treatment[] = [
  {
    title: "Haircut & blow-dry",
    description: "Layers, steps, trims and a smooth finish.",
    href: ladiesList("category=HAIRCUT"),
  },
  {
    title: "Hair spa & keratin",
    description: "Keratin, rebonding and deep-conditioning spa.",
    href: ladiesList("category=TREATMENT"),
  },
  {
    title: "Colour & highlights",
    description: "Global colour, balayage and root touch-ups.",
    href: ladiesList("category=COLORING"),
  },
  {
    title: "Facials & skincare",
    description: "Gold, fruit and hydra facials for a fresh glow.",
    href: ladiesList("category=FACIAL"),
  },
  {
    title: "Makeup",
    description: "Party, engagement and bridal looks.",
    href: ladiesList("category=MAKEUP"),
  },
  {
    title: "Manicure & pedicure",
    description: "Soak, shape, polish and a relaxing massage.",
    href: ladiesList("category=MANICURE"),
  },
  {
    title: "Threading & waxing",
    description: "Clean brows and smooth, gentle waxing.",
    href: ladiesList("category=WAXING"),
  },
  {
    title: "Styling",
    description: "Curls, waves and updos for the big day.",
    href: ladiesList("category=STYLING"),
  },
];

export const OCCASIONS: Item[] = [
  {
    title: "Bridal makeup",
    description: "Your full bridal look, with hair and draping.",
    icon: Crown,
    href: ladiesList("searchTerm=bridal"),
  },
  {
    title: "Holud & mehedi",
    description: "Hand-drawn mehedi, from simple to bridal.",
    icon: Flower2,
    href: ladiesList("searchTerm=mehedi"),
  },
  {
    title: "Party makeup",
    description: "Makeup and hairdo for weddings and parties.",
    icon: Gem,
    href: ladiesList("searchTerm=party"),
  },
  {
    title: "Pre-event glow",
    description: "A facial a few days before, for skin that shines.",
    icon: Sparkles,
    href: ladiesList("category=FACIAL"),
  },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: "What's the difference between a ladies parlour and a unisex salon?",
    a: "A ladies parlour serves women only, and the parlours on this page are all ladies-only. A unisex salon serves everyone. When you search or browse all, the list also includes unisex salons.",
  },
  {
    q: "How do I book bridal makeup?",
    a: "Search for bridal makeup, compare parlours by price and reviews, then book an open time. For a trial or anything special, contact the parlour from its page before the day.",
  },
  {
    q: "Do I pay for the whole service online?",
    a: "No. Booking is free - there is no deposit and nothing is paid in the app. You pay the whole bill at the parlour after your service.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes. Cancel from My bookings any time before your appointment, so the parlour can give the time to someone else. There is nothing to refund, because nothing was paid.",
  },
  {
    q: "How are the ratings worked out?",
    a: "Only customers who have visited can leave a review. The stars you see are the average of those reviews, with the number of reviews next to them.",
  },
];
