"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock, Loader2, LogIn, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/money";
import type { ProviderId } from "@/lib/payment-providers";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { signOutTo } from "@/services/auth/signOutTo";
import { createHomeAddress } from "@/services/home-service/createHomeAddress";
import { createHomeBooking } from "@/services/home-service/createHomeBooking";
import { quoteHomeBooking } from "@/services/home-service/quoteHomeBooking";
import type { HomeAddress, HomeExpertDetail, HomeQuote, HomeQuoteInput } from "@/services/home-service/types";
import type { PaymentMethodOption } from "@/services/payments/getPaymentMethods";
import { updateMyPhone } from "@/services/users/updateMyPhone";
import { CATEGORY_LABEL, SIDES, durationText, trackSide } from "../content";
import { ExpertAvatar, RatingLine } from "../HomeCards";
import AddressStep, { addressProblem, fromSaved, type AddressDraft } from "./AddressStep";
import { DisclaimerBox } from "./Disclaimer";
import { homeErrorMessage, stepForCode, type BookStep } from "./errors";
import { BD_MOBILE, dayText, normalizePhone, timeText } from "./format";
import { PayPanel, useHomePay } from "./PayPanel";
import { DayChips, TimeGroups, useHomeSlots, type SlotSource } from "./SlotPicker";

const STEPS: { key: BookStep; label: string }[] = [
  { key: "services", label: "Services" },
  { key: "expert", label: "Expert" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "address", label: "Address" },
  { key: "review", label: "Review & pay" },
];

/** Guests and non-customers walk the first four steps; booking needs a customer. */
const OPEN_STEPS = 4;


export type BookViewer = {
  /** undefined = a guest. */
  role?: string;
  name: string;
  phone: string;
  walletMinor: number;
  addresses: HomeAddress[];
};

/**
 * /home-service/book: services → expert → date → time → address → review and
 * pay. The cart (`expert`, `items`, `any`, `date`, `time`, `step`) lives in the
 * URL, so a sign-in round trip comes back to the same place.
 */
