/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Globe,
  Mail,
  MapPin,
  Phone,
  Star,
  User2,
} from "lucide-react";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import BookAppointmentModal from "./BookAppointmentModal";

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
  const dayIndex = now.getDay(); // 0=Sun
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

const SalonDetails = ({ salon }: { salon: any }) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const heroImage =
    salon?.images?.[0] ||
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=700&fit=crop";

  const openNow = useMemo(
    () => isOpenNow(salon?.operatingHours),
    [salon?.operatingHours],
  );

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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* HERO SECTION */}
      <section className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left: Image */}
            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Card className="overflow-hidden border-none shadow-md">
                <div className="relative w-full h-[300px] md:h-[400px]">
                  <Image
                    src={heroImage}
                    alt={salon?.name || "Salon image"}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-primary/90 hover:bg-primary backdrop-blur-sm">
                      {salon?.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                    <Badge
                      variant={openNow ? "default" : "destructive"}
                      className={
                        openNow
                          ? "bg-green-600 hover:bg-green-700"
                          : "text-white"
                      }
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {openNow ? "Open Now" : "Closed"}
                    </Badge>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Right: Summary */}
            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              <Card className="shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-2xl md:text-3xl font-bold">
                        {salon?.name}
                      </CardTitle>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-foreground">
                          {rating}
                        </span>
                        <span className="text-muted-foreground">
                          ({totalReviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{locationLine}</span>
                    </div>

                    {todayHours?.open && todayHours?.close && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>
                          Today:{" "}
                          <span className="font-medium text-foreground">
                            {formatTime(todayHours.open)} –{" "}
                            {formatTime(todayHours.close)}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {salon?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{salon.phone}</span>
                      </div>
                    )}
                    {salon?.email && (
                      <div className="flex items-center gap-2 text-sm truncate">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground truncate">
                          {salon.email}
                        </span>
                      </div>
                    )}
                    {salon?.website && (
                      <div className="flex items-center gap-2 text-sm sm:col-span-2 truncate">
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground truncate">
                          {salon.website}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {salon?.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {salon.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MAIN SINGLE-PAGE CONTENT */}
      <section className="pt-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Main Information */}
            <div className="lg:col-span-8 space-y-8">
              {/* SERVICES SECTION */}
              <Card id="services" className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No active services available yet.
                    </p>
                  ) : (
                    services.map((s: any) => (
                      <div
                        key={s.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-muted/20 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-base">{s.name}</p>
                            {s.category && (
                              <Badge
                                variant="secondary"
                                className="font-normal text-xs"
                              >
                                {String(s.category).replaceAll("_", " ")}
                              </Badge>
                            )}
                          </div>
                          {s.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {s.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                            {typeof s.duration === "number" && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {s.duration} min
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 shrink-0">
                          {typeof s.price === "number" && (
                            <p className="font-bold text-lg text-foreground">
                              ৳{s.price}
                            </p>
                          )}
                          <Button size="sm">Book Service</Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* STAFF SECTION */}
              <Card id="staff" className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Our Team</CardTitle>
                </CardHeader>
                <CardContent>
                  {staff.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No staff listed yet.
                    </p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {staff.map((m: any) => (
                        <div
                          key={m.id}
                          className="p-4 rounded-lg border bg-card flex flex-col justify-between h-full"
                        >
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                {m?.user?.profilePhoto ? (
                                  <Image
                                    src={m.user.profilePhoto}
                                    alt={m?.user?.name || "Staff"}
                                    width={56}
                                    height={56}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <User2 className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-base">
                                  {m?.user?.name || "Staff"}
                                </p>
                                <p className="text-sm text-primary font-medium">
                                  {m?.speciality || "Specialist"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {m?.status && (
                                <Badge
                                  variant={
                                    m.status === "AVAILABLE"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={
                                    m.status === "AVAILABLE"
                                      ? "bg-green-600 hover:bg-green-700"
                                      : ""
                                  }
                                >
                                  {m.status}
                                </Badge>
                              )}
                              {typeof m?.experience === "number" && (
                                <Badge
                                  variant="outline"
                                  className="font-normal"
                                >
                                  {m.experience} yr exp
                                </Badge>
                              )}
                            </div>

                            {m?.bio && (
                              <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                                {m.bio}
                              </p>
                            )}
                          </div>

                          <Button variant="outline" className="w-full mt-5">
                            Book {m?.user?.name?.split(" ")?.[0] || "Staff"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* REVIEWS SECTION */}
              <Card id="reviews" className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No reviews yet. Be the first to review this salon.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((r: any, idx: number) => (
                        <div
                          key={r.id || idx}
                          className="p-4 rounded-lg border bg-card"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {r?.user?.name || "Customer"}
                            </p>
                            <div className="flex items-center gap-1 text-sm bg-muted px-2 py-1 rounded-md">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-bold">
                                {r?.rating ?? 0}
                              </span>
                            </div>
                          </div>
                          {r?.comment && (
                            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                              {r.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Sticky Sidebar */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
              {/* QUICK INFO */}
              <Card className="shadow-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Total Services
                    </span>
                    <span className="font-bold bg-muted px-2 py-0.5 rounded-md">
                      {salon?._count?.services ?? services.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Staff Members</span>
                    <span className="font-bold bg-muted px-2 py-0.5 rounded-md">
                      {salon?._count?.staff ?? staff.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Reviews</span>
                    <span className="font-bold bg-muted px-2 py-0.5 rounded-md">
                      {salon?._count?.reviews ?? totalReviews}
                    </span>
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-3 pt-2">
                    <Button
                      className="w-full font-semibold"
                      size="lg"
                      onClick={() => setIsBookingModalOpen(true)}
                    >
                      Book Appointment
                    </Button>
                    <Button variant="outline" className="w-full" size="lg">
                      Contact Salon
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* OPERATING HOURS */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Operating Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {DAYS.map((d) => {
                    const h = salon?.operatingHours?.[d];
                    const isToday = d === todayKey;
                    return (
                      <div
                        key={d}
                        className={`flex items-center justify-between p-2.5 rounded-md text-sm ${
                          isToday
                            ? "bg-primary/10 border border-primary/20"
                            : "bg-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}
                          >
                            {dayLabel[d]}
                          </span>
                          {isToday && (
                            <Badge
                              variant="default"
                              className="text-[10px] h-5 px-1.5 bg-primary"
                            >
                              Today
                            </Badge>
                          )}
                        </div>

                        {h?.open && h?.close ? (
                          <span
                            className={`font-medium ${isToday ? "text-foreground" : "text-foreground/80"}`}
                          >
                            {formatTime(h.open)} – {formatTime(h.close)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">
                            Closed
                          </span>
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
      <BookAppointmentModal
        open={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        salon={salon}
      />
    </div>
  );
};

export default SalonDetails;
