"use client";

import { useEffect, useState } from "react";
import { Loader2, Moon, Sun, Sunrise } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getHomeAvailability } from "@/services/home-service/getHomeAvailability";
import { getHomeDays } from "@/services/home-service/getHomeDays";
import type { HomeDay, HomeSlot, SlotPeriod } from "@/services/home-service/types";

/** Today in Dhaka as YYYY-MM-DD, the server's calendar. */
export const dhakaToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());

export type SlotSource = {
  offeringIds: string[];
  /** One expert, or every expert of `salonId` ("any available"). */
  expertId?: string;
  salonId?: string;
  lat?: number;
  lng?: number;
};

type Load<T> = { data: T | null; loading: boolean; error: string | null };
type Result<T> = { key: string; data: T | null; error: string | null };

/**
 * The window's day chips and the open times on `date`, both live (never
 * cached). Each answer is filed under the request it answers, so a fast
 * tapper never sees another day's times. `source` must be memoised.
 */
export function useHomeSlots(source: SlotSource | null, date: string | null) {
  const [nonce, setNonce] = useState(0);
  const base =
    source && source.offeringIds.length
      ? [source.offeringIds.join(","), source.expertId ?? "", source.salonId ?? "", source.lat ?? "", source.lng ?? "", nonce].join("|")
      : null;
  const daysKey = base;
  const timesKey = base && date ? `${base}|${date}` : null;
  const [daysRes, setDaysRes] = useState<Result<{ days: HomeDay[]; outOfArea: boolean }> | null>(null);
  const [timesRes, setTimesRes] = useState<Result<HomeSlot[]> | null>(null);

  useEffect(() => {
    if (!daysKey || !source) return;
    let live = true;
    getHomeDays(source).then((res) => {
      if (!live) return;
      const today = dhakaToday();
      setDaysRes(
        res.success && res.data
          ? // Past days are never shown, whatever the server's clock said.
            { key: daysKey, data: { ...res.data, days: res.data.days.filter((d) => d.date >= today) }, error: null }
          : { key: daysKey, data: null, error: res.message },
      );
    });
    return () => {
      live = false;
    };
  }, [daysKey, source]);

  useEffect(() => {
    if (!timesKey || !source || !date) return;
    let live = true;
    getHomeAvailability({ ...source, date }).then((res) => {
      if (!live) return;
      const now = Date.now();
      setTimesRes(
        res.success && res.data
          ? { key: timesKey, data: res.data.slots.filter((s) => new Date(s.startAt).getTime() > now), error: null }
          : { key: timesKey, data: null, error: res.message },
      );
    });
    return () => {
      live = false;
    };
  }, [timesKey, source, date]);

  // Days may show the last answer while the next loads; times never do.
  const days: Load<{ days: HomeDay[]; outOfArea: boolean }> = {
    data: daysKey ? (daysRes?.data ?? null) : null,
    loading: Boolean(daysKey) && daysRes?.key !== daysKey,
    error: daysRes?.key === daysKey ? (daysRes?.error ?? null) : null,
  };
  const current = timesKey && timesRes?.key === timesKey ? timesRes : null;
  const times: Load<HomeSlot[]> = {
    data: current?.data ?? null,
    loading: Boolean(timesKey) && !current,
    error: current?.error ?? null,
  };
  return { days, times, reload: () => setNonce((n) => n + 1) };
}

/** The booking window as chips; a day with no open time is greyed "Fully booked". */
export function DayChips({
  days,
  loading,
  error,
  value,
  onChange,
}: {
  days: HomeDay[] | null;
  loading: boolean;
  error: string | null;
  value: string | null;
  onChange: (date: string) => void;
}) {
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!days && loading) {
    return (
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (!days?.length) return <p className="text-sm text-muted-foreground">No days are open for booking right now.</p>;
  return (
    <div role="radiogroup" aria-label="Day" className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {days.map((d) => {
        const on = d.date === value;
        const [word, num] = d.label.includes(" ") ? d.label.split(" ") : [d.label, String(Number(d.date.slice(8, 10)))];
        return (
          <button
            key={d.date}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={!d.hasSlots}
            onClick={() => onChange(d.date)}
            className={cn(
              "flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-2xl border px-1 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface hover:border-primary/60",
              !d.hasSlots && "cursor-not-allowed border-dashed bg-muted/50 text-muted-foreground hover:border-border",
            )}
          >
            <span className="text-xs font-medium">{word}</span>
            <span className="text-lg font-semibold leading-tight tabular-nums">{num}</span>
            {!d.hasSlots && <span className="text-[10px] leading-tight">Fully booked</span>}
          </button>
        );
      })}
    </div>
  );
}

const PERIODS: { key: SlotPeriod; label: string; icon: typeof Sun }[] = [
  { key: "MORNING", label: "Morning", icon: Sunrise },
  { key: "AFTERNOON", label: "Afternoon", icon: Sun },
  { key: "EVENING", label: "Evening", icon: Moon },
];

/** The open start times, grouped Morning / Afternoon / Evening. Only offered times are rendered. */
export function TimeGroups({
  slots,
  loading,
  error,
  value,
  onChange,
}: {
  slots: HomeSlot[] | null;
  loading: boolean;
  error: string | null;
  value: string | null;
  onChange: (slot: HomeSlot) => void;
}) {
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (loading && !slots) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Finding open times…
      </p>
    );
  }
  if (!slots) return <p className="text-sm text-muted-foreground">Pick a day first.</p>;
  if (slots.length === 0) return <p className="text-sm text-muted-foreground">No open times left on this day. Pick another day.</p>;
  return (
    <div className={cn("space-y-5", loading && "opacity-60")}>
      {PERIODS.map(({ key, label, icon: Icon }) => {
        const group = slots.filter((s) => s.period === key);
        if (group.length === 0) return null;
        return (
          <div key={key}>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Icon className="size-4 text-muted-foreground" aria-hidden /> {label}
            </p>
            <div role="radiogroup" aria-label={`${label} times`} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {group.map((s) => {
                const on = s.startAt === value;
                return (
                  <button
                    key={s.startAt}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => onChange(s)}
                    className={cn(
                      "h-11 cursor-pointer rounded-full border text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary/60",
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">All times are Bangladesh time.</p>
    </div>
  );
}
