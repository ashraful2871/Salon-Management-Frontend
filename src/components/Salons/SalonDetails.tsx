/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Clock,
  Globe,
  MapPin,
  MessageSquare,
  Phone,
  Star,
  User2,
  Navigation,
} from "lucide-react";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import BookAppointmentModal from "./BookAppointmentModal";
import ReviewModal from "./ReviewModal";
import SalonLocationCard from "./SalonLocationCard";
import { getMyAppointments } from "@/services/appoinments/getMyAppointments";
import { formatBDT } from "@/lib/money";
import { formatRating } from "@/lib/rating";
import { directionsUrl, formatDistance, haversineMeters } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { useSavedLocation } from "@/hooks/useSavedLocation";
import { useAssistantLauncher } from "@/components/Assistant/AssistantContext";
import SafeImage from "@/components/Shared/SafeImage";
import { ReportReviewButton } from "./ReportReviewButton";

type OperatingHour = { open: string; close: string };
type OperatingHours = Partial<
  Record<
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday",
    OperatingHour
  >
>;

const DAYS: Array<keyof OperatingHours> = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const dayLabel: Record<keyof OperatingHours, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const timeToMinutes = (t: string) => {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
};

const isOpenNow = (operatingHours?: OperatingHours) => {
  if (!operatingHours) return false;

  const now = new Date();
  const dayIndex = now.getDay();
  const map = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;
  const key = map[dayIndex];
  const today = operatingHours[key];

  if (!today?.open || !today?.close) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = timeToMinutes(today.open);
  const closeMinutes = timeToMinutes(today.close);

  if (closeMinutes >= openMinutes) {
    return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
  }
  return nowMinutes >= openMinutes || nowMinutes <= closeMinutes;
};

const formatTime = (t?: string) => {
  if (!t) return "";
  const [hhStr, mm] = t.split(":");
  const hh = Number(hhStr);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  return `${h12}:${mm} ${ampm}`;
};

const getTodayKey = (): keyof OperatingHours => {
  const now = new Date();
  const map = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;
  return map[now.getDay()];
};

