import Image from "next/image";
import Link from "next/link";
import {
  ArrowUp,
  ChevronRight,
  Clock,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
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
type FooterColumn = { title: string; links: FooterLink[] };

// The ladies / gents parlour list pages.
const LADIES_HREF = "/ladies-parlour";
const GENTS_HREF = "/gents-parlour";

// Every link here goes to a page that exists. Privacy and Terms join once
// those pages are written.
const EXPLORE: FooterColumn = {
  title: "Explore",
  links: [
    { label: "Ladies parlours", href: LADIES_HREF },
    { label: "Gents parlours", href: GENTS_HREF },
    { label: "Salons near me", href: "/salons" },
    { label: "Top-rated salons", href: "/salons?sort=rating" },
    { label: "Home Service", href: "/home-service" },
    { label: "AI Match", href: "/ai-suggestions" },
  ],
};

const SERVICES: FooterColumn = {
  title: "Popular services",
  links: [
    { label: "Haircut", href: "/salons?category=HAIRCUT" },
    { label: "Facial", href: "/salons?category=FACIAL" },
    { label: "Bridal & party makeup", href: "/salons?category=MAKEUP" },
    { label: "Hair treatment", href: "/salons?category=TREATMENT" },
    { label: "Spa & massage", href: "/salons?category=MASSAGE" },
  ],
};

const BUSINESS: FooterColumn = {
  title: "For salons",
  links: [
    { label: "List your salon", href: "/become-salon-owner" },
    { label: "Owner sign in", href: "/login?redirect=/dashboard" },
  ],
};

const COMPANY: FooterColumn = {
  title: "Company",
  links: [
    { label: "About us", href: "/about" },
    { label: "Contact us", href: "/contact" },
  ],
};

const ALL_COLUMNS = [EXPLORE, SERVICES, BUSINESS, COMPANY];

// Phones get these two as big tap targets above the folded columns.
const QUICK_LINKS: (FooterLink & { hint: string })[] = [
  { label: "Ladies parlour", hint: "Hair, makeup, facial", href: LADIES_HREF },
  {
    label: "Gents parlour",
    hint: "Haircut, beard, grooming",
    href: GENTS_HREF,
  },
];

// Gateways the site actually takes payments through (wallet top-ups and
// Home Service advances). Heights differ so the two marks look the same
// size: bKash is nearly square, SSLCommerz is a long bar.
const PAYMENT_LOGOS = [
  {
    src: "/payments/bkash.png",
    alt: "bKash",
    width: 350,
    height: 160,
    className: "h-7",
  },
  {
    src: "/payments/sslcommerz.png",
    alt: "SSLCommerz",
    width: 448,
    height: 86,
    className: "h-[18px]",
  },
] as const;

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
};

const FOCUS_RING =
  "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-soft";

const LINK_CLASS = `inline-block py-1 text-sm text-foreground/70 transition-colors hover:text-primary-hover pointer-coarse:py-2.5 ${FOCUS_RING}`;

const HEADING_CLASS =
  "text-overline font-semibold uppercase tracking-[0.12em] text-primary-hover";

