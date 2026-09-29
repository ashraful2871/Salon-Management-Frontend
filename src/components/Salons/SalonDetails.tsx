/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Globe,
  Mail,
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
import { Separator } from "../ui/separator";
import BookAppointmentModal from "./BookAppointmentModal";
import ReviewModal from "./ReviewModal";
import SalonLocationCard from "./SalonLocationCard";
import { getMyAppointments } from "@/services/appoinments/getMyAppointments";
import { formatBDT } from "@/lib/money";
import { formatRating } from "@/lib/rating";
import { useAssistantLauncher } from "@/components/Assistant/AssistantContext";
import SafeImage from "@/components/Shared/SafeImage";

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

const SalonDetails = ({ salon }: { salon: any }) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [unreviewedAppointmentId, setUnreviewedAppointmentId] = useState<string | null>(null);
  const { openWith, enabled: chatEnabled } = useAssistantLauncher();

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
    const parts = [salon?.address, salon?.city, salon?.state, salon?.zipCode]
      .filter(Boolean)
      .join(", ");
    return parts || "Location not available";
  }, [salon]);

  const rating = salon?.rating ?? 0;
  const totalReviews = salon?.totalReviews ?? 0;

  const services = (salon?.services || []).filter((s: any) => s?.isActive);
  const staff = salon?.staff || [];
  const reviews = salon?.reviews || [];

  const handleBook = (serviceId?: string) => {
    setSelectedServiceId(serviceId);
    setIsBookingModalOpen(true);
  };

  const fromPrice =
    services.length > 0
      ? Math.min(...services.map((s: any) => s.priceMinor || Infinity))
      : 0;

  return (
    <div className="min-h-[100dvh] bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
      {/* GALLERY & SUMMARY SECTION */}
      <section className="bg-background lg:bg-muted/30 lg:border-b pt-0 lg:pt-6 pb-6">
        <div className="container mx-auto lg:px-4">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Gallery */}
            <div className="lg:col-span-7">
              {/* Desktop */}
              <div className="hidden md:flex flex-col gap-4">
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
                  <div className="flex gap-3">
                    {galleryImages.map((img: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIdx(i)}
                        className={`relative size-16 rounded-xl overflow-hidden border-2 transition-colors ${
                          i === selectedImageIdx ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <SafeImage
                          src={img}
                          alt="Thumbnail"
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Mobile */}
              <div className="md:hidden relative w-full aspect-video bg-muted">
                <div
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full w-full"
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
                        alt={salon?.name || "Salon image"}
                        fill
                        sizes="100vw"
                        preload={i === 0}
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                {galleryImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-foreground/70 backdrop-blur-sm text-background px-3 py-1 rounded-full text-xs font-medium z-10 tabular-nums">
                    {selectedImageIdx + 1} / {galleryImages.length}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-5 px-4 lg:px-0">
              <div className="flex flex-col gap-4 mt-4 lg:mt-0">
                <div>
                  <h1 className="font-display text-title-lg mb-1">{salon?.name}</h1>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 font-semibold">
                      <Star className="h-4 w-4 fill-gold text-gold" />
                      <span>{formatRating(rating)}</span>
                    </div>
                    <span className="text-muted-foreground">({totalReviews} reviews)</span>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className={`size-2 rounded-full ${openNow ? "bg-success" : "bg-danger"}`} />
                      <span className={openNow ? "text-success" : "text-danger"}>
                        {openNow ? "Open now" : "Closed"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4 py-4 border-y">
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <span className="text-foreground font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4 shrink-0" /> {salon?.city || "Location"}
                      {salon?.distance != null && ` · ${salon.distance} km`}
                    </span>
                    <span className="pl-5 leading-relaxed">{locationLine}</span>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 gap-1 rounded-full">
                    <Navigation className="h-4 w-4" /> Directions
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
                      <Badge variant="secondary" className="font-normal px-2.5 py-1 text-muted-foreground">
                        +{services.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN SINGLE-PAGE CONTENT */}
      <section className="pt-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-8 space-y-8">
              {/* SERVICES SECTION */}
              <div id="services">
                <h2 className="text-xl font-bold mb-4">Services</h2>
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active services available yet.</p>
                ) : (
                  <div className="space-y-3">
                    {services.map((s: any) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-4 p-4 rounded-2xl border bg-card hover:border-primary/30 transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-base">{s.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {typeof s.duration === "number" && (
                              <span>{s.duration} min</span>
                            )}
                            {typeof s.duration === "number" && typeof s.priceMinor === "number" && <span>·</span>}
                            {typeof s.priceMinor === "number" && (
                              <span className="font-medium text-foreground">
                                {formatBDT(s.priceMinor)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="secondary" 
                          className="rounded-full"
                          onClick={() => handleBook(s.id)}
                        >
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* STAFF SECTION */}
              <div id="staff">
                <h2 className="text-xl font-bold mb-4">Staff</h2>
                {staff.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No staff listed yet.</p>
                ) : (
                  <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 gap-4">
                    {staff.map((m: any) => (
                      <div
                        key={m.id}
                        className="snap-start shrink-0 w-24 sm:w-28 flex flex-col items-center gap-2"
                      >
                        <div className="size-20 sm:size-24 rounded-full bg-muted overflow-hidden shrink-0">
                          {isValidUrl(m?.user?.profilePhoto) ? (
                            <SafeImage
                              src={m.user.profilePhoto}
                              alt={m?.user?.name || "Staff"}
                              width={96}
                              height={96}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="size-full flex items-center justify-center bg-muted">
                              <User2 className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="text-center w-full">
                          <p className="font-medium text-sm line-clamp-1">{m?.user?.name || "Staff"}</p>
                          {m?.speciality && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{m.speciality}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* REVIEWS SECTION */}
              <div id="reviews">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Reviews</h2>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => setReviewModalOpen(true)}>
                    Write a review
                  </Button>
                </div>
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review this salon.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-6 bg-muted/30 p-6 rounded-2xl mb-6">
                      <div className="text-center px-4">
                        <div className="text-4xl font-display font-bold">{formatRating(rating)}</div>
                        <div className="flex text-gold mt-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-4 w-4 ${rating >= s ? "fill-current" : ""}`} />
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{totalReviews} reviews</div>
                      </div>
                      {/* Simple bars */}
                      <div className="flex-1 space-y-2 border-l pl-6">
                        {[5, 4, 3, 2, 1].map((s) => {
                          const count = reviews.filter((r: any) => Math.round(r.rating || 0) === s).length;
                          const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                          return (
                            <div key={s} className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="w-2">{s}</span>
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {reviews.map((r: any, idx: number) => (
                      <div key={r.id || idx} className="py-4 border-b last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{r?.user?.name || "Customer"}</p>
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                            <span className="font-bold">{r?.rating ?? 0}</span>
                          </div>
                        </div>
                        {r?.comment && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Desktop Sidebar */}
            <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-24">
              <Card className="rounded-2xl shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="text-muted-foreground text-sm mb-4">
                    {fromPrice > 0 && (
                      <>
                        From <span className="text-2xl font-bold text-foreground tabular-nums">{formatBDT(fromPrice)}</span>
                      </>
                    )}
                  </div>
                  <Button size="lg" className="w-full rounded-full" onClick={() => handleBook()}>
                    Book now
                  </Button>
                </CardContent>
              </Card>

              {salon && <SalonLocationCard salon={salon} />}

              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {salon?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{salon.phone}</span>
                    </div>
                  )}
                  {salon?.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{salon.website}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="space-y-3 pt-2">
                    {chatEnabled && (
                      <Button variant="outline" className="w-full gap-2 rounded-full" onClick={() => openWith({ type: "choose_salon", salonId: salon.id }, salon?.name)}>
                        <MessageSquare className="h-4 w-4" aria-hidden /> Ask about this salon
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" /> Operating Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {DAYS.map((d) => {
                    const h = salon?.operatingHours?.[d];
                    const isToday = d === todayKey;
                    return (
                      <div key={d} className={`flex items-center justify-between p-2.5 rounded-lg text-sm ${isToday ? "bg-primary/10" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                            {dayLabel[d]}
                          </span>
                        </div>
                        {h?.open && h?.close ? (
                          <span className={`font-medium ${isToday ? "text-primary" : "text-foreground"}`}>
                            {formatTime(h.open)} – {formatTime(h.close)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Closed</span>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE STICKY BOOKING BAR */}
      <div data-bottom-bar className="fixed inset-x-0 bottom-[env(safe-area-inset-bottom)] z-30 lg:hidden border-t bg-surface p-4 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div>
          {fromPrice > 0 && (
            <div className="text-xs text-muted-foreground font-medium">
              From <span className="text-base font-bold text-foreground tabular-nums">{formatBDT(fromPrice)}</span>
            </div>
          )}
        </div>
        <Button size="lg" className="rounded-full px-8" onClick={() => handleBook()}>
          Book now
        </Button>
      </div>

      <BookAppointmentModal
        open={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        salon={salon}
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
