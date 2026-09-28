import Link from "next/link";
import {
  CalendarCheck,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Sparkles,
  Store,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { LeafletMap, PinMarker } from "@/components/Map/MapClient";
import { PublicPageHero } from "@/components/Shared/PublicPageHero";
import { Section } from "@/components/Shared/Section";
import { IconTile } from "@/components/Shared/FeatureCard";
import { directionsUrl } from "@/lib/geo";
import { SITE } from "@/lib/site";
import ContactForm from "./ContactForm";

const CARD = "rounded-2xl border border-border bg-surface p-5 sm:p-6";
const CARD_LINK =
  "transition-[box-shadow,border-color] duration-200 hover:border-primary/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

type Detail = {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  href?: string;
};

const QUICK_HELP = [
  {
    icon: CalendarCheck,
    label: "Manage a booking",
    href: "/dashboard/appointments",
  },
  { icon: Store, label: "List your salon", href: "/become-salon-owner" },
  { icon: Sparkles, label: "Try AI Match", href: "/ai-suggestions" },
];

// Only what SITE actually has: an empty value leaves its card out.
const details = (): Detail[] => {
  const list: Detail[] = [];
  if (SITE.email) {
    list.push({
      icon: Mail,
      label: "Email",
      value: SITE.email,
      href: `mailto:${SITE.email}`,
    });
  }
  if (SITE.phone) {
    list.push({
      icon: Phone,
      label: "Phone",
      value: SITE.phone,
      href: `tel:${SITE.phone}`,
    });
  }
  if (SITE.address) {
    list.push({
      icon: MapPin,
      label: "Address",
      value: (
        <>
          {SITE.address.line1}
          <br />
          {SITE.address.line2}
        </>
      ),
    });
  }
  if (SITE.hours) {
    list.push({ icon: Clock, label: "Hours", value: SITE.hours });
  }
  return list;
};

function DetailCard({ icon, label, value, href }: Detail) {
  const body = (
    <>
      <IconTile icon={icon} />
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground break-words">{value}</p>
      </div>
    </>
  );

  return (
    <li>
      {href ? (
        <a href={href} className={`${CARD} ${CARD_LINK} flex items-center gap-4`}>
          {body}
        </a>
      ) : (
        <div className={`${CARD} flex items-center gap-4`}>{body}</div>
      )}
    </li>
  );
}

export default function Contact() {
  const position = SITE.address?.position;

  return (
    <>
      <PublicPageHero
        overline="Contact"
        title="We're here to help"
        description="Questions about a booking, your wallet or listing your salon? Send us a message and we'll reply by email."
      />

      <Section
        labelledBy="contact-title"
        containerClassName="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-10"
      >
        <h2 id="contact-title" className="sr-only">
          Get in touch
        </h2>

        <div className="space-y-4">
          <ul className="space-y-4">
            {details().map((detail) => (
              <DetailCard key={detail.label} {...detail} />
            ))}
          </ul>

          <div className={CARD}>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Quick help
            </h3>
            <ul className="mt-3 -mx-2">
              {QUICK_HELP.map(({ icon: Icon, label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 text-base font-medium text-foreground transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <Icon aria-hidden="true" className="size-5 text-primary" />
                    <span className="flex-1">{label}</span>
                    <ChevronRight
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`${CARD} mt-8 sm:p-8 lg:mt-0`}>
          <ContactForm />
        </div>
      </Section>

      {/* Only on a real pin. Not draggable, so it never traps page scrolling on phones. */}
      {position && SITE.address && (
        <section aria-label="Map" className="relative h-80 bg-muted">
          <LeafletMap
            center={position}
            zoom={15}
            interactive={false}
            className="h-full rounded-none"
          >
            <PinMarker position={position} active title={SITE.address.line1} />
          </LeafletMap>
          <a
            href={directionsUrl(...position)}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Navigation className="h-4 w-4 text-gold" />
            Get directions
          </a>
        </section>
      )}
    </>
  );
}