export default function HomeBookingFlow({
  expert,
  initial,
  viewer,
  methods,
  point,
}: {
  expert: HomeExpertDetail;
  initial: { items: string[]; any: boolean; date: string | null; time: string | null; step: BookStep };
  viewer: BookViewer;
  methods: PaymentMethodOption[];
  point: { lat: number; lng: number; label?: string } | null;
}) {
  const router = useRouter();
  const side = SIDES[expert.audience];
  const isCustomer = viewer.role === "CUSTOMER";

  const [step, setStep] = useState<BookStep>(initial.step);
  const [items, setItems] = useState<string[]>(initial.items);
  const [any, setAny] = useState(initial.any);
  const [date, setDate] = useState<string | null>(initial.date);
  const [time, setTime] = useState<string | null>(initial.time);
  const [profileHasPhone, setProfileHasPhone] = useState(BD_MOBILE.test(viewer.phone));
  const [address, setAddress] = useState<AddressDraft>(() => {
    const blank: AddressDraft = {
      savedId: null,
      lat: null,
      lng: null,
      addressLine: "",
      area: "",
      landmark: "",
      recipientName: viewer.name,
      contactPhone: viewer.phone,
      notes: "",
      recipientIsWoman: false,
      save: viewer.addresses.length < 10,
      label: viewer.addresses.length ? "" : "Home",
    };
    const first = viewer.addresses[0];
    return first ? fromSaved(first, blank) : blank;
  });
  const [quote, setQuote] = useState<HomeQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [creating, setCreating] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const createKey = useRef<string | null>(null);
  const { pay, pending: paying } = useHomePay();

  const chosen = useMemo(() => expert.menu.filter((m) => items.includes(m.id)), [expert.menu, items]);
  const subtotal = chosen.reduce((s, m) => s + m.priceMinor, 0);
  const minutes = chosen.reduce((s, m) => s + m.durationMin, 0);
  const travelFee = expert.salon.travelFeeMinor;
  const belowMin = Math.max(0, expert.salon.minOrderMinor - subtotal);

  const source = useMemo<SlotSource | null>(
    () =>
      items.length
        ? {
            offeringIds: items,
            ...(any ? { salonId: expert.salon.id } : { expertId: expert.id }),
            ...(point ? { lat: point.lat, lng: point.lng } : {}),
          }
        : null,
    [items, any, expert.id, expert.salon.id, point],
  );
  const { days, times } = useHomeSlots(source, date);
  const dayInfo = days.data?.days.find((d) => d.date === date) ?? null;
  const slot = times.data?.find((s) => s.startAt === time) ?? null;

  // The cart in the URL, without a server round trip. Keeping `history.state`
  // leaves the router out of it: with `null` Next dispatches a restore, and the
  // live days / times / quote calls in flight never come back to this screen.
  useEffect(() => {
    const q = new URLSearchParams({ expert: expert.id });
    if (items.length) q.set("items", items.join(","));
    if (any) q.set("any", "1");
    if (date) q.set("date", date);
    if (time) q.set("time", time);
    if (step !== "services") q.set("step", step);
    window.history.replaceState(window.history.state, "", `/home-service/book?${q.toString()}`);
  }, [expert.id, items, any, date, time, step]);

  // A time restored from the URL (or held across sign-in) that is no longer offered.
  const timeGone = Boolean(time && times.data && !slot);

  const index = STEPS.findIndex((s) => s.key === step);
  const go = (to: BookStep) => {
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleItem = (id: string) => {
    setItems((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 10 ? p : [...p, id]));
    setTime(null);
    setQuote(null);
  };

  const quoteInput = (): HomeQuoteInput | null => {
    if (!date || !time || address.lat == null || address.lng == null) return null;
    return {
      salonId: expert.salon.id,
      audience: expert.audience,
      offeringIds: items,
      expertId: any ? "ANY" : expert.id,
      date,
      startAt: time,
      lat: address.lat,
      lng: address.lng,
      addressLine: address.addressLine.trim(),
      area: address.area.trim() || undefined,
      landmark: address.landmark.trim() || undefined,
      recipientName: address.recipientName.trim(),
      ...(expert.audience === "LADIES" ? { recipientIsWoman: address.recipientIsWoman } : {}),
      contactPhone: normalizePhone(address.contactPhone),
      notes: address.notes.trim() || undefined,
    };
  };

  /** Sends the customer to the step a code is about, with the friendly line. */
  const bounce = (res: { message: string; errorCode?: string }) => {
    const to = stepForCode(res.errorCode);
    if (res.errorCode === "SLOT_TAKEN" || res.errorCode === "TOO_SOON" || res.errorCode === "INVALID_TIME") setTime(null);
    if (res.errorCode === "PHONE_REQUIRED") setProfileHasPhone(false);
    toast.error(homeErrorMessage(res));
    if (to) go(to);
    return to;
  };

  const runQuote = async ({ keepTick = false } = {}) => {
    const input = quoteInput();
    if (!input) return null;
    setQuoting(true);
    setQuoteError(null);
    const res = await quoteHomeBooking(input);
    setQuoting(false);
    if (!res.success || !res.data) {
      if (!bounce(res)) setQuoteError(homeErrorMessage(res));
      return null;
    }
    setQuote(res.data);
    if (!keepTick) setAccepted(false);
    // A new quote is a new attempt: a fresh key.
    createKey.current = crypto.randomUUID();
    track("home_quote", trackSide(expert.audience));
    return res.data;
  };

  const toReview = async () => {
    if (!profileHasPhone) {
      setSavingPhone(true);
      const saved = await updateMyPhone(normalizePhone(address.contactPhone));
      setSavingPhone(false);
      if (!saved.success) {
        toast.error(saved.message || "Couldn't save your mobile number.");
        return;
      }
      setProfileHasPhone(true);
    }
    go("review");
    await runQuote();
  };

  const book = async (method: ProviderId | "WALLET") => {
    const input = quoteInput();
    if (!input || !quote) return;
    setCreating(true);
    const res = await createHomeBooking(
      {
        ...input,
        quoteHash: quote.quoteHash,
        policyAccepted: quote.requiresAcceptance ? accepted : true,
        policyVersion: quote.policyVersion,
        lang,
      },
      createKey.current ?? (createKey.current = crypto.randomUUID()),
    );
    if (!res.success || !res.data) {
      setCreating(false);
      if (res.errorCode === "POLICY_CHANGED") {
        await runQuote();
        toast.warning("The cancellation rule changed — please read it again");
      } else if (res.errorCode === "PRICE_CHANGED") {
        const fresh = await runQuote({ keepTick: true });
        if (fresh) toast.warning(`The price changed — the total is now ${formatBDT(fresh.totalMinor)}`);
      } else if (res.errorCode === "PAYMENT_PENDING_EXISTS") {
        toast.error(homeErrorMessage(res), {
          action: { label: "My bookings", onClick: () => router.push("/dashboard/home-bookings") },
        });
      } else {
        bounce(res);
      }
      return;
    }
    const booking = res.data;
    track("home_booking_created", trackSide(expert.audience));
    if (address.save && !address.savedId && address.lat != null && address.lng != null) {
      // Best effort: the booking already holds its own copy of the address.
      void createHomeAddress({
        label: address.label.trim() || "Home",
        addressLine: input.addressLine,
        area: input.area ?? null,
        landmark: input.landmark ?? null,
        latitude: address.lat,
        longitude: address.lng,
      });
    }
    const outcome = await pay(booking.id, expert.audience, method);
    if (outcome.kind === "redirecting") return;
    setCreating(false);
    // Paid, or still waiting for payment: the visit's page carries on (with the countdown).
    router.push(`/home-service/booking/${encodeURIComponent(booking.id)}`);
  };

  // ------------------------------------------------------------- per step

  const canNext: Record<BookStep, boolean> = {
    services: items.length > 0 && belowMin === 0,
    expert: true,
    date: Boolean(dayInfo?.hasSlots),
    time: Boolean(slot),
    address: addressProblem(address, expert.audience) === null && !timeGone,
    review: false,
  };
  const blocker =
    step === "services" && items.length > 0 && belowMin > 0
      ? `Add ${formatBDT(belowMin)} more: the minimum order is ${formatBDT(expert.salon.minOrderMinor)}.`
      : step === "address"
        ? addressProblem(address, expert.audience)
        : null;

  const next = () => {
    if (step === "address") return void toReview();
    go(STEPS[index + 1].key);
  };

  const loginHref = () => {
    const q = new URLSearchParams(window.location.search);
    q.set("step", "address");
    return `/login?redirect=${encodeURIComponent(`/home-service/book?${q.toString()}`)}`;
  };

  const primary = (() => {
    if (step === "review") return null;
    if (index === OPEN_STEPS - 1 && !isCustomer) {
      if (!viewer.role) {
        return (
          <Button
            className="h-11 w-full"
            disabled={!canNext.time}
            onClick={() => router.push(loginHref())}
          >
            <LogIn aria-hidden /> Continue to book
          </Button>
        );
      }
      return (
        <div className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">Sign in with a customer account to book.</p>
          <form action={signOutTo}>
            <input type="hidden" name="returnTo" value={`/home-service/book?${new URLSearchParams({ expert: expert.id, items: items.join(","), ...(date ? { date } : {}), ...(time ? { time } : {}), step: "address" }).toString()}`} />
            <Button type="submit" variant="outline" className="h-11 w-full">
              Switch to a customer account
            </Button>
          </form>
        </div>
      );
    }
    return (
      <Button className="h-11 w-full" disabled={!canNext[step] || savingPhone} onClick={next}>
        {savingPhone && <Loader2 className="animate-spin" aria-hidden />}
        {step === "address" ? "Review booking" : "Continue"} <ArrowRight aria-hidden />
      </Button>
    );
  })();

  const summary = (
    <Summary
      expert={expert}
      any={any}
      chosen={chosen}
      minutes={minutes}
      date={date}
      dayLabel={dayInfo?.label}
      timeLabel={slot?.label ?? (time ? timeText(time) : null)}
      travelFee={quote?.travelFeeMinor ?? travelFee}
      total={quote?.totalMinor ?? subtotal + travelFee}
    />
  );

  return (
    <div className="container mx-auto px-4 pt-6 pb-36 sm:px-6 md:py-10 lg:px-8">
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-2">
          {index > 0 ? (
            <Button variant="ghost" size="sm" className="-ml-3" onClick={() => go(STEPS[index - 1].key)}>
              <ArrowLeft aria-hidden /> Back
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="-ml-3" asChild>
              <Link href={`/home-service/experts/${expert.id}`}>
                <ArrowLeft aria-hidden /> {expert.name}
              </Link>
            </Button>
          )}
        </div>
        <div>
          <p className="text-overline font-semibold uppercase tracking-[0.06em] text-primary">{side.title}</p>
          <h1 className="font-display text-title-lg text-foreground">Book a home visit</h1>
        </div>
        <Stepper index={index} onPick={(i) => i < index && go(STEPS[i].key)} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          {step === "services" && (
            <Panel title="Pick services" hint="Choose one or more. The total time and price update as you go.">
              <ServicesList menu={expert.menu} items={items} onToggle={toggleItem} />
              {blocker && <p className="text-sm font-medium text-warning">{blocker}</p>}
            </Panel>
          )}

          {step === "expert" && (
            <Panel title="Who comes to you?">
              <div role="radiogroup" aria-label="Expert" className="grid gap-3 sm:grid-cols-2">
                <Choice on={!any} onClick={() => (setAny(false), setTime(null), setQuote(null))}>
                  <ExpertAvatar name={expert.name} photo={expert.photo} className="size-12" />
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground">{expert.name}</span>
                    <RatingLine rating={expert.rating} reviews={expert.totalReviews} />
                  </span>
                </Choice>
                <Choice on={any} onClick={() => (setAny(true), setTime(null), setQuote(null))}>
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                    <Users className="size-6" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground">Any available expert</span>
                    <span className="block text-sm text-muted-foreground">
                      A verified expert from {expert.salon.name} who&apos;s free at your time
                    </span>
                  </span>
                </Choice>
              </div>
            </Panel>
          )}

          {step === "date" && (
            <Panel title="Pick a day">
              {days.data?.outOfArea && (
                <p className="text-sm text-warning">Your saved location looks outside this salon&apos;s area. You can still pick a time; we check your address before you pay.</p>
              )}
              <DayChips
                days={days.data?.days ?? null}
                loading={days.loading}
                error={days.error}
                value={date}
                onChange={(d) => (setDate(d), setTime(null), setQuote(null))}
              />
            </Panel>
          )}

          {step === "time" && (
            <Panel title={date ? `Pick a time on ${dayInfo?.label ?? dayText(date)}` : "Pick a time"}>
              <TimeGroups
                slots={date ? times.data : null}
                loading={times.loading}
                error={times.error}
                value={time}
                onChange={(s) => (setTime(s.startAt), setQuote(null))}
              />
            </Panel>
          )}

          {timeGone && (step === "address" || step === "review") && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-warning-soft p-4 text-sm text-warning">
              That time was just taken. Pick another one.
              <Button size="sm" variant="outline" onClick={() => (setTime(null), setQuote(null), go("time"))}>
                Pick a time
              </Button>
            </div>
          )}

          {step === "address" && isCustomer && (
            <Panel title="Where should the expert come?">
              <AddressStep
                draft={address}
                onChange={(patch) => (setAddress((d) => ({ ...d, ...patch })), setQuote(null))}
                saved={viewer.addresses}
                audience={expert.audience}
                profileHasPhone={profileHasPhone}
                fallbackCenter={point ?? undefined}
              />
              {blocker && <p className="text-sm text-muted-foreground">{blocker}</p>}
            </Panel>
          )}

          {step === "review" && isCustomer && (
            <Review
              quote={quote}
              quoting={quoting}
              error={quoteError}
              onRetry={() => void runQuote()}
              accepted={accepted}
              onAccepted={setAccepted}
              lang={lang}
              onLang={setLang}
              pay={
                quote && (
                  <PayPanel
                    advanceMinor={quote.advanceMinor}
                    walletMinor={viewer.walletMinor}
                    methods={methods}
                    pending={creating || paying}
                    disabled={quoting || timeGone || (quote.requiresAcceptance && !accepted)}
                    onPay={(m) => void book(m)}
                    hint={
                      quote.requiresAcceptance && !accepted
                        ? "Tick “I understand” above to pay."
                        : `We hold this time for ${quote.paymentWindowMinutes} minutes while you pay.`
                    }
                  />
                )
              }
            />
          )}

          {(step === "address" || step === "review") && !isCustomer && (
            <Panel title="Sign in to book">
              <p className="text-sm text-muted-foreground">Booking needs a customer account.</p>
            </Panel>
          )}
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <div className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
            {summary}
            {primary}
          </div>
        </aside>
      </div>

      {/* Phones: the running total and the step's action stay under the thumb. */}
      {step !== "review" && (
        <div data-bottom-bar className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg lg:hidden">
          <div className="mx-auto flex max-w-xl flex-col gap-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">
                {items.length ? `${items.length} service${items.length === 1 ? "" : "s"} · ${durationText(minutes)}` : "No services yet"}
              </span>
              <span className="font-semibold text-foreground tabular-nums">{formatBDT(subtotal + (items.length ? travelFee : 0))}</span>
            </div>
            {blocker && step === "services" && <p className="text-xs font-medium text-warning">{blocker}</p>}
            {primary}
          </div>
        </div>
      )}
      {step === "review" && <div className="mt-6 lg:hidden">{summary}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- pieces

function Stepper({ index, onPick }: { index: number; onPick: (i: number) => void }) {
  return (
    <>
      <p className="text-sm text-muted-foreground sm:hidden">
        Step {index + 1} of {STEPS.length} · <span className="font-semibold text-foreground">{STEPS[index].label}</span>
      </p>
      <ol aria-label="Booking steps" className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const state = i < index ? "done" : i === index ? "current" : "todo";
          return (
            <li
              key={s.key}
              aria-current={state === "current" ? "step" : undefined}
              className={cn("flex min-w-0 items-center gap-2", i < STEPS.length - 1 && "flex-1")}
            >
              <button
                type="button"
                disabled={state !== "done"}
                onClick={() => onPick(i)}
                aria-label={`${s.label}${state === "done" ? " (done, go back)" : ""}`}
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  state === "done" && "cursor-pointer bg-primary-soft text-primary",
                  state === "current" && "bg-primary text-primary-foreground",
                  state === "todo" && "bg-muted text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </button>
              <span
                className={cn(
                  "hidden truncate text-sm md:inline",
                  state === "current" ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <span aria-hidden className={cn("h-px min-w-2 flex-1", i < index ? "bg-primary" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        on ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-primary/60",
      )}
    >
      {children}
      {on && <Check className="absolute top-3 right-3 size-4 text-primary" aria-hidden />}
    </button>
  );
}

function ServicesList({
  menu,
  items,
  onToggle,
}: {
  menu: HomeExpertDetail["menu"];
  items: string[];
  onToggle: (id: string) => void;
}) {
  const groups = useMemo(() => {
    const byCat = new Map<string, HomeExpertDetail["menu"]>();
    for (const m of menu) byCat.set(m.category, [...(byCat.get(m.category) ?? []), m]);
    return [...byCat.entries()];
  }, [menu]);
  return (
    <div className="space-y-6">
      {groups.map(([category, list]) => (
        <div key={category}>
          <h3 className="mb-2 text-overline font-semibold uppercase tracking-[0.06em] text-primary">
            {CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL]}
          </h3>
          <ul className="divide-y divide-border/70 rounded-3xl border border-border bg-surface">
            {list.map((m) => {
              const on = items.includes(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => onToggle(m.id)}
                    className="flex w-full cursor-pointer items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface",
                      )}
                    >
                      {on && <Check className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-foreground">{m.name}</span>
                        <span className="shrink-0 font-semibold text-foreground tabular-nums">{formatBDT(m.priceMinor)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="size-4" aria-hidden /> {durationText(m.durationMin)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Summary({
  expert,
  any,
  chosen,
  minutes,
  date,
  dayLabel,
  timeLabel,
  travelFee,
  total,
}: {
  expert: HomeExpertDetail;
  any: boolean;
  chosen: HomeExpertDetail["menu"];
  minutes: number;
  date: string | null;
  dayLabel?: string;
  timeLabel: string | null;
  travelFee: number;
  total: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {any ? (
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <Users className="size-5" aria-hidden />
          </span>
        ) : (
          <ExpertAvatar name={expert.name} photo={expert.photo} className="size-11" />
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{any ? "Any available expert" : expert.name}</p>
          <p className="truncate text-sm text-muted-foreground">{expert.salon.name}</p>
        </div>
      </div>
      {(date || timeLabel) && (
        <p className="text-sm text-foreground">
          {date ? (dayLabel ?? dayText(date)) : ""}
          {timeLabel ? ` · ${timeLabel}` : ""}
        </p>
      )}
      {chosen.length > 0 ? (
        <dl className="space-y-1.5 text-sm">
          {chosen.map((m) => (
            <div key={m.id} className="flex justify-between gap-3">
              <dt className="min-w-0 truncate text-muted-foreground">{m.name}</dt>
              <dd className="tabular-nums">{formatBDT(m.priceMinor)}</dd>
            </div>
          ))}
          {travelFee > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Travel fee</dt>
              <dd className="tabular-nums">{formatBDT(travelFee)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
            <dt>
              Total <span className="font-normal text-muted-foreground">· {durationText(minutes)}</span>
            </dt>
            <dd className="tabular-nums">{formatBDT(total)}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">No services picked yet.</p>
      )}
    </div>
  );
}

function Review({
  quote,
  quoting,
  error,
  onRetry,
  accepted,
  onAccepted,
  lang,
  onLang,
  pay,
}: {
  quote: HomeQuote | null;
  quoting: boolean;
  error: string | null;
  onRetry: () => void;
  accepted: boolean;
  onAccepted: (v: boolean) => void;
  lang: "en" | "bn";
  onLang: (l: "en" | "bn") => void;
  pay: React.ReactNode;
}) {
  if (!quote) {
    return (
      <Panel title="Review & pay">
        {quoting || !error ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Checking the price and the time…
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="outline" onClick={onRetry}>
              Try again
            </Button>
          </div>
        )}
      </Panel>
    );
  }
  return (
    <Panel title="Review & pay">
      <div className={cn("space-y-3 rounded-3xl border border-border bg-surface p-4 sm:p-5", quoting && "opacity-60")}>
        <dl className="space-y-1.5 text-sm">
          {quote.items.map((it) => (
            <div key={it.id} className="flex justify-between gap-3">
              <dt className="min-w-0 text-muted-foreground">
                {it.name} <span className="text-xs">· {durationText(it.durationMin)}</span>
              </dt>
              <dd className="tabular-nums">{formatBDT(it.priceMinor)}</dd>
            </div>
          ))}
          {quote.travelFeeMinor > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Travel fee</dt>
              <dd className="tabular-nums">{formatBDT(quote.travelFeeMinor)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatBDT(quote.totalMinor)}</dd>
          </div>
        </dl>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-primary-soft p-3">
            <p className="text-xs text-muted-foreground">Pay now</p>
            <p className="text-lg font-semibold text-foreground tabular-nums">{formatBDT(quote.advanceMinor)}</p>
          </div>
          <div className="rounded-2xl bg-muted p-3">
            <p className="text-xs text-muted-foreground">Pay at home</p>
            <p className="text-lg font-semibold text-foreground tabular-nums">{formatBDT(quote.balanceMinor)}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {quote.expert ? quote.expert.name : "Any available expert"} · {dayText(quote.date)} · {timeText(quote.startAt)}–
          {timeText(quote.endAt)}
        </p>
      </div>

      <DisclaimerBox
        policy={quote.policy.policy}
        text={quote.disclaimer}
        lang={lang}
        onLangChange={onLang}
        accepted={accepted}
        onAcceptedChange={quote.requiresAcceptance ? onAccepted : undefined}
      />

      {pay}
    </Panel>
  );
}
