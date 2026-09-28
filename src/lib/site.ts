// The business's own details, in one place. Every public page reads these;
// an empty value ("" / null / []) means the component leaves that item out,
// so never fill one with a placeholder.

export type SiteSocial = { label: string; href: string };

export type SiteAddress = {
  line1: string;
  line2: string;
  /** [lat, lng]. Without it the contact page shows no map. */
  position?: [number, number];
};

export const SITE = {
  name: "SalonKhuji",
  tagline: "Book trusted salons near you",
  description:
    "Find salons near you in Bangladesh, compare prices and open slots, and book in seconds. Pay from your SalonKhuji wallet.",
  // `||`, not `??`: an empty env var would otherwise reach `new URL("")`.
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: "salonkuji@gmail.com" as string,
  phone: "01759030544" as string,
  address: {
    line1: "House 08, Road 16, Pallabi",
    line2: "Mirpur 12, Dhaka",
  } as SiteAddress | null,
  hours: "Sat–Thu, 10:00–20:00" as string,
  // Add each profile as { label: "Facebook", href: "https://facebook.com/…" }.
  socials: [] as SiteSocial[],
} as const;
