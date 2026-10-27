import Link from "next/link";
import {
  ChevronRight,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SITE } from "@/lib/site";
import { BrandLogo } from "@/components/Shared/BrandLogo";

type FooterLink = { label: string; href: string };

// The ladies / gents parlour landing pages.
const LADIES_HREF = "/ladies-parlour";
const GENTS_HREF = "/gents-parlour";

// Every link here goes to a page that exists. Privacy and Terms join once
// those pages are written.
const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Find a salon",
    links: [
      { label: "Ladies parlours", href: LADIES_HREF },
      { label: "Gents parlours", href: GENTS_HREF },
      { label: "Salons near me", href: "/salons" },
      { label: "Top-rated salons", href: "/salons?sort=rating" },
      { label: "AI Match", href: "/ai-suggestions" },
    ],
  },
  {
    title: "Popular services",
    links: [
      { label: "Haircut", href: "/salons?category=HAIRCUT" },
      { label: "Facial", href: "/salons?category=FACIAL" },
      { label: "Bridal & party makeup", href: "/salons?category=MAKEUP" },
      { label: "Hair treatment", href: "/salons?category=TREATMENT" },
      { label: "Spa & massage", href: "/salons?category=MASSAGE" },
    ],
  },
  {
    title: "For salons",
    links: [
      { label: "List your salon", href: "/become-salon-owner" },
      { label: "Salon owner sign in", href: "/login?redirect=/dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

// Phones get these two as big tap targets above the folded columns.
const QUICK_LINKS: (FooterLink & { hint: string })[] = [
  { label: "Ladies parlour", hint: "Hair, makeup, facial", href: LADIES_HREF },
  { label: "Gents parlour", hint: "Haircut, beard, grooming", href: GENTS_HREF },
];

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
};

const LINK_CLASS =
  "block py-1.5 text-sm text-foreground/80 transition-colors hover:text-foreground pointer-coarse:py-2.5";

const OVERLINE_CLASS =
  "text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface-subtle">
      <div className="container mx-auto px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link
              href="/"
              aria-label={`${SITE.name} home`}
              className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <BrandLogo className="text-2xl" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {SITE.description}
            </p>
            {SITE.email && (
              <a
                href={`mailto:${SITE.email}`}
                className="mt-4 inline-flex items-center gap-2 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground pointer-coarse:py-2.5"
              >
                <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
                {SITE.email}
              </a>
            )}
            {SITE.socials.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {SITE.socials.map((social) => {
                  const Icon = SOCIAL_ICONS[social.label.toLowerCase()] ?? Globe;
                  return (
                    <li key={social.href}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="grid size-11 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <Icon className="size-5" aria-hidden="true" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* md and up: four plain columns (under the brand on tablets). */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-8 lg:col-span-8">
            {COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className={OVERLINE_CLASS}>{column.title}</h2>
                <ul className="mt-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={LINK_CLASS}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* Phones: ladies / gents up front, then the columns folded. */}
          <div className="md:hidden">
            <nav aria-label="Browse parlours" className="grid grid-cols-2 gap-3">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex min-h-16 items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {link.label}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {link.hint}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </nav>

            <Accordion type="multiple" className="mt-6 border-t border-border">
              {COLUMNS.map((column) => (
                <AccordionItem key={column.title} value={column.title}>
                  <AccordionTrigger className="min-h-12 items-center text-sm font-semibold">
                    {column.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul>
                      {column.links.map((link) => (
                        <li key={link.href}>
                          <Link href={link.href} className={LINK_CLASS}>
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-1 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} {SITE.name}</p>
          <p>{SITE.tagline}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
