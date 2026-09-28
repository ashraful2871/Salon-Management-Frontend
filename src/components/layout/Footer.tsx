import Image from "next/image";
import Link from "next/link";
import {
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

// Every link here goes to a page that exists. Privacy and Terms join once
// those pages are written.
const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Salons", href: "/salons" },
      { label: "AI Match", href: "/ai-suggestions" },
      { label: "Top-rated salons", href: "/salons?sort=rating" },
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
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <Link
              href="/"
              aria-label="SalonKhuji home"
              className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Image
                src="/salon-logo.png"
                alt="SalonKhuji"
                width={1534}
                height={326}
                sizes="160px"
                className="h-8 w-auto"
              />
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

          {/* md and up: three plain columns. */}
          <div className="hidden md:col-span-8 md:grid md:grid-cols-3 md:gap-8">
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

          {/* Phones: the same columns, folded. */}
          <Accordion type="multiple" className="border-t border-border md:hidden">
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

        <div className="mt-10 flex flex-col gap-1 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} SalonKhuji</p>
          <p>{SITE.tagline}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
