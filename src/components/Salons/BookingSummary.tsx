"use client";

import React, { useActionState, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Info,
  Loader2,
  Lock,
  MapPin,
  Pencil,
  Scissors,
  ShieldCheck,
  Smartphone,
  Star,
  Store,
  Timer,
  UserRound,
  Wallet,
} from "lucide-react";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/money";
import {
  COMING_SOON_NOTICE,
  PAYMENT_METHODS,
  WALLET_METHOD_ID,
} from "@/lib/payment-methods";
import { bookingAppointment } from "@/services/appoinments/book-appoiments";

type SalonInfo = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  area?: string | null;
  phone?: string | null;
  image?: string | null;
  rating?: number;
  totalReviews?: number;
  cancellationWindowMin: number;
};

type ServiceInfo = {
  id: string;
  name: string;
  category?: string | null;
  duration?: number | null;
  priceMinor: number;
};

type CounterInfo = { id: string; name: string; code?: string | null };
type StaffInfo = { id: string; name: string; speciality?: string | null };

type SlotInfo = {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  isTaken: boolean;
};

type WalletInfo = {
  available: number;
  balance: number;
  held: number;
  isFrozen: boolean;
  loaded: boolean;
};

type BookingSummaryProps = {
  salon: SalonInfo;
  service: ServiceInfo;
  counter: CounterInfo;
  staff?: StaffInfo;
  slot: SlotInfo;
  notes: string;
  depositMinor: number;
  wallet: WalletInfo;
  editHref: string;
};

const METHOD_ICONS: Record<string, React.ComponentType<{ className?: string }>> =
  {
    SALON_WALLET: Wallet,
    CARD: CreditCard,
    MOBILE_BANKING: Smartphone,
    PAY_AT_SALON: Store,
  };

/**
 * `slot.date` arrives as an ISO timestamp for midnight in the server's zone.
 * Reading it with `new Date()` in the browser can land on the previous day, so
 * take the calendar part literally and rebuild it locally.
 */
