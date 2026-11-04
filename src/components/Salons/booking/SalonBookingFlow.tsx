"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Clock,
  House,
  Moon,
  RotateCw,
  ShieldCheck,
  Star,
  Store,
  Sun,
  Sunrise,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SafeImage from "@/components/Shared/SafeImage";
import { categoryLabel } from "@/constants/service-categories";
import { getSalonHomeMenu } from "@/services/home-service/getSalonHomeMenu";
import type {
  HomeAudience,
  HomeSalonMenu,
} from "@/services/home-service/types";
import { getSlots } from "@/services/slots/slot-api";
import { formatBDT } from "@/lib/money";
import { formatRating } from "@/lib/rating";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";

import HomeServicePicker, {
  anchorExpertFor,
  homeCartPrice,
} from "../HomeServicePicker";
import PersonAvatar from "../PersonAvatar";
import { addDaysYmd, dayKeyOf, formatClock, formatYmd } from "../salon-time";
import {
  bookingHref,
  durationText,
  windowText,
  type SalonServiceView,
  type SalonView,
} from "../salon-view";
import BookingHeader, { HOME_STEPS, SALON_STEPS } from "./BookingHeader";

type Mode = "SALON" | "HOME";
type Step = "service" | "time";

type Slot = {
  id: string;
  startTime: string;
  endTime?: string;
  counterId?: string | null;
};
type Option = { slotId: string; counterId: string; specific: boolean };
type TimeRow = { startTime: string; endTime?: string; options: Option[] };
type Loaded<T> = { key: string; data: T | null; error: string | null };

/** Online booking opens five days ahead, today included. */
const BOOKABLE_DAYS = 5;

const PERIODS = [
  { key: "MORNING", label: "Morning", icon: Sunrise },
  { key: "AFTERNOON", label: "Afternoon", icon: Sun },
  { key: "EVENING", label: "Evening", icon: Moon },
] as const;
const periodOf = (t: string) => {
  const h = Number(t.split(":")[0]);
  return h < 12 ? "MORNING" : h < 17 ? "AFTERNOON" : "EVENING";
};

export type BookingFlowInitial = {
  serviceId?: string;
  staffId?: string;
  date?: string;
  notes?: string;
  step?: string;
  mode?: string;
};

/**
 * Choosing a salon booking, as a page: the service, then who / when, then on
 * to the review page (`/salons/:id/book?slot=…`), which signs the visitor in
 * if needed and confirms. "At home" picks the services here and hands off to
 * the Home Service flow at its date step.
 */
