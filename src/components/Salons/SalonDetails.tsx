"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Award,
  CalendarCheck,
  ChevronRight,
  Clock,
  Globe,
  House,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Scissors,
  Share2,
  Star,
  Wallet,
} from "lucide-react";

import { Button } from "../ui/button";
import ReviewModal from "./ReviewModal";
import SalonLocationCard from "./SalonLocationCard";
import SalonGallery from "./SalonGallery";
import { ReportReviewButton } from "./ReportReviewButton";
import PersonAvatar from "./PersonAvatar";
import SalonHomeBand from "@/components/HomeService/SalonHomeBand";
import { useAssistantLauncher } from "@/components/Assistant/AssistantContext";
import { getMyAppointments } from "@/services/appoinments/getMyAppointments";
import { useSavedLocation } from "@/hooks/useSavedLocation";
import { categoryLabel } from "@/constants/service-categories";
import { directionsUrl, formatDistance, haversineMeters } from "@/lib/geo";
import { formatBDT } from "@/lib/money";
import { formatRating } from "@/lib/rating";
import { cn } from "@/lib/utils";
import {
  AUDIENCE_LABEL,
  addressLine,
  bookingHref,
  durationText,
  type DayKey,
  type SalonServiceView,
  type SalonView,
} from "./salon-view";
import {
  DAYS,
  DAY_LABEL,
  formatClock,
  formatYmd,
  openState,
} from "./salon-time";
import { useMounted } from "./useMounted";

type Viewer = { userId?: string; role?: string } | null;

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "team", label: "Team" },
  { id: "reviews", label: "Reviews" },
  { id: "location", label: "Location" },
] as const;