const isValidUrl = (url: any) => {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  return (
    trimmed !== "" &&
    trimmed !== "null" &&
    trimmed !== "undefined" &&
    (trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("/") ||
      trimmed.startsWith("data:"))
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-xl font-semibold mb-4">{children}</h2>
);

/** `viewer` is who is signed in (from the token), for the Report button. */
const SalonDetails = ({
  salon,
  viewer,
}: {
  salon: any;
  viewer?: { userId?: string; role?: string } | null;
}) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [unreviewedAppointmentId, setUnreviewedAppointmentId] = useState<string | null>(null);
  const { openWith, enabled: chatEnabled } = useAssistantLauncher();
  const saved = useSavedLocation();

  useEffect(() => {
    const checkReviews = async () => {
      if (!salon?.id) return;
      const res = await getMyAppointments(salon.id, "COMPLETED");
      if (res?.success && res.data) {
        const unreviewed = res.data.find((app: any) => !app.review);
        if (unreviewed) {
          setUnreviewedAppointmentId(unreviewed.id);
          const skipped = sessionStorage.getItem(`skipped_review_${unreviewed.id}`);
          if (!skipped) {
            setReviewModalOpen(true);
          }
        }
      }
    };
    checkReviews();
  }, [salon?.id]);

  const handleSkipReview = () => {
    if (unreviewedAppointmentId) {
      sessionStorage.setItem(`skipped_review_${unreviewedAppointmentId}`, "true");
    }
    setReviewModalOpen(false);
  };

  const allImages = useMemo(() => (salon?.images || []).filter(isValidUrl), [salon?.images]);
  const galleryImages = allImages.length > 0 ? allImages.slice(0, 5) : [salon?.images?.[0] || null];
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const openNow = useMemo(() => isOpenNow(salon?.operatingHours), [salon?.operatingHours]);
  const todayKey = useMemo(() => getTodayKey(), []);
  const todayHours = salon?.operatingHours?.[todayKey];

  const locationLine = useMemo(() => {
    const parts = [salon?.address, salon?.area, salon?.city]
      .filter(Boolean)
      .join(", ");
    return parts || "Location not available";
  }, [salon]);

  const lat = salon?.latitude;
  const lng = salon?.longitude;
  const hasPin =
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);
  const distance =
    hasPin && saved
      ? formatDistance(
          haversineMeters([saved.lat, saved.lng], [lat, lng]),
          salon?.locationAccuracy === "APPROXIMATE",
        )
      : "";
  const directionsHref = hasPin
    ? directionsUrl(lat, lng)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [salon?.name, locationLine].filter(Boolean).join(", "),
      )}`;

  const rating = salon?.rating ?? 0;
  const totalReviews = salon?.totalReviews ?? 0;

  const services = (salon?.services || []).filter((s: any) => s?.isActive);
  const staff = salon?.staff || [];
  const reviews = salon?.reviews || [];
  // Signed-in customers, and this salon's own owner, can report a review.
  const canReport =
    !!viewer?.userId &&
    (viewer.role === "CUSTOMER" ||
      (viewer.role === "SALON_OWNER" && salon?.owner?.userId === viewer.userId));

  const handleBook = (serviceId?: string) => {
    setSelectedServiceId(serviceId);
    setIsBookingModalOpen(true);
  };

  const fromPrice =
    services.length > 0
      ? Math.min(...services.map((s: any) => s.priceMinor || Infinity))
      : 0;
  const hasFromPrice = fromPrice > 0 && Number.isFinite(fromPrice);

  return (
    <div className="min-h-[100dvh] bg-background pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-12">
      {/* GALLERY & SUMMARY */}
      <section className="bg-background lg:bg-surface-subtle lg:border-b pt-0 lg:pt-6 pb-6">
        <div className="container mx-auto lg:px-4">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-7">
              {/* Desktop: main image + thumbnails */}
              <div className="hidden md:flex flex-col gap-3 md:px-4 lg:px-0">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-muted">
                  <SafeImage
                    src={galleryImages[selectedImageIdx]}
                    alt={salon?.name || "Salon image"}
                    fill
                    sizes="(min-width:1024px) 60vw, 100vw"
                    className="object-cover"
                    preload
                  />
                </div>
                {galleryImages.length > 1 && (
                  <div className="flex gap-3" role="group" aria-label="Photos">
                    {galleryImages.map((img: string, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedImageIdx(i)}
                        aria-label={`Show photo ${i + 1}`}
                        aria-pressed={i === selectedImageIdx}
                        className={cn(
                          "relative size-16 rounded-xl overflow-hidden border-2 transition-colors",
                          i === selectedImageIdx
                            ? "border-primary"
                            : "border-transparent opacity-80 hover:opacity-100",
                        )}
                      >
                        <SafeImage src={img} alt="" fill sizes="64px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile: swipe gallery */}
              <div className="md:hidden relative w-full aspect-video bg-muted">
                <div
                  className="flex h-full w-full overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  data-gallery
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const idx = Math.round(el.scrollLeft / el.clientWidth);
                    if (idx !== selectedImageIdx && idx < galleryImages.length) {
                      setSelectedImageIdx(idx);
                    }
                  }}
                >
                  {galleryImages.map((img: string, i: number) => (
                    <div key={i} className="min-w-full h-full snap-center relative">
                      <SafeImage
                        src={img}
                        alt={i === 0 ? salon?.name || "Salon image" : ""}
                        fill
                        sizes="100vw"
                        preload={i === 0}
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                {galleryImages.length > 1 && (
                  <div className="absolute bottom-3 right-3 rounded-full bg-foreground/75 px-2.5 py-1 text-xs font-medium text-background tabular-nums">
                    {selectedImageIdx + 1}/{galleryImages.length}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-5 px-4 lg:px-0">
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="font-display text-title-lg mb-2 break-words">{salon?.name}</h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="flex items-center gap-1 font-semibold">
                      <Star className="h-4 w-4 fill-gold text-gold" aria-hidden />
                      {formatRating(rating)}
                      <span className="font-normal text-muted-foreground">
                        ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span
                        aria-hidden
                        className={cn("size-2 rounded-full", openNow ? "bg-success" : "bg-danger")}
                      />
                      <span className={openNow ? "text-success" : "text-danger"}>
                        {openNow ? "Open now" : "Closed"}
                      </span>
                    </span>
                    {distance && (
                      <span className="text-muted-foreground tabular-nums">{distance}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4 border-y py-4">
                  <p className="flex min-w-0 items-start gap-1.5 text-sm text-muted-foreground leading-relaxed">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span className="break-words">{locationLine}</span>
                  </p>
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <a href={directionsHref} target="_blank" rel="noopener noreferrer">
                      <Navigation aria-hidden /> Directions
                    </a>
                  </Button>
                </div>

                {services.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {services.slice(0, 3).map((s: any) => (
                      <Badge key={s.id} variant="secondary" className="font-normal px-2.5 py-1">
                        {s.name}
                      </Badge>
                    ))}
                    {services.length > 3 && (
                      <a
                        href="#services"
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        +{services.length - 3} more
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="pt-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-10 min-w-0">
              {salon?.description && (
                <div id="about">
                  <SectionTitle>About</SectionTitle>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {salon.description}
                  </p>
                </div>
              )}

              {/* SERVICES */}
              <div id="services" className="scroll-mt-24">
                <SectionTitle>Services</SectionTitle>
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active services available yet.</p>
                ) : (
                  <ul className="divide-y rounded-2xl border bg-card">
                    {services.map((s: any) => (
                      <li key={s.id} className="flex items-center justify-between gap-4 p-4">
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-medium break-words">{s.name}</p>
                          <p className="text-sm text-muted-foreground tabular-nums">
                            {[
                              typeof s.duration === "number" ? `${s.duration} min` : null,
                              typeof s.priceMinor === "number" ? formatBDT(s.priceMinor) : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="shrink-0"
                          onClick={() => handleBook(s.id)}
                          aria-label={`Select ${s.name}`}
                        >
                          Select
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* STAFF */}
              <div id="staff">
                <SectionTitle>Staff</SectionTitle>
                {staff.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No staff listed yet.</p>
                ) : (
                  <ul className="flex gap-4 overflow-x-auto snap-x -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
                    {staff.map((m: any) => (
                      <li
                        key={m.id}
                        className="snap-start shrink-0 w-24 sm:w-28 flex flex-col items-center gap-2"
                      >
                        <div className="relative size-20 sm:size-24 rounded-full bg-muted overflow-hidden">
                          {isValidUrl(m?.user?.profilePhoto) ? (
                            <SafeImage
                              src={m.user.profilePhoto}
                              alt={m?.user?.name || "Staff"}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="size-full flex items-center justify-center">
                              <User2 className="h-8 w-8 text-muted-foreground" aria-hidden />
                            </div>
                          )}
                        </div>
                        <div className="text-center w-full">
                          <p className="font-medium text-sm line-clamp-1">{m?.user?.name || "Staff"}</p>
                          {m?.speciality && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{m.speciality}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* LOCATION, CONTACT & HOURS */}
              <div id="location">
                <SectionTitle>Location &amp; hours</SectionTitle>
                <div className="grid gap-4 md:grid-cols-2 items-start">
                  {salon && <SalonLocationCard salon={salon} />}

                  <Card className="gap-4 py-4 shadow-sm">
                    <CardHeader className="px-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Clock className="h-4 w-4 text-primary" aria-hidden /> Opening hours
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 px-4">
                      {DAYS.map((d) => {
                        const h = salon?.operatingHours?.[d];
                        const isToday = d === todayKey;
                        return (
                          <div
                            key={d}
                            aria-current={isToday ? "date" : undefined}
                            className={cn(
                              "flex items-center justify-between rounded-lg px-2.5 py-2 text-sm",
                              isToday && "bg-primary-soft",
                            )}
                          >
                            <span className={isToday ? "font-semibold text-foreground" : "text-muted-foreground"}>
                              {dayLabel[d]}
                              {isToday && <span className="sr-only"> (today)</span>}
                            </span>
                            {h?.open && h?.close ? (
                              <span className={cn("tabular-nums", isToday ? "font-semibold" : "font-medium")}>
                                {formatTime(h.open)} – {formatTime(h.close)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Closed</span>
                            )}
                          </div>
                        );
                      })}

                      {(salon?.phone || salon?.website || chatEnabled) && (
                        <div className="mt-3 space-y-3 border-t pt-4 text-sm">
                          {salon?.phone && (
                            <a href={`tel:${salon.phone}`} className="flex items-center gap-3 hover:text-primary">
                              <Phone className="h-4 w-4 text-muted-foreground" aria-hidden />
                              <span className="tabular-nums">{salon.phone}</span>
                            </a>
                          )}
                          {salon?.website && (
                            <p className="flex min-w-0 items-center gap-3">
                              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                              <span className="truncate">{salon.website}</span>
                            </p>
                          )}
                          {chatEnabled && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => openWith({ type: "choose_salon", salonId: salon.id }, salon?.name)}
                            >
                              <MessageSquare aria-hidden /> Ask about this salon
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* REVIEWS */}
              <div id="reviews">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="font-display text-xl font-semibold">Reviews</h2>
                  {unreviewedAppointmentId && (
                    <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(true)}>
                      Write a review
                    </Button>
                  )}
                </div>
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No reviews yet. Reviews come from customers after their visit.
                  </p>
                ) : (
                  <div>
                    <div className="flex items-center gap-5 rounded-2xl bg-surface-subtle p-5 mb-2">
                      <div className="shrink-0 text-center">
                        <div className="font-display text-4xl font-bold tabular-nums">{formatRating(rating)}</div>
                        <div className="mt-1 flex justify-center text-gold" aria-hidden>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={cn("h-3.5 w-3.5", rating >= s - 0.25 && "fill-current")} />
                          ))}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                        </div>
                      </div>
                      {/* Bars count the reviews on this page, not the all-time total. */}
                      <div className="flex-1 space-y-1.5 border-l pl-5">
                        {[5, 4, 3, 2, 1].map((s) => {
                          const count = reviews.filter((r: any) => Math.round(r.rating || 0) === s).length;
                          const pct = (count / reviews.length) * 100;
                          return (
                            <div key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="w-2 tabular-nums">{s}</span>
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <ul className="divide-y">
                      {reviews.map((r: any, idx: number) => (
                        <li key={r.id || idx} className="py-4">
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <p className="font-medium truncate">{r?.customer?.name || r?.user?.name || "Customer"}</p>
                            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                              <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden />
                              {r?.rating ?? 0}
                            </span>
                          </div>
                          {r?.comment && (
                            <p className="text-sm text-muted-foreground leading-relaxed break-words">{r.comment}</p>
                          )}
                          {r?.id && canReport && r?.customer?.id !== viewer?.userId && (
                            <div className="mt-1 -ml-2">
                              <ReportReviewButton reviewId={r.id} />
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* DESKTOP SIDEBAR: sticky booking card */}
            <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24">
              <Card className="gap-0 rounded-2xl py-0 shadow-card">
                <CardContent className="space-y-4 p-6">
                  {hasFromPrice && (
                    <p className="text-sm text-muted-foreground">
                      From{" "}
                      <span className="text-2xl font-bold text-foreground tabular-nums">
                        {formatBDT(fromPrice)}
                      </span>
                    </p>
                  )}
                  <p className="flex items-center gap-2 text-sm">
                    <span aria-hidden className={cn("size-2 rounded-full", openNow ? "bg-success" : "bg-danger")} />
                    <span className="text-muted-foreground">
                      {todayHours?.open && todayHours?.close
                        ? `Today ${formatTime(todayHours.open)} – ${formatTime(todayHours.close)}`
                        : "Closed today"}
                    </span>
                  </p>
                  <Button size="lg" className="w-full" onClick={() => handleBook()} disabled={services.length === 0}>
                    Book now
                  </Button>
                  <a href="#location" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                    Location &amp; opening hours
                  </a>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>

      {/* MOBILE STICKY BOOKING BAR */}
      <div
        data-bottom-bar
        className="fixed inset-x-0 bottom-0 z-30 lg:hidden border-t bg-surface/95 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            {hasFromPrice ? (
              <p className="text-xs text-muted-foreground">
                From{" "}
                <span className="text-base font-bold text-foreground tabular-nums">{formatBDT(fromPrice)}</span>
              </p>
            ) : (
              <p className="truncate text-sm font-medium">{salon?.name}</p>
            )}
          </div>
          <Button size="lg" className="px-8" onClick={() => handleBook()} disabled={services.length === 0}>
            Book now
          </Button>
        </div>
      </div>

      <BookAppointmentModal
        open={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        salon={salon}
        initialServiceId={selectedServiceId}
      />
      {unreviewedAppointmentId && (
        <ReviewModal
          open={reviewModalOpen}
          onClose={handleSkipReview}
          appointmentId={unreviewedAppointmentId}
          salonId={salon?.id}
        />
      )}
    </div>
  );
};

export default SalonDetails;