export default function SalonBookingFlow({
  salon,
  today,
  takesDeposit,
  signedIn,
  initial,
}: {
  salon: SalonView;
  /** Dhaka's YYYY-MM-DD from the server, so the strip matches the slots' calendar. */
  today: string;
  takesDeposit: boolean;
  signedIn: boolean;
  initial: BookingFlowInitial;
}) {
  const router = useRouter();
  const services = salon.services;
  const home = salon.homeService;

  // ---------------------------------------------------------------- state
  const startService = services.some((s) => s.id === initial.serviceId)
    ? initial.serviceId!
    : "";
  const [mode, setMode] = useState<Mode>(
    home && (initial.mode === "home" || services.length === 0)
      ? "HOME"
      : "SALON",
  );
  const [step, setStep] = useState<Step>(
    startService && initial.step === "time" ? "time" : "service",
  );
  const [serviceId, setServiceId] = useState(startService);
  const [staffId, setStaffId] = useState(
    salon.staff.some((m) => m.id === initial.staffId) ? initial.staffId! : "",
  );
  const lastDay = addDaysYmd(today, BOOKABLE_DAYS - 1);
  const [date, setDate] = useState(
    initial.date &&
      /^\d{4}-\d{2}-\d{2}$/.test(initial.date) &&
      initial.date >= today &&
      initial.date <= lastDay
      ? initial.date
      : today,
  );
  const [time, setTime] = useState<string | null>(null);
  const [counterPref, setCounterPref] = useState("");
  const [notes, setNotes] = useState((initial.notes ?? "").slice(0, 500));
  const [navigating, setNavigating] = useState(false);
  const isHome = mode === "HOME" && Boolean(home);
  const service = services.find((s) => s.id === serviceId);

  useEffect(() => {
    track("booking_started");
  }, []);

  // The address bar follows the choices, so a reload or a shared link resumes here.
  useEffect(() => {
    const href = isHome
      ? bookingHref(salon.id, { mode: "home" })
      : bookingHref(salon.id, {
          service: serviceId || undefined,
          staff: staffId || undefined,
          date: date !== today ? date : undefined,
          step: step === "time" ? "time" : undefined,
        });
    window.history.replaceState(window.history.state, "", href);
  }, [isHome, salon.id, serviceId, staffId, date, step, today]);

  const goStep = (next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------------------------------------------------------------- slots
  const [slotNonce, setSlotNonce] = useState(0);
  const [slotsRes, setSlotsRes] = useState<Loaded<Slot[]> | null>(null);
  const slotsKey =
    !isHome && step === "time" && serviceId
      ? `${serviceId}|${date}|${slotNonce}`
      : null;
  useEffect(() => {
    if (!slotsKey) return;
    let live = true;
    const fail = "We couldn't load the free times. Please try again.";
    getSlots({
      salonId: salon.id,
      date,
      status: "AVAILABLE",
      serviceId,
      upcomingOnly: true,
    })
      .then((res) => {
        if (!live) return;
        setSlotsRes(
          res?.success && Array.isArray(res.data)
            ? { key: slotsKey, data: res.data, error: null }
            : { key: slotsKey, data: null, error: fail },
        );
      })
      .catch(
        () => live && setSlotsRes({ key: slotsKey, data: null, error: fail }),
      );
    return () => {
      live = false;
    };
  }, [slotsKey, salon.id, date, serviceId]);
  const slotsLoading = Boolean(slotsKey) && slotsRes?.key !== slotsKey;
  const slotsError = !slotsLoading ? (slotsRes?.error ?? null) : null;

  // Every start time, with the counters it can be booked on. A slot made for
  // one counter is only that counter's; an unassigned one fits any of them.
  const allTimes = useMemo<TimeRow[]>(() => {
    if (slotsLoading || !slotsRes?.data) return [];
    const ids = new Set(salon.counters.map((c) => c.id));
    const rows = new Map<string, TimeRow>();
    for (const s of slotsRes.data) {
      const row = rows.get(s.startTime) ?? {
        startTime: s.startTime,
        endTime: s.endTime,
        options: [],
      };
      const targets = s.counterId
        ? ids.has(s.counterId)
          ? [s.counterId]
          : []
        : [...ids];
      for (const counterId of targets) {
        const at = row.options.findIndex((o) => o.counterId === counterId);
        const option = {
          slotId: s.id,
          counterId,
          specific: Boolean(s.counterId),
        };
        if (at === -1) row.options.push(option);
        else if (!row.options[at].specific && option.specific)
          row.options[at] = option;
      }
      if (row.options.length) rows.set(s.startTime, row);
    }
    return [...rows.values()].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
  }, [slotsLoading, slotsRes, salon.counters]);

  const countersWithTimes = salon.counters.filter((c) =>
    allTimes.some((t) => t.options.some((o) => o.counterId === c.id)),
  );
  const activePref = countersWithTimes.some((c) => c.id === counterPref)
    ? counterPref
    : "";
  const times = activePref
    ? allTimes.filter((t) => t.options.some((o) => o.counterId === activePref))
    : allTimes;
  const chosen = useMemo(() => {
    const row = times.find((t) => t.startTime === time);
    if (!row) return null;
    const opts = row.options.filter(
      (o) => !activePref || o.counterId === activePref,
    );
    return {
      row,
      option:
        [...opts].sort((a, b) => Number(b.specific) - Number(a.specific))[0] ??
        null,
    };
  }, [times, time, activePref]);
  const chosenCounter = chosen?.option
    ? salon.counters.find((c) => c.id === chosen.option!.counterId)
    : undefined;

  // ---------------------------------------------------------------- home
  const defaultAudience: HomeAudience =
    home?.ladies && home?.gents
      ? salon.audience === "GENTS"
        ? "GENTS"
        : "LADIES"
      : home?.gents
        ? "GENTS"
        : "LADIES";
  const [audience, setAudience] = useState<HomeAudience>(defaultAudience);
  const [homeItems, setHomeItems] = useState<string[]>([]);
  const [homeProblem, setHomeProblem] = useState<string | null>(null);
  const [homeNonce, setHomeNonce] = useState(0);
  const [homeRes, setHomeRes] = useState<Loaded<HomeSalonMenu> | null>(null);
  const homeKey = isHome ? `${audience}|${homeNonce}` : null;
  useEffect(() => {
    if (!homeKey) return;
    let live = true;
    getSalonHomeMenu(salon.id, audience).then((res) => {
      if (!live) return;
      setHomeRes(
        res.success && res.data
          ? { key: homeKey, data: res.data, error: null }
          : {
              key: homeKey,
              data: null,
              error:
                res.message || "Home service isn't available here right now.",
            },
      );
    });
    return () => {
      live = false;
    };
  }, [homeKey, salon.id, audience]);
  const homeLoading = Boolean(homeKey) && homeRes?.key !== homeKey;
  const homeMenu = !homeLoading ? (homeRes?.data ?? null) : null;
  // Only what this side still offers counts.
  const items = homeMenu
    ? homeItems.filter((id) => homeMenu.menu.some((m) => m.id === id))
    : [];
  const homePrice = homeCartPrice(homeMenu, items);

  const continueHome = () => {
    if (!homeMenu) return;
    if (!items.length) return setHomeProblem("Pick at least one service.");
    if (homePrice.belowMinMinor > 0) return;
    const anchor = anchorExpertFor(homeMenu, items);
    if (!anchor) {
      return setHomeProblem(
        "No one expert here does all of these in one visit. Remove a service to continue.",
      );
    }
    track(
      "home_side_select",
      audience === "LADIES" ? "audience:ladies" : "audience:gents",
    );
    setNavigating(true);
    router.push(
      `/home-service/book?${new URLSearchParams({ expert: anchor.id, any: "1", items: items.join(","), step: "date" })}`,
    );
  };

  // ---------------------------------------------------------------- actions
  const pickService = (id: string) => {
    setServiceId(id);
    setTime(null);
  };
  const pickDate = (ymd: string) => {
    setDate(ymd);
    setTime(null);
  };
  const review = () => {
    if (!service || !chosen?.option) return;
    const q = new URLSearchParams({
      service: service.id,
      counter: chosen.option.counterId,
      slot: chosen.option.slotId,
      date,
    });
    if (staffId) q.set("staff", staffId);
    if (notes.trim()) q.set("notes", notes.trim());
    setNavigating(true);
    router.push(`/salons/${salon.id}/book?${q}`);
  };

  const primary = isHome
    ? {
        label: "Choose date & time",
        onClick: continueHome,
        disabled:
          homeLoading ||
          !homeMenu ||
          !items.length ||
          homePrice.belowMinMinor > 0,
        hint: !items.length ? "Pick one or more services." : null,
      }
    : step === "service"
      ? {
          label: "Continue",
          onClick: () => goStep("time"),
          disabled: !service,
          hint: !service ? "Pick a service to continue." : null,
        }
      : {
          label: "Review booking",
          onClick: review,
          disabled: !chosen?.option,
          hint: !chosen?.option ? "Pick a time to continue." : null,
        };

  const stepIndex = isHome ? 0 : step === "service" ? 0 : 1;
  const steps = isHome
    ? HOME_STEPS.map((label) => ({ label }))
    : SALON_STEPS.map((label, i) => ({
        label,
        onClick: i === 0 ? () => goStep("service") : undefined,
      }));

  const strip = useMemo(
    () => Array.from({ length: BOOKABLE_DAYS }, (_, i) => addDaysYmd(today, i)),
    [today],
  );

  // ---------------------------------------------------------------- view
  return (
    <div className="min-h-[70vh] bg-surface-subtle pb-[calc(9rem+env(safe-area-inset-bottom))] lg:pb-16">
      <BookingHeader
        overline={salon.name}
        title={
          isHome
            ? "Book a home visit"
            : step === "service"
              ? "Choose a service"
              : "Pick a date & time"
        }
        steps={steps}
        current={stepIndex}
        back={
          !isHome && step === "time"
            ? { label: "Back to services", onClick: () => goStep("service") }
            : { label: `Back to ${salon.name}`, href: `/salons/${salon.id}` }
        }
      />

      <div className="container mx-auto px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <div className="min-w-0 space-y-6">
            {/* WHERE: only when the branch also comes to homes. */}
            {home && services.length > 0 && (isHome || step === "service") && (
              <Card>
                <div
                  role="radiogroup"
                  aria-label="Where"
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <Choice
                    on={!isHome}
                    onClick={() => setMode("SALON")}
                    icon={Store}
                    title="At the salon"
                    hint="Visit the salon at your time"
                  />
                  <Choice
                    on={isHome}
                    onClick={() => {
                      setMode("HOME");
                      setHomeProblem(null);
                    }}
                    icon={House}
                    title="At home"
                    hint={
                      homeMenu
                        ? `An expert comes to you · ${homeMenu.advancePercent}% advance`
                        : "An expert comes to you · pay an advance"
                    }
                  />
                </div>
              </Card>
            )}

            {isHome && home ? (
              <Card
                title="Pick services for your home visit"
                hint="Choose one or more. The total and advance update as you go."
              >
                <HomeServicePicker
                  sides={home}
                  audience={audience}
                  onAudience={(a) => {
                    setAudience(a);
                    setHomeProblem(null);
                  }}
                  menu={homeMenu}
                  loading={homeLoading}
                  error={!homeLoading ? (homeRes?.error ?? null) : null}
                  onRetry={() => setHomeNonce((n) => n + 1)}
                  items={items}
                  onItems={(next) => {
                    setHomeItems(next);
                    setHomeProblem(null);
                  }}
                  problem={homeProblem}
                />
              </Card>
            ) : step === "service" ? (
              <Card
                title="Services"
                hint="Pick one service. You'll choose the time next."
              >
                <ServicePicker
                  services={services}
                  value={serviceId}
                  onChange={pickService}
                />
              </Card>
            ) : (
              <>
                {salon.staff.length > 0 && (
                  <Card
                    title="Specialist"
                    hint="Optional. Choose anyone for the most free times."
                  >
                    <div
                      role="radiogroup"
                      aria-label="Specialist"
                      className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3"
                    >
                      <StaffChip
                        on={!staffId}
                        onClick={() => setStaffId("")}
                        name="Anyone available"
                        sub="First free specialist"
                      >
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-subtle text-foreground">
                          <Users className="size-5" aria-hidden />
                        </span>
                      </StaffChip>
                      {salon.staff.map((m) => (
                        <StaffChip
                          key={m.id}
                          on={staffId === m.id}
                          onClick={() => setStaffId(m.id)}
                          name={m.name}
                          sub={m.speciality || "Specialist"}
                          rating={m.totalReviews > 0 ? m.rating : null}
                        >
                          <PersonAvatar
                            name={m.name}
                            photo={m.photo}
                            className="size-11 text-sm"
                          />
                        </StaffChip>
                      ))}
                    </div>
                  </Card>
                )}

                <Card
                  title="Date"
                  hint={formatYmd(date, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                >
                  <div
                    role="group"
                    aria-label="Day"
                    className="grid grid-cols-5 gap-2 sm:flex"
                  >
                    {strip.map((d, i) => (
                      <DayChip
                        key={d}
                        ymd={d}
                        isToday={d === today}
                        isTomorrow={i === 1}
                        closed={
                          salon.closures.some(
                            (c) => c.date === d && c.allDay,
                          ) ||
                          (Object.keys(salon.operatingHours).length > 0 &&
                            !salon.operatingHours[dayKeyOf(d)]?.open)
                        }
                        on={d === date}
                        onClick={() => pickDate(d)}
                      />
                    ))}
                  </div>
                </Card>

                <Card
                  title="Time"
                  hint="Only times that are free are shown. All times are Bangladesh time."
                  action={
                    slotsError ? undefined : (
                      <button
                        type="button"
                        onClick={() => setSlotNonce((n) => n + 1)}
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Refresh times"
                      >
                        <RotateCw
                          className={cn(
                            "size-4",
                            slotsLoading && "animate-spin",
                          )}
                          aria-hidden
                        />
                        <span className="hidden sm:inline">Refresh</span>
                      </button>
                    )
                  }
                >
                  {countersWithTimes.length > 1 && (
                    <div
                      role="radiogroup"
                      aria-label="Counter"
                      className="mb-5 flex flex-wrap gap-2"
                    >
                      {[
                        { id: "", name: "Any counter", code: null },
                        ...countersWithTimes,
                      ].map((c) => (
                        <button
                          key={c.id || "any"}
                          type="button"
                          role="radio"
                          aria-checked={activePref === c.id}
                          onClick={() => {
                            setCounterPref(c.id);
                            setTime(null);
                          }}
                          className={cn(
                            "inline-flex h-9 items-center rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            activePref === c.id
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-surface text-foreground hover:bg-muted",
                          )}
                        >
                          {c.name}
                          {c.code ? (
                            <span className="ml-1 font-normal opacity-70">
                              ({c.code})
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  )}
                  <TimeGrid
                    loading={slotsLoading}
                    error={slotsError}
                    times={times}
                    value={time}
                    onRetry={() => setSlotNonce((n) => n + 1)}
                    onPick={(t) => {
                      setTime(t);
                      track("slot_selected");
                    }}
                    onNextDay={() => pickDate(addDaysYmd(date, 1))}
                    canNextDay={addDaysYmd(date, 1) <= lastDay}
                  />
                </Card>

                <Card
                  title="Note for the salon"
                  hint="Optional. Allergies, a style you like, anything they should know."
                >
                  <label htmlFor="booking-notes" className="sr-only">
                    Note for the salon
                  </label>
                  <textarea
                    id="booking-notes"
                    value={notes}
                    maxLength={500}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Please keep the length, just a trim."
                    className="min-h-24 w-full rounded-2xl border border-input bg-surface px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 md:text-sm"
                  />
                  <p className="mt-1 text-right text-xs text-muted-foreground tabular-nums">
                    {notes.length}/500
                  </p>
                </Card>
              </>
            )}
          </div>

          {/* SUMMARY: sticky beside the steps on desktop. */}
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <div className="rounded-3xl border border-border bg-surface p-5 shadow-card">
              <Summary
                salon={salon}
                isHome={isHome}
                service={service}
                staffName={salon.staff.find((m) => m.id === staffId)?.name}
                date={step === "time" ? date : null}
                timeLabel={chosen ? formatClock(chosen.row.startTime) : null}
                counterName={
                  countersWithTimes.length > 1 ? chosenCounter?.name : undefined
                }
                homePrice={isHome ? homePrice : null}
                takesDeposit={takesDeposit}
                onChangeService={
                  !isHome && step === "time"
                    ? () => goStep("service")
                    : undefined
                }
              />
              <Button
                className="mt-5 w-full"
                onClick={primary.onClick}
                disabled={primary.disabled}
                loading={navigating}
              >
                {primary.label}
                {!navigating && <ArrowRight aria-hidden />}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {primary.hint ??
                  (isHome
                    ? "Next: date, time and your address."
                    : step === "time"
                      ? signedIn
                        ? "You'll check everything before you confirm."
                        : "You'll sign in and check everything before you confirm."
                      : "Nothing is booked until you confirm.")}
              </p>
            </div>
            {!isHome && (
              <Assurance
                takesDeposit={takesDeposit}
                windowMin={salon.cancellationWindowMin}
                className="mt-4"
              />
            )}
          </aside>
        </div>
      </div>

      {/* PHONES: the running choice and the step's action stay under the thumb. */}
      <div
        data-bottom-bar
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg lg:hidden"
      >
        <div className="mx-auto flex max-w-xl flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-muted-foreground">
              {isHome
                ? items.length
                  ? `${items.length} service${items.length === 1 ? "" : "s"} · ${durationText(homePrice.minutes)}`
                  : "No services yet"
                : service
                  ? [
                      service.name,
                      chosen
                        ? `${formatYmd(date, { weekday: "short", day: "numeric", month: "short" })}, ${formatClock(chosen.row.startTime)}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "No service yet"}
            </span>
            <span className="shrink-0 font-semibold text-foreground tabular-nums">
              {isHome
                ? items.length
                  ? formatBDT(homePrice.totalMinor)
                  : ""
                : typeof service?.priceMinor === "number"
                  ? formatBDT(service.priceMinor)
                  : ""}
            </span>
          </div>
          <Button
            className="w-full"
            onClick={primary.onClick}
            disabled={primary.disabled}
            loading={navigating}
          >
            {primary.label}
            {!navigating && <ArrowRight aria-hidden />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- pieces

function Card({
  title,
  hint,
  action,
  children,
}: {
  title?: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-4 sm:p-6">
      {title && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-section font-semibold text-foreground">
              {title}
            </h2>
            {hint && (
              <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Choice({
  on,
  onClick,
  icon: Icon,
  title,
  hint,
}: {
  on: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        on
          ? "border-primary bg-primary-soft ring-1 ring-primary"
          : "border-border bg-surface hover:border-primary/60",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-5 shrink-0",
          on ? "text-primary-hover" : "text-muted-foreground",
        )}
      />
      <span className="min-w-0">
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="block text-sm text-muted-foreground">{hint}</span>
      </span>
      {on && (
        <Check
          className="absolute top-3 right-3 size-4 text-primary-hover"
          aria-hidden
        />
      )}
    </button>
  );
}

function ServicePicker({
  services,
  value,
  onChange,
}: {
  services: SalonServiceView[];
  value: string;
  onChange: (id: string) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, SalonServiceView[]>();
    for (const s of services)
      map.set(s.category, [...(map.get(s.category) ?? []), s]);
    return [...map.entries()];
  }, [services]);

  return (
    <div role="radiogroup" aria-label="Service" className="space-y-6">
      {groups.map(([cat, list]) => (
        <div key={cat}>
          {groups.length > 1 && (
            <h3 className="mb-2 text-overline font-semibold tracking-[0.06em] text-primary uppercase">
              {categoryLabel(cat)}
            </h3>
          )}
          <div className="space-y-2">
            {list.map((s) => {
              const on = s.id === value;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onChange(s.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on
                      ? "border-primary bg-primary-soft ring-1 ring-primary"
                      : "border-border bg-surface hover:border-primary/60",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {on && <Check className="size-3" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-foreground">
                        {s.name}
                      </span>
                      {typeof s.priceMinor === "number" && (
                        <span className="shrink-0 font-semibold text-foreground tabular-nums">
                          {formatBDT(s.priceMinor)}
                        </span>
                      )}
                    </span>
                    {s.description && (
                      <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
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
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** One specialist as a radio card: photo, full name, role, rating. */
function StaffChip({
  on,
  onClick,
  name,
  sub,
  rating = null,
  children,
}: {
  on: boolean;
  onClick: () => void;
  name: string;
  sub: string;
  rating?: number | null;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex min-h-[4.5rem] w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        on
          ? "border-primary bg-primary-soft/60 ring-1 ring-primary"
          : "border-border bg-surface hover:border-primary/50 hover:bg-surface-subtle",
      )}
    >
      {children}
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-sm font-semibold text-foreground"
          title={name}
        >
          {name}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{sub}</span>
          {rating !== null && (
            <span className="inline-flex shrink-0 items-center gap-0.5 font-medium text-foreground">
              <span aria-hidden className="text-muted-foreground">
                ·
              </span>
              <Star className="size-3 fill-gold text-gold" aria-hidden />
              {formatRating(rating)}
            </span>
          )}
        </span>
      </span>
      <span
        aria-hidden
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
          on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface",
        )}
      >
        {on && <Check className="size-3" strokeWidth={3} />}
      </span>
    </button>
  );
}

function DayChip({
  ymd,
  isToday,
  isTomorrow,
  closed,
  on,
  onClick,
}: {
  ymd: string;
  isToday: boolean;
  isTomorrow: boolean;
  closed: boolean;
  on: boolean;
  onClick: () => void;
}) {
  const top = isToday ? "Today" : formatYmd(ymd, { weekday: "short" });
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${isToday ? "Today, " : isTomorrow ? "Tomorrow, " : ""}${formatYmd(ymd, { weekday: "long", day: "numeric", month: "long" })}${closed ? " (usually closed)" : ""}`}
      onClick={onClick}
      className={cn(
        "flex h-16 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[4.25rem]",
        on
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : closed
            ? "border-dashed border-border bg-surface-subtle text-muted-foreground hover:border-primary/40"
            : "border-border bg-surface text-foreground hover:border-primary/60 hover:bg-primary-soft",
      )}
    >
      <span
        className={cn(
          "text-[11px] leading-none font-medium tracking-wide uppercase",
          on ? "text-primary-foreground/90" : "text-muted-foreground",
        )}
      >
        {top}
      </span>
      <span className="text-lg leading-none font-semibold tabular-nums">
        {formatYmd(ymd, { day: "numeric" })}
      </span>
      {closed && (
        <span
          className={cn(
            "text-[10px] leading-none",
            on ? "text-primary-foreground/85" : "text-muted-foreground",
          )}
        >
          Closed
        </span>
      )}
    </button>
  );
}

function TimeGrid({
  loading,
  error,
  times,
  value,
  onPick,
  onRetry,
  onNextDay,
  canNextDay,
}: {
  loading: boolean;
  error: string | null;
  times: TimeRow[];
  value: string | null;
  onPick: (t: string) => void;
  onRetry: () => void;
  onNextDay: () => void;
  canNextDay: boolean;
}) {
  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading free times"
        className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-6"
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-11 rounded-full" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-2xl bg-warning-soft p-4 text-sm text-warning"
      >
        <p className="font-medium">{error}</p>
        <Button
          size="sm"
          variant="secondary"
          className="mt-3"
          onClick={onRetry}
        >
          <RotateCw aria-hidden /> Try again
        </Button>
      </div>
    );
  }
  if (times.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center">
        <p className="font-semibold text-foreground">
          No free times on this day
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {canNextDay
            ? "Try another day. Times open up as the salon adds them."
            : `Online booking opens ${BOOKABLE_DAYS} days ahead. Try an earlier day, or check back tomorrow.`}
        </p>
        {canNextDay && (
          <Button
            size="sm"
            variant="secondary"
            className="mt-4"
            onClick={onNextDay}
          >
            Next day <ArrowRight aria-hidden />
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {PERIODS.map(({ key, label, icon: Icon }) => {
        const group = times.filter((t) => periodOf(t.startTime) === key);
        if (!group.length) return null;
        return (
          <div key={key}>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Icon className="size-4 text-muted-foreground" aria-hidden />{" "}
              {label}
              <span className="font-normal text-muted-foreground">
                · {group.length}
              </span>
            </p>
            <div
              role="radiogroup"
              aria-label={`${label} times`}
              className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
            >
              {group.map((t) => {
                const on = t.startTime === value;
                return (
                  <button
                    key={t.startTime}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => onPick(t.startTime)}
                    className={cn(
                      "h-10 rounded-full border text-sm font-semibold whitespace-nowrap tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface text-foreground hover:border-primary/60 hover:bg-primary-soft",
                    )}
                  >
                    {formatClock(t.startTime)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Summary({
  salon,
  isHome,
  service,
  staffName,
  date,
  timeLabel,
  counterName,
  homePrice,
  takesDeposit,
  onChangeService,
}: {
  salon: SalonView;
  isHome: boolean;
  service?: SalonServiceView;
  staffName?: string;
  date: string | null;
  timeLabel: string | null;
  counterName?: string;
  homePrice: ReturnType<typeof homeCartPrice> | null;
  takesDeposit: boolean;
  onChangeService?: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
          <SafeImage
            src={salon.images[0] ?? null}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{salon.name}</p>
          <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
            {salon.totalReviews > 0 && (
              <>
                <Star className="size-3.5 fill-gold text-gold" aria-hidden />
                <span className="font-medium text-foreground">
                  {formatRating(salon.rating)}
                </span>
                <span aria-hidden>·</span>
              </>
            )}
            <span className="truncate">{salon.area || salon.city || ""}</span>
          </p>
        </div>
      </div>

      {isHome && homePrice ? (
        <dl className="space-y-2 pt-4 text-sm">
          {homePrice.chosen.length === 0 ? (
            <p className="text-muted-foreground">No services picked yet.</p>
          ) : (
            <>
              {homePrice.chosen.map((m) => (
                <div key={m.id} className="flex justify-between gap-3">
                  <dt className="min-w-0 truncate text-muted-foreground">
                    {m.name}
                  </dt>
                  <dd className="tabular-nums">{formatBDT(m.priceMinor)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Travel fee</dt>
                <dd className="tabular-nums">
                  {homePrice.travelFeeMinor > 0
                    ? formatBDT(homePrice.travelFeeMinor)
                    : "Free"}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold text-foreground">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  {formatBDT(homePrice.totalMinor)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 text-primary-hover">
                <dt>Advance now ({homePrice.advancePercent}%)</dt>
                <dd className="font-semibold tabular-nums">
                  {formatBDT(homePrice.advanceMinor)}
                </dd>
              </div>
            </>
          )}
        </dl>
      ) : (
        <>
          <dl className="space-y-3 py-4 text-sm">
            <Row label="Service">
              {service ? (
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground">
                      {service.name}
                    </span>
                    {service.duration ? (
                      <span className="text-muted-foreground">
                        {durationText(service.duration)}
                      </span>
                    ) : null}
                  </span>
                  {onChangeService && (
                    <button
                      type="button"
                      onClick={onChangeService}
                      className="shrink-0 text-sm font-semibold text-primary-hover underline-offset-4 hover:underline"
                    >
                      Change
                    </button>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">Not chosen yet</span>
              )}
            </Row>
            <Row label="Specialist">
              <span className="text-foreground">
                {staffName ?? "Anyone available"}
              </span>
            </Row>
            <Row label="Date & time">
              {date && timeLabel ? (
                <span className="font-semibold text-foreground">
                  {formatYmd(date, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                  , {timeLabel}
                  {counterName ? (
                    <span className="block font-normal text-muted-foreground">
                      {counterName}
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className="text-muted-foreground">Not chosen yet</span>
              )}
            </Row>
          </dl>
          <div className="space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold text-foreground tabular-nums">
                {typeof service?.priceMinor === "number"
                  ? formatBDT(service.priceMinor)
                  : "—"}
              </span>
            </div>
            <p className="text-muted-foreground">
              {takesDeposit
                ? "A small deposit is held at the next step; the rest is paid at the salon."
                : "Free to book. You pay at the salon after your visit."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function Assurance({
  takesDeposit,
  windowMin,
  className,
}: {
  takesDeposit: boolean;
  windowMin: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-3xl border border-dashed border-border p-4 text-sm text-muted-foreground",
        className,
      )}
    >
      <ShieldCheck
        className="mt-0.5 size-4 shrink-0 text-success"
        aria-hidden
      />
      <p>
        {takesDeposit
          ? `Cancel at least ${windowText(windowMin)} before and your deposit is released in full.`
          : "Plans change? Cancel any time from My bookings, so the salon can give the time to someone else."}
      </p>
    </div>
  );
}