export default function SalonDetails({
  salon,
  viewer,
  takesDeposit,
}: {
  salon: SalonView;
  viewer?: Viewer;
  /** Booking holds a deposit (platform switch on and this salon asks for one). */
  takesDeposit: boolean;
}) {
  const mounted = useMounted();
  const status = mounted
    ? openState(salon.operatingHours, salon.closures)
    : null;
  const saved = useSavedLocation();
  const { openWith, enabled: chatEnabled } = useAssistantLauncher();

  const hasPin = salon.latitude != null && salon.longitude != null;
  const place = addressLine(salon);
  const distance =
    hasPin && saved
      ? formatDistance(
          haversineMeters(
            [saved.lat, saved.lng],
            [salon.latitude!, salon.longitude!],
          ),
          salon.locationAccuracy === "APPROXIMATE",
        )
      : "";
  const directionsHref = hasPin
    ? directionsUrl(salon.latitude!, salon.longitude!)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([salon.name, place].filter(Boolean).join(", "))}`;

  const canBookSalon = !salon.bookingPaused && salon.services.length > 0;
  const canBookHome = !salon.bookingPaused && Boolean(salon.homeService);
  const bookHref = canBookSalon
    ? bookingHref(salon.id)
    : canBookHome
      ? bookingHref(salon.id, { mode: "home" })
      : null;

  // A finished visit without a review: offer it once per session.
  const [reviewOpen, setReviewOpen] = useState(false);
  const [unreviewedId, setUnreviewedId] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    getMyAppointments(salon.id, "COMPLETED").then((res) => {
      if (!live || !res?.success || !Array.isArray(res.data)) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pending = res.data.find((a: any) => !a.review);
      if (!pending) return;
      setUnreviewedId(pending.id);
      let skipped = false;
      try {
        skipped = Boolean(
          sessionStorage.getItem(`skipped_review_${pending.id}`),
        );
      } catch {}
      if (!skipped) setReviewOpen(true);
    });
    return () => {
      live = false;
    };
  }, [salon.id]);
  const closeReview = () => {
    try {
      if (unreviewedId)
        sessionStorage.setItem(`skipped_review_${unreviewedId}`, "true");
    } catch {}
    setReviewOpen(false);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: salon.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      // Cancelled share sheet, or no clipboard permission: nothing to report.
    }
  };

  const sections = SECTIONS.filter(
    (s) => s.id !== "team" || salon.staff.length > 0,
  );

  return (
    <div className="bg-background pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-20">
      {/* HEADER + GALLERY */}
      <div className="container mx-auto px-4 pt-4 sm:px-6 lg:px-8 lg:pt-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-3 hidden text-sm text-muted-foreground md:block"
        >
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/salons" className="hover:text-foreground">
                Salons
              </Link>
            </li>
            {salon.area && (
              <>
                <ChevronRight className="size-3.5" aria-hidden />
                <li>{salon.area}</li>
              </>
            )}
            <ChevronRight className="size-3.5" aria-hidden />
            <li
              aria-current="page"
              className="truncate font-medium text-foreground"
            >
              {salon.name}
            </li>
          </ol>
        </nav>

        {/* Phones: photo first, then the name. Larger screens: name, then photos. */}
        <div className="flex flex-col">
          <div className="order-2 mt-5 md:order-1 md:mt-0">
            <Header
              salon={salon}
              status={status}
              distance={distance}
              place={place}
              directionsHref={directionsHref}
              onShare={share}
            />
          </div>
          <div className="order-1 md:order-2 md:mt-6">
            <SalonGallery images={salon.images} name={salon.name} />
          </div>
        </div>
      </div>

      {/* SECTION TABS */}
      <SectionNav sections={sections} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0 space-y-12">
            {/* Phones and tablets: how booking works, before the menu. */}
            <div className="lg:hidden">
              <BookingNotices salon={salon} />
              <HowBookingWorks takesDeposit={takesDeposit} className="mt-4" />
            </div>

            <section
              id="about"
              aria-labelledby="about-title"
              className="scroll-mt-36"
            >
              <SectionHeading id="about-title" title="About" />
              <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-5">
                  <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
                    {salon.description ||
                      `${AUDIENCE_LABEL[salon.audience]} salon${salon.area ? ` in ${salon.area}` : ""}.`}
                  </p>
                  {(salon.phone || salon.website || chatEnabled) && (
                    <div className="flex flex-wrap gap-2">
                      {salon.phone && (
                        <Button asChild variant="secondary" size="sm">
                          <a href={`tel:${salon.phone}`}>
                            <Phone aria-hidden />
                            <span className="tabular-nums">{salon.phone}</span>
                          </a>
                        </Button>
                      )}
                      {salon.website && /^https?:\/\//i.test(salon.website) && (
                        <Button asChild variant="secondary" size="sm">
                          <a href={salon.website} target="_blank" rel="noopener noreferrer nofollow">
                            <Globe aria-hidden /> Website
                          </a>
                        </Button>
                      )}
                      {chatEnabled && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openWith({ type: "choose_salon", salonId: salon.id }, salon.name)}
                        >
                          <MessageSquare aria-hidden /> Ask about this salon
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {/* Desktop shows the hours beside the address in the side column. */}
                <div className="lg:hidden">
                  <HoursCard salon={salon} today={status?.today ?? null} />
                </div>
              </div>
            </section>

            {salon.homeService && (
              <SalonHomeBand
                sides={salon.homeService}
                bookHref={
                  canBookHome
                    ? bookingHref(salon.id, { mode: "home" })
                    : undefined
                }
              />
            )}

            <section
              id="services"
              aria-labelledby="services-title"
              className="scroll-mt-36"
            >
              <SectionHeading
                id="services-title"
                title="Services"
                meta={`${salon.services.length} available`}
              />
              <ServicesMenu salon={salon} />
            </section>

            {salon.staff.length > 0 && (
              <section
                id="team"
                aria-labelledby="team-title"
                className="scroll-mt-36"
              >
                <SectionHeading
                  id="team-title"
                  title="Team"
                  meta={`${salon.staff.length} specialist${salon.staff.length === 1 ? "" : "s"}`}
                />
                <ul className="grid gap-3 sm:grid-cols-2">
                  {salon.staff.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
                    >
                      <PersonAvatar
                        name={m.name}
                        photo={m.photo}
                        className="size-14 text-base ring-4 ring-primary-soft/60"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">
                          {m.name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {m.speciality || "Specialist"}
                        </p>
                        {(m.totalReviews > 0 || m.experience) && (
                          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {m.totalReviews > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <Star
                                  className="size-3.5 fill-gold text-gold"
                                  aria-hidden
                                />
                                <span className="font-semibold text-foreground">
                                  {formatRating(m.rating)}
                                </span>
                                <span>({m.totalReviews})</span>
                              </span>
                            )}
                            {m.experience ? (
                              <span className="inline-flex items-center gap-1">
                                <Award className="size-3.5" aria-hidden />
                                {m.experience} yrs experience
                              </span>
                            ) : null}
                          </p>
                        )}
                      </div>
                      {canBookSalon && (
                        <Button
                          asChild
                          variant="secondary"
                          size="sm"
                          className="shrink-0"
                        >
                          <Link
                            href={bookingHref(salon.id, { staff: m.id })}
                            aria-label={`Book with ${m.name}`}
                          >
                            Book
                          </Link>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section
              id="reviews"
              aria-labelledby="reviews-title"
              className="scroll-mt-36"
            >
              <Reviews
                salon={salon}
                viewer={viewer}
                onWrite={unreviewedId ? () => setReviewOpen(true) : undefined}
              />
            </section>

            <section
              id="location"
              aria-labelledby="location-title"
              className="scroll-mt-36"
            >
              <SectionHeading id="location-title" title="Location" />
              <SalonLocationCard salon={salon} />
            </section>
          </div>

          {/* DESKTOP: the booking card follows the page. */}
          <aside className="hidden lg:block">
            {/* Follows the page only on screens tall enough to show all of it, so it never needs its own scrollbar. */}
            <div className="space-y-4 [@media(min-height:50rem)]:sticky [@media(min-height:50rem)]:top-[calc(4rem+var(--imp-offset,0px)+4.5rem)]">
              <div className="rounded-3xl border border-border bg-surface p-5 shadow-card">
                <p className="text-overline font-semibold tracking-[0.06em] text-primary uppercase">
                  Book online
                </p>
                <p className="mt-1 font-display text-section-lg font-semibold text-foreground">
                  {takesDeposit ? "Book with a small deposit" : "Free to book online"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {takesDeposit
                    ? "The rest is paid at the salon."
                    : "No payment now. Pay at the salon after your visit."}
                </p>

                <div className="mt-4">
                  <BookingNotices salon={salon} />
                </div>

                <div className="space-y-2">
                  {bookHref ? (
                    <Button asChild className="w-full">
                      <Link href={bookHref}>
                        <CalendarCheck aria-hidden /> Book an appointment
                      </Link>
                    </Button>
                  ) : (
                    <Button className="w-full" disabled>
                      {salon.bookingPaused ? "Online booking paused" : "No services to book yet"}
                    </Button>
                  )}
                  {canBookSalon && canBookHome && (
                    <Button asChild variant="secondary" className="w-full">
                      <Link href={bookingHref(salon.id, { mode: "home" })}>
                        <House aria-hidden /> Book a home visit
                      </Link>
                    </Button>
                  )}
                </div>

                <HowBookingWorks takesDeposit={takesDeposit} className="mt-5 border-t border-border pt-4" compact />
              </div>

              <div className="rounded-3xl border border-border bg-surface p-5 text-sm">
                <p className="font-semibold text-foreground">Location &amp; hours</p>
                <p className="mt-3 flex items-start gap-2.5 text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
                  <span>{place || "Address not listed"}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <a href={directionsHref} target="_blank" rel="noopener noreferrer">
                      <Navigation aria-hidden /> Directions
                    </a>
                  </Button>
                  {salon.phone && (
                    <Button asChild variant="secondary" size="sm">
                      <a href={`tel:${salon.phone}`}>
                        <Phone aria-hidden /> Call
                      </a>
                    </Button>
                  )}
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 font-semibold text-foreground">
                      <Clock className="size-4 text-primary" aria-hidden /> Opening hours
                    </p>
                    <StatusLine status={status} className="text-xs" />
                  </div>
                  <HoursRows salon={salon} today={status?.today ?? null} dense />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* PHONES: the way to book stays under the thumb. */}
      <div
        data-bottom-bar
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-lg lg:hidden"
      >
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {salon.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {takesDeposit
                ? "Small deposit · rest at the salon"
                : "Free to book · pay at the salon"}
            </p>
          </div>
          {bookHref ? (
            <Button asChild size="lg" className="shrink-0 px-7">
              <Link href={bookHref}>Book now</Link>
            </Button>
          ) : (
            <Button size="lg" className="shrink-0" disabled>
              {salon.bookingPaused ? "Paused" : "Unavailable"}
            </Button>
          )}
        </div>
      </div>

      {unreviewedId && (
        <ReviewModal
          open={reviewOpen}
          onClose={closeReview}
          appointmentId={unreviewedId}
          salonId={salon.id}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- pieces

function Header({
  salon,
  status,
  distance,
  place,
  directionsHref,
  onShare,
}: {
  salon: SalonView;
  status: ReturnType<typeof openState> | null;
  distance: string;
  place: string;
  directionsHref: string;
  onShare: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-hover">
            {AUDIENCE_LABEL[salon.audience]}
          </span>
          {salon.homeService && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold text-foreground">
              <House className="size-3.5" aria-hidden /> Home visits
            </span>
          )}
        </div>
        <h1 className="font-display text-title-lg break-words text-foreground md:text-4xl md:leading-tight">
          {salon.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          <a
            href="#reviews"
            className="flex items-center gap-1 font-semibold text-foreground hover:underline"
          >
            <Star className="size-4 fill-gold text-gold" aria-hidden />
            {salon.totalReviews > 0 ? formatRating(salon.rating) : "New"}
            {salon.totalReviews > 0 && (
              <span className="font-normal text-muted-foreground">
                ({salon.totalReviews} review
                {salon.totalReviews === 1 ? "" : "s"})
              </span>
            )}
          </a>
          <Dot />
          <StatusLine status={status} />
          {(salon.area || distance) && (
            <>
              <span className="hidden md:inline">
                <Dot />
              </span>
              <span className="flex basis-full items-center gap-1 text-muted-foreground md:basis-auto">
                <MapPin className="size-4" aria-hidden />
                {[salon.area, distance].filter(Boolean).join(" · ")}
              </span>
            </>
          )}
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground md:hidden">
          {place}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button asChild variant="secondary" size="sm">
          <a href={directionsHref} target="_blank" rel="noopener noreferrer">
            <Navigation aria-hidden /> Directions
          </a>
        </Button>
        <Button variant="secondary" size="sm" onClick={onShare}>
          <Share2 aria-hidden /> Share
        </Button>
      </div>
    </div>
  );
}

const Dot = () => (
  <span aria-hidden className="text-muted-foreground/60">
    ·
  </span>
);

function StatusLine({
  status,
  className,
}: {
  status: ReturnType<typeof openState> | null;
  className?: string;
}) {
  // Before mount the clock is unknown: keep the line's height, say nothing.
  if (!status)
    return (
      <span className={cn("inline-block h-5 w-24", className)} aria-hidden />
    );
  return (
    <span className={cn("flex items-center gap-1.5 text-sm", className)}>
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          status.open ? "bg-success" : "bg-danger",
        )}
      />
      <span
        className={cn(
          "font-medium",
          status.open ? "text-success" : "text-danger",
        )}
      >
        {status.open ? "Open" : "Closed"}
      </span>
      {status.detail && (
        <span className="text-muted-foreground">· {status.detail}</span>
      )}
    </span>
  );
}

function SectionHeading({
  id,
  title,
  meta,
}: {
  id: string;
  title: string;
  meta?: string;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 id={id} className="font-display text-title text-foreground">
        {title}
      </h2>
      {meta && <span className="text-sm text-muted-foreground">{meta}</span>}
    </div>
  );
}

/** Sticky tabs under the navbar; the one in view is underlined. */
function SectionNav({
  sections,
}: {
  sections: ReadonlyArray<{ id: string; label: string }>;
}) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");
  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  return (
    <div className="sticky top-[calc(4rem+var(--imp-offset,0px))] z-20 mt-6 border-b border-border bg-background/95">
      <nav
        aria-label="On this page"
        className="container mx-auto px-4 sm:px-6 lg:px-8"
      >
        <ul className="-mb-px flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((s) => (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? "location" : undefined}
                onClick={() => setActive(s.id)}
                className={cn(
                  "inline-flex h-12 items-center border-b-2 text-sm font-semibold transition-colors",
                  active === s.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** Paused bookings and upcoming closures, said before the booking button. */
function BookingNotices({ salon }: { salon: SalonView }) {
  if (!salon.bookingPaused && salon.closures.length === 0) return null;
  return (
    <div className="mb-4 space-y-2">
      {salon.bookingPaused && (
        <p
          role="status"
          className="rounded-2xl bg-warning-soft px-4 py-3 text-sm text-warning"
        >
          <span className="font-semibold">
            Not taking online bookings right now.
          </span>{" "}
          Walk-ins are welcome.
        </p>
      )}
      {salon.closures.length > 0 && (
        <div className="rounded-2xl bg-surface-subtle px-4 py-3 text-sm">
          <p className="font-semibold text-foreground">Upcoming closures</p>
          <ul className="mt-1 space-y-0.5 text-muted-foreground">
            {salon.closures.slice(0, 4).map((c) => (
              <li key={c.id}>
                {formatYmd(c.date, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
                :{" "}
                {c.allDay
                  ? "closed all day"
                  : `closed ${formatClock(c.startTime)}–${formatClock(c.endTime)}`}
                {c.reason ? ` (${c.reason})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function HowBookingWorks({
  takesDeposit,
  compact = false,
  className,
}: {
  takesDeposit: boolean;
  compact?: boolean;
  className?: string;
}) {
  const steps = [
    {
      icon: Scissors,
      title: "Choose a service",
      body: "See the price and time up front.",
    },
    {
      icon: CalendarCheck,
      title: "Pick a date & time",
      body: "Only times that are free are shown.",
    },
    takesDeposit
      ? {
          icon: Wallet,
          title: "Confirm with a small deposit",
          body: "Held from your wallet, the rest is paid at the salon.",
        }
      : {
          icon: Wallet,
          title: "Confirm — it's free",
          body: "Nothing to pay now. Pay at the salon after your visit.",
        },
  ];
  return (
    <div
      className={cn(
        !compact && "rounded-3xl border border-border bg-surface p-5",
        className,
      )}
    >
      <p className="text-sm font-semibold text-foreground">How booking works</p>
      <ol
        className={cn("grid", compact ? "mt-2.5 gap-2.5" : "mt-3 gap-3 sm:grid-cols-3 sm:gap-4")}
      >
        {steps.map((s, i) => (
          <li key={s.title} className="flex items-start gap-3">
            <span className={cn("grid shrink-0 place-items-center rounded-full bg-primary-soft font-semibold text-primary-hover", compact ? "size-6 text-xs" : "size-8 text-sm")}>
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">
                {s.title}
              </span>
              <span className="block text-xs leading-relaxed text-muted-foreground">
                {s.body}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ServicesMenu({ salon }: { salon: SalonView }) {
  const groups = useMemo(() => {
    const map = new Map<string, SalonServiceView[]>();
    for (const s of salon.services)
      map.set(s.category, [...(map.get(s.category) ?? []), s]);
    return [...map.entries()];
  }, [salon.services]);
  const [cat, setCat] = useState<string>("ALL");
  const shown = cat === "ALL" ? groups : groups.filter(([c]) => c === cat);

  if (salon.services.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        This salon hasn&apos;t listed any services for online booking yet.
      </p>
    );
  }

  return (
    <div>
      {groups.length > 1 && (
        <div
          role="tablist"
          aria-label="Service categories"
          className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {[
            ["ALL", salon.services.length] as const,
            ...groups.map(([c, l]) => [c, l.length] as const),
          ].map(([c, n]) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={cat === c}
              onClick={() => setCat(c)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer sm:shrink-auto",
                cat === c
                  ? "border-foreground bg-primary text-background"
                  : "border-border bg-surface text-foreground hover:bg-muted",
              )}
            >
              {c === "ALL" ? "All" : categoryLabel(c)}
              <span
                className={cn(
                  "text-xs tabular-nums",
                  cat === c ? "text-background/70" : "text-muted-foreground",
                )}
              >
                {n}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {shown.map(([c, list]) => (
          <div key={c}>
            {groups.length > 1 && cat === "ALL" && (
              <h3 className="mb-2 text-overline font-semibold tracking-[0.06em] text-primary uppercase">
                {categoryLabel(c)}
              </h3>
            )}
            <ul className="divide-y divide-border/70 overflow-hidden rounded-3xl border border-border bg-surface">
              {list.map((s) => (
                <li key={s.id}>
                  <ServiceRow salon={salon} service={s} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceRow({
  salon,
  service: s,
}: {
  salon: SalonView;
  service: SalonServiceView;
}) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">{s.name}</span>
        {s.description && (
          <span className="mt-0.5 line-clamp-2 block text-sm leading-relaxed text-muted-foreground">
            {s.description}
          </span>
        )}
        {s.duration ? (
          <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Clock className="size-3.5" aria-hidden />{" "}
            {durationText(s.duration)}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-2">
        {typeof s.priceMinor === "number" && (
          <span className="font-semibold text-foreground tabular-nums">
            {formatBDT(s.priceMinor)}
          </span>
        )}
        {!salon.bookingPaused && (
          <span className="inline-flex h-8 items-center rounded-full border border-border bg-surface px-4 text-[13px] font-semibold text-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
            Book
          </span>
        )}
      </span>
    </>
  );
  if (salon.bookingPaused)
    return <div className="flex items-start gap-4 p-4 sm:p-5">{body}</div>;
  return (
    <Link
      href={bookingHref(salon.id, { service: s.id, step: "time" })}
      aria-label={`Book ${s.name}${typeof s.priceMinor === "number" ? `, ${formatBDT(s.priceMinor)}` : ""}`}
      className="group flex items-start gap-4 p-4 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:p-5"
    >
      {body}
    </Link>
  );
}

function Reviews({
  salon,
  viewer,
  onWrite,
}: {
  salon: SalonView;
  viewer?: Viewer;
  onWrite?: () => void;
}) {
  const [all, setAll] = useState(false);
  const { reviews, rating, totalReviews } = salon;
  const shown = all ? reviews : reviews.slice(0, 4);
  // Signed-in customers, and this salon's own owner, can report a review.
  const canReport =
    !!viewer?.userId &&
    (viewer.role === "CUSTOMER" ||
      (viewer.role === "SALON_OWNER" && salon.ownerUserId === viewer.userId));

  return (
    <>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2
          id="reviews-title"
          className="font-display text-title text-foreground"
        >
          Reviews
        </h2>
        {onWrite && (
          <Button variant="secondary" size="sm" onClick={onWrite}>
            Write a review
          </Button>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No reviews yet. Reviews come from customers after their visit.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-5 rounded-3xl bg-surface-subtle p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4 sm:block sm:shrink-0 sm:pr-6 sm:text-center">
              <p className="font-display text-5xl font-semibold text-foreground tabular-nums">
                {formatRating(rating)}
              </p>
              <div>
                <Stars value={rating} className="sm:mt-1 sm:justify-center" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {totalReviews} review{totalReviews === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            {/* The bars count the reviews shown here, not the all-time total. */}
            <div className="flex-1 space-y-1.5 sm:border-l sm:border-border sm:pl-6">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = reviews.filter(
                  (r) => Math.round(r.rating) === n,
                ).length;
                return (
                  <div
                    key={n}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="w-2 tabular-nums">{n}</span>
                    <Star className="size-3 fill-gold text-gold" aria-hidden />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${(count / reviews.length) * 100}%` }}
                      />
                    </div>
                    <span className="w-5 text-right tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <ul className="grid gap-3 md:grid-cols-2">
            {shown.map((r) => (
              <li
                key={r.id}
                className="rounded-3xl border border-border bg-surface p-5"
              >
                <div className="flex items-center gap-3">
                  <PersonAvatar
                    name={r.customerName}
                    className="size-10 text-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {r.customerName}
                    </p>
                    {r.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Asia/Dhaka",
                        })}
                      </p>
                    )}
                  </div>
                  <Stars value={r.rating} />
                </div>
                {r.comment ? (
                  <p className="mt-3 text-sm leading-relaxed break-words text-foreground">
                    {r.comment}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Rated {r.rating} out of 5.
                  </p>
                )}
                {r.ownerReply && (
                  <div className="mt-3 rounded-2xl border-l-2 border-primary bg-surface-subtle px-3 py-2">
                    <p className="text-xs font-semibold text-foreground">
                      Reply from {salon.name}
                    </p>
                    <p className="text-sm leading-relaxed break-words whitespace-pre-line text-muted-foreground">
                      {r.ownerReply}
                    </p>
                  </div>
                )}
                {canReport &&
                  !r.id.startsWith("review-") &&
                  r.customerId !== viewer?.userId && (
                    <div className="mt-1 -ml-2">
                      <ReportReviewButton reviewId={r.id} />
                    </div>
                  )}
              </li>
            ))}
          </ul>
          {reviews.length > 4 && (
            <Button variant="secondary" onClick={() => setAll((v) => !v)}>
              {all
                ? "Show fewer reviews"
                : `Show all ${reviews.length} reviews`}
            </Button>
          )}
        </div>
      )}
    </>
  );
}

function HoursCard({ salon, today }: { salon: SalonView; today: DayKey | null }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <p className="mb-3 flex items-center gap-2 font-semibold text-foreground">
        <Clock className="size-4 text-primary" aria-hidden /> Opening hours
      </p>
      <HoursRows salon={salon} today={today} />
    </div>
  );
}

const SHORT_DAY: Record<DayKey, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

/** Consecutive days with the same hours share a row: "Mon – Fri", or "Every day". */
function HoursRows({
  salon,
  today,
  dense = false,
}: {
  salon: SalonView;
  today: DayKey | null;
  dense?: boolean;
}) {
  const groups: { days: DayKey[]; text: string | null }[] = [];
  for (const d of DAYS) {
    const h = salon.operatingHours[d];
    const text = h?.open && h?.close ? `${formatClock(h.open)} – ${formatClock(h.close)}` : null;
    const last = groups[groups.length - 1];
    if (last && last.text === text) last.days.push(d);
    else groups.push({ days: [d], text });
  }
  const label = (days: DayKey[]) =>
    days.length === 7
      ? "Every day"
      : days.length === 1
        ? DAY_LABEL[days[0]]
        : `${SHORT_DAY[days[0]]} – ${SHORT_DAY[days[days.length - 1]]}`;

  return (
    <ul className="space-y-0.5">
      {groups.map((g) => {
        const isToday = today !== null && g.days.includes(today);
        return (
          <li
            key={g.days[0]}
            aria-current={isToday ? "date" : undefined}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl text-sm",
              dense ? "px-2.5 py-1.5" : "px-3 py-2",
              isToday && "bg-primary-soft",
            )}
          >
            <span className={isToday ? "font-semibold text-foreground" : "text-muted-foreground"}>
              {label(g.days)}
              {isToday && <span className="sr-only"> (includes today)</span>}
            </span>
            {g.text ? (
              <span
                className={cn(
                  "text-right text-foreground tabular-nums",
                  isToday ? "font-semibold" : "font-medium",
                )}
              >
                {g.text}
              </span>
            ) : (
              <span className="text-muted-foreground">Closed</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn("flex text-gold", className)}
      role="img"
      aria-label={`${formatRating(value)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "size-3.5",
            value >= s - 0.25 ? "fill-current" : "text-muted-foreground/40",
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}