function LinkList({ links }: { links: FooterLink[] }) {
  return (
    <ul className="space-y-0.5">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className={LINK_CLASS}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function LinkColumn({ column }: { column: FooterColumn }) {
  return (
    <nav aria-label={column.title}>
      <h2 className={HEADING_CLASS}>{column.title}</h2>
      <div className="mt-3">
        <LinkList links={column.links} />
      </div>
    </nav>
  );
}

/** Email, phone, address and hours — each only when `SITE` has it. */
function ContactList() {
  const phoneHref = SITE.phone
    ? `tel:${SITE.phone.replace(/[^\d+]/g, "")}`
    : "";
  const items: {
    icon: LucideIcon;
    label: string;
    value: string;
    href?: string;
  }[] = [];

  if (SITE.email)
    items.push({
      icon: Mail,
      label: "Email",
      value: SITE.email,
      href: `mailto:${SITE.email}`,
    });
  if (SITE.phone)
    items.push({
      icon: Phone,
      label: "Phone",
      value: SITE.phone,
      href: phoneHref,
    });
  if (SITE.address) {
    items.push({
      icon: MapPin,
      label: "Address",
      value: [SITE.address.line1, SITE.address.line2]
        .filter(Boolean)
        .join(", "),
    });
  }
  if (SITE.hours)
    items.push({ icon: Clock, label: "Support hours", value: SITE.hours });

  if (items.length === 0) return null;

  return (
    <ul className="space-y-3">
      {items.map(({ icon: Icon, label, value, href }) => {
        const body = (
          <>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors group-hover:bg-primary-hover">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 pt-1.5 text-sm leading-5 text-foreground/80 transition-colors group-hover:text-primary-hover">
              <span className="sr-only">{label}: </span>
              {value}
            </span>
          </>
        );
        return (
          <li key={label}>
            {href ? (
              <a
                href={href}
                className={`group flex items-start gap-3 ${FOCUS_RING}`}
              >
                {body}
              </a>
            ) : (
              <div className="flex items-start gap-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Socials() {
  if (SITE.socials.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {SITE.socials.map((social) => {
        const Icon = SOCIAL_ICONS[social.label.toLowerCase()] ?? Globe;
        return (
          <li key={social.href}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="grid size-10 place-items-center rounded-full bg-surface text-muted-foreground ring-1 ring-border transition-colors hover:bg-primary hover:text-primary-foreground hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Icon className="size-[18px]" aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-border bg-primary-soft text-foreground">
      {/* A thin gold rule along the top edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row: the brand promise. */}
        <div className="border-b border-border py-7">
          <p className={HEADING_CLASS}>{SITE.tagline}</p>
          <p className="mt-2 font-display text-xl font-semibold tracking-tight text-balance text-foreground sm:text-2xl">
            Look your best, booked in seconds.
          </p>
        </div>

        {/* Main grid. */}
        <div className="grid gap-8 py-9 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4 lg:pr-6">
            <Link
              href="/"
              aria-label={`${SITE.name} home`}
              className={`inline-block ${FOCUS_RING}`}
            >
              <BrandLogo className="text-2xl" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {SITE.description}
            </p>
            {SITE.socials.length > 0 && (
              <div className="mt-5">
                <Socials />
              </div>
            )}
          </div>

          {/* md and up: link columns, with the two short ones stacked. */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-8 lg:col-span-8">
            <LinkColumn column={EXPLORE} />
            <LinkColumn column={SERVICES} />
            <div className="space-y-6">
              <LinkColumn column={BUSINESS} />
              <LinkColumn column={COMPANY} />
            </div>
            <div>
              <h2 className={HEADING_CLASS}>Get in touch</h2>
              <div className="mt-3">
                <ContactList />
              </div>
            </div>
          </div>

          {/* Phones: ladies / gents up front, the columns folded, then contact. */}
          <div className="md:hidden">
            <nav
              aria-label="Browse parlours"
              className="grid grid-cols-2 gap-3"
            >
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex min-h-16 items-center justify-between gap-2 rounded-2xl bg-surface p-4 ring-1 ring-border transition-colors hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
                    className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </nav>

            <Accordion type="multiple" className="mt-6 border-t border-border">
              {ALL_COLUMNS.map((column) => (
                <AccordionItem
                  key={column.title}
                  value={column.title}
                  className="border-border"
                >
                  <AccordionTrigger className="min-h-12 items-center text-sm font-semibold text-foreground hover:no-underline">
                    {column.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <LinkList links={column.links} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-6">
              <h2 className={HEADING_CLASS}>Get in touch</h2>
              <div className="mt-3">
                <ContactList />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar: copyright on the left; payment gateways and back to top on the right. */}
        <div className="flex flex-col gap-4 border-t border-border py-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {year} {SITE.name}. All rights reserved.
            <span className="hidden sm:inline"> · Made in Bangladesh</span>
          </p>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 md:justify-end">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                <ShieldCheck
                  className="size-3.5 text-success"
                  aria-hidden="true"
                />
                Secure payments
              </span>
              <ul
                className="flex items-center gap-3"
                aria-label="Payment methods"
              >
                {PAYMENT_LOGOS.map((logo, i) => (
                  <li key={logo.alt} className="flex items-center gap-3">
                    {i > 0 && (
                      <span aria-hidden className="h-4 w-px bg-border" />
                    )}
                    <Image
                      src={logo.src}
                      alt={logo.alt}
                      width={logo.width}
                      height={logo.height}
                      sizes="120px"
                      className={`${logo.className} w-auto`}
                    />
                  </li>
                ))}
              </ul>
            </div>
            {/* <a
              href="#main"
              className={`inline-flex items-center gap-1.5 font-medium text-foreground/70 transition-colors hover:text-primary-hover ${FOCUS_RING}`}
            >
              Back to top
              <ArrowUp className="size-4" aria-hidden="true" />
            </a> */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