const formatCalendarDate = (iso: string) => {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatClock = (time?: string) => {
  if (!time) return "";
  const [hourStr, minute] = time.split(":");
  const hour = Number(hourStr);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${suffix}`;
};

const isValidImage = (url?: string | null) =>
  typeof url === "string" &&
  (url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/"));

const DetailRow = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) => (
  <div className="flex items-start gap-4 py-4">
    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-semibold text-foreground break-words">{value}</p>
      {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
    </div>
  </div>
);

const Step = ({
  index,
  label,
  state,
}: {
  index: number;
  label: string;
  state: "done" | "current" | "todo";
}) => (
  <div className="flex items-center gap-2">
    <span
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
        state === "done" && "bg-primary/15 text-primary",
        state === "current" && "bg-primary text-primary-foreground",
        state === "todo" && "bg-muted text-muted-foreground",
      )}
    >
      {state === "done" ? <Check className="h-3.5 w-3.5" /> : index}
    </span>
    <span
      className={cn(
        "text-sm",
        state === "current"
          ? "font-semibold text-foreground"
          : "text-muted-foreground",
      )}
    >
      {label}
    </span>
  </div>
);

const BookingSummary = ({
  salon,
  service,
  counter,
  staff,
  slot,
  notes,
  depositMinor,
  wallet,
  editHref,
}: BookingSummaryProps) => {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    bookingAppointment,
    null,
  );
  const [selectedMethod, setSelectedMethod] = useState(WALLET_METHOD_ID);
  const lastHandled = React.useRef(state);

  // Between the booking succeeding and the confirmation page arriving, this
  // page re-renders against a slot that is now BOOKED. Without this, it would
  // flash "this time has just been taken" at the person who just took it.
  const isCompleting = state?.success === true;

  const dueAtSalonMinor = Math.max(service.priceMinor - depositMinor, 0);
  const shortfallMinor = Math.max(depositMinor - wallet.available, 0);
  const hasShortfall = shortfallMinor > 0;

  const blocker = useMemo(() => {
    if (slot.isTaken)
      return {
        title: "This time has just been taken",
        body: "Another customer booked this slot while you were reviewing. Pick a different time to continue.",
        action: { label: "Choose another time", href: editHref },
      };
    if (wallet.isFrozen)
      return {
        title: "Your wallet is on hold",
        body: "Bookings are paused while your wallet is frozen. Contact support to get it lifted.",
        action: { label: "Go to my wallet", href: "/dashboard/wallet" },
      };
    if (hasShortfall)
      return {
        title: `Add ${formatBDT(shortfallMinor)} to confirm`,
        body: `This booking holds a ${formatBDT(depositMinor)} deposit, and your available balance is ${formatBDT(wallet.available)}. Top up and come straight back.`,
        action: { label: "Add money to wallet", href: "/dashboard/wallet" },
      };
    return null;
  }, [
    slot.isTaken,
    wallet.isFrozen,
    wallet.available,
    hasShortfall,
    shortfallMinor,
    depositMinor,
    editHref,
  ]);

  useEffect(() => {
    if (!state || lastHandled.current === state) return;
    lastHandled.current = state;

    if (state.success) {
      const appointmentId = (state.data as { id?: string } | undefined)?.id;
      toast.success(state.message || "Appointment booked");
      router.replace(
        `/salons/${salon.id}/book/confirmed${
          appointmentId ? `?ref=${appointmentId}` : ""
        }`,
      );
    } else {
      toast.error(state.message || "We could not confirm this booking");
    }
  }, [state, router, salon.id]);

  const activeBlocker = isCompleting ? null : blocker;
  const isBusy = isPending || isCompleting;
  const confirmDisabled =
    isBusy || Boolean(activeBlocker) || selectedMethod !== WALLET_METHOD_ID;

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      {/* HEADER */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-5">
          <Link
            href={editHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {salon.name}
          </Link>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
                Review &amp; confirm
              </h1>
              <p className="mt-1 text-muted-foreground">
                Check every detail below, then secure your slot.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Step index={1} label="Select" state="done" />
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              <Step index={2} label="Review & pay" state="current" />
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              <Step index={3} label="Confirmed" state="todo" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <form action={formAction}>
          <input type="hidden" name="salonId" value={salon.id} />
          <input type="hidden" name="serviceId" value={service.id} />
          <input type="hidden" name="counterId" value={counter.id} />
          <input type="hidden" name="slotId" value={slot.id} />
          {staff?.id && <input type="hidden" name="staffId" value={staff.id} />}
          {notes && <input type="hidden" name="notes" value={notes} />}
          <input type="hidden" name="paymentMethod" value={selectedMethod} />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* LEFT: what is being booked */}
            <div className="space-y-6 lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="overflow-hidden shadow-sm">
                  <div className="flex items-center gap-4 border-b bg-gradient-to-r from-primary/5 to-transparent p-5">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {isValidImage(salon.image) ? (
                        <Image
                          src={salon.image as string}
                          alt={salon.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Scissors className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold">{salon.name}</h2>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {[salon.address, salon.area, salon.city]
                          .filter(Boolean)
                          .join(", ") || "Address unavailable"}
                      </p>
                      {typeof salon.rating === "number" && salon.rating > 0 && (
                        <p className="mt-1 flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-semibold">
                            {salon.rating.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">
                            ({salon.totalReviews || 0} reviews)
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <CardHeader className="flex flex-row items-center justify-between pb-0">
                    <CardTitle className="text-base">
                      Appointment details
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="gap-1.5">
                      <Link href={editHref}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                  </CardHeader>

                  <CardContent className="pt-2">
                    <div className="divide-y">
                      <DetailRow
                        icon={Scissors}
                        label="Service"
                        value={service.name}
                        hint={
                          [
                            service.category,
                            service.duration ? `${service.duration} minutes` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || undefined
                        }
                      />
                      <DetailRow
                        icon={CalendarDays}
                        label="Date"
                        value={formatCalendarDate(slot.date)}
                      />
                      <DetailRow
                        icon={Clock}
                        label="Time"
                        value={
                          slot.endTime
                            ? `${formatClock(slot.startTime)} – ${formatClock(slot.endTime)}`
                            : formatClock(slot.startTime)
                        }
                        hint={
                          service.duration
                            ? `Please arrive 10 minutes early · ${service.duration} min session`
                            : "Please arrive 10 minutes early"
                        }
                      />
                      <DetailRow
                        icon={Store}
                        label="Counter"
                        value={
                          counter.code
                            ? `${counter.name} (${counter.code})`
                            : counter.name
                        }
                      />
                      <DetailRow
                        icon={UserRound}
                        label="Specialist"
                        value={staff?.name || "No preference"}
                        hint={
                          staff?.speciality ||
                          (staff ? undefined : "The salon will assign someone available")
                        }
                      />
                      {notes && (
                        <DetailRow
                          icon={Info}
                          label="Your notes"
                          value={notes}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* PAYMENT METHOD */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 }}
              >
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lock className="h-4 w-4 text-primary" />
                      Payment method
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Only the deposit is paid now. The rest is settled at the
                      salon.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = METHOD_ICONS[method.id] || CreditCard;
                      const available = method.status === "AVAILABLE";
                      const selected = available && selectedMethod === method.id;

                      return (
                        <button
                          key={method.id}
                          type="button"
                          disabled={!available}
                          onClick={() => available && setSelectedMethod(method.id)}
                          aria-pressed={selected}
                          className={cn(
                            "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all",
                            selected &&
                              "border-primary bg-primary/5 ring-2 ring-primary/20",
                            available && !selected && "hover:border-primary/40 hover:bg-muted/50",
                            !available && "cursor-not-allowed border-dashed opacity-60",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                              selected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold">{method.name}</span>
                              {method.tag && (
                                <Badge
                                  variant={available ? "secondary" : "outline"}
                                  className="text-[10px] uppercase tracking-wide"
                                >
                                  {method.tag}
                                </Badge>
                              )}
                            </span>
                            <span className="mt-0.5 block text-sm text-muted-foreground">
                              {method.description}
                            </span>
                            {selected && available && (
                              <span className="mt-2 block text-sm">
                                <span className="text-muted-foreground">
                                  Available balance:{" "}
                                </span>
                                <span
                                  className={cn(
                                    "font-semibold",
                                    hasShortfall ? "text-destructive" : "text-sage",
                                  )}
                                >
                                  {wallet.loaded
                                    ? formatBDT(wallet.available)
                                    : "unavailable"}
                                </span>
                              </span>
                            )}
                          </span>

                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                              selected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/30",
                            )}
                          >
                            {selected && (
                              <Check className="h-3 w-3 text-primary-foreground" />
                            )}
                          </span>
                        </button>
                      );
                    })}

                    <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {COMING_SOON_NOTICE}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* POLICY */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.1 }}
              >
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldCheck className="h-4 w-4 text-sage" />
                      Deposit &amp; cancellation policy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                      <span>
                        <strong className="text-foreground">You turn up:</strong>{" "}
                        the {formatBDT(depositMinor)} deposit comes off your bill
                        and you pay {formatBDT(dueAtSalonMinor)} at the counter.
                      </span>
                    </p>
                    <p className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                      <span>
                        <strong className="text-foreground">
                          You cancel in time:
                        </strong>{" "}
                        cancel at least{" "}
                        {Math.round(salon.cancellationWindowMin / 60)} hour
                        {salon.cancellationWindowMin >= 120 ? "s" : ""} before the
                        appointment and the full deposit is released back to your
                        wallet instantly.
                      </span>
                    </p>
                    <p className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <span>
                        <strong className="text-foreground">
                          You do not show up:
                        </strong>{" "}
                        the deposit is forfeited to the salon. You have 48 hours
                        to appeal if that was a mistake.
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* RIGHT: money and confirm */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 }}
                className="lg:sticky lg:top-6 space-y-4"
              >
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base">Payment summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {service.name}
                      </span>
                      <span className="font-medium">
                        {formatBDT(service.priceMinor)}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">Pay now (deposit)</p>
                        <p className="text-xs text-muted-foreground">
                          Held on your wallet, not spent
                        </p>
                      </div>
                      <p className="text-xl font-bold text-primary">
                        {formatBDT(depositMinor)}
                      </p>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">Due at the salon</p>
                        <p className="text-xs text-muted-foreground">
                          Cash or card at the counter
                        </p>
                      </div>
                      <p className="text-xl font-bold">
                        {formatBDT(dueAtSalonMinor)}
                      </p>
                    </div>

                    <Separator />

                    <div className="rounded-lg bg-muted/60 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Wallet available now
                        </span>
                        <span className="font-semibold">
                          {formatBDT(wallet.available)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Available after booking
                        </span>
                        <span
                          className={cn(
                            "font-semibold",
                            hasShortfall && "text-destructive",
                          )}
                        >
                          {formatBDT(Math.max(wallet.available - depositMinor, 0))}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Your total balance of {formatBDT(wallet.balance)} does not
                        change — a hold only moves money out of reach until the
                        booking is settled.
                      </p>
                    </div>

                    {activeBlocker ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <p className="flex items-center gap-2 font-semibold text-amber-900">
                          <AlertTriangle className="h-4 w-4" />
                          {activeBlocker.title}
                        </p>
                        <p className="mt-1 text-sm text-amber-800">
                          {activeBlocker.body}
                        </p>
                        <Button
                          asChild
                          size="sm"
                          className="mt-3 w-full bg-amber-600 hover:bg-amber-700"
                        >
                          <Link href={activeBlocker.action.href}>
                            {activeBlocker.action.label}
                          </Link>
                        </Button>
                      </div>
                    ) : null}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gap-2 text-base font-semibold"
                      disabled={confirmDisabled}
                    >
                      {isBusy ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Confirm &amp; hold {formatBDT(depositMinor)}
                        </>
                      )}
                    </Button>

                    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Secured by SalonKhuji. You can cancel free of charge until{" "}
                      {Math.round(salon.cancellationWindowMin / 60)}h before.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-dashed shadow-none">
                  <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
                    <Timer className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p>
                      Slots are first come, first served — this time is not
                      reserved until you confirm.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingSummary;
