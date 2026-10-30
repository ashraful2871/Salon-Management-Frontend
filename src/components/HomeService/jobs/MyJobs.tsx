"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarOff } from "lucide-react";

import { dayOf, dayText } from "@/components/HomeService/booking/format";
import { EmptyState } from "@/components/Shared/EmptyState";
import { cn } from "@/lib/utils";
import { getMyJobs } from "@/services/home-service/getMyJobs";
import type { HomeBookingStatus, HomeJob, HomeJobList } from "@/services/home-service/types";
import JobCard from "./JobCard";
import { useJobActions } from "./useJobActions";

const OPEN: HomeBookingStatus[] = ["CONFIRMED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"];
const DAY_MS = 24 * 60 * 60 * 1000;
const SLOW_TICK_MS = 30_000;

const daysBetween = (from: string, to: string) => {
  const days: string[] = [];
  const end = Date.parse(`${to}T00:00:00Z`);
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= end; t += DAY_MS) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
};

const dayPart = (day: string, part: Intl.DateTimeFormatOptions) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { ...part, timeZone: "UTC" });

/** A clock for the cards: every second while a countdown shows, otherwise now and then. */
const useNow = (fast: boolean) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), fast ? 1000 : SLOW_TICK_MS);
    return () => clearInterval(timer);
  }, [fast]);
  return now;
};

/**
 * The expert's week on a phone: a day strip over that day's visits. Everything
 * is on the page already, so changing day is instant. No polling: the list is
 * read again when the phone comes back to the tab, and a card when its address
 * is due or the server says it moved on.
 */
export default function MyJobs({ initial, focusId }: { initial: HomeJobList; focusId: string | null }) {
  const [jobs, setJobs] = useState(initial.jobs);
  // An action's response re-renders the page with a fresh list.
  const [seen, setSeen] = useState(initial);
  if (initial !== seen) {
    setSeen(initial);
    setJobs(initial.jobs);
  }

  const setJob = useCallback((id: string, job: HomeJob | null) => {
    setJobs((list) => (job ? list.map((j) => (j.id === id ? job : j)) : list.filter((j) => j.id !== id)));
  }, []);
  const actions = useJobActions(setJob);
  const { reload, idle } = actions;

  const days = daysBetween(initial.from, initial.to);
  const [day, setDay] = useState(() => {
    const focused = initial.jobs.find((j) => j.id === focusId);
    return focused ? dayOf(focused.startAt) : initial.from;
  });

  const shown = actions.withPending(jobs);
  const now = useNow(shown.some((j) => j.status === "ARRIVED" && j.noShowFrom));

  useEffect(() => {
    if (focusId) document.getElementById(`job-${focusId}`)?.scrollIntoView({ block: "center" });
  }, [focusId]);

  // Back on the tab: what changed while the phone was in a pocket.
  useEffect(() => {
    const read = async () => {
      if (document.visibilityState !== "visible" || !idle()) return;
      const res = await getMyJobs();
      if (res.success && res.data && idle()) setJobs(res.data.jobs);
    };
    document.addEventListener("visibilitychange", read);
    return () => document.removeEventListener("visibilitychange", read);
  }, [idle]);

  // The address opens on the clock, with no event to say so.
  const asked = useRef(new Set<string>());
  useEffect(() => {
    for (const j of jobs) {
      if (j.address || !OPEN.includes(j.status) || asked.current.has(j.id)) continue;
      if (now >= new Date(j.addressRevealAt).getTime()) {
        asked.current.add(j.id);
        void reload(j.id);
      }
    }
  }, [jobs, now, reload]);

  const countOn = (d: string) => shown.filter((j) => dayOf(j.startAt) === d).length;
  const dayJobs = shown.filter((j) => dayOf(j.startAt) === day);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div role="group" aria-label="Pick a day" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {days.map((d, i) => {
          const count = countOn(d);
          const on = d === day;
          return (
            <button
              key={d}
              type="button"
              aria-pressed={on}
              aria-label={`${i === 0 ? "Today" : dayText(d)}: ${count} job${count === 1 ? "" : "s"}`}
              onClick={() => setDay(d)}
              className={cn(
                "flex min-h-16 w-16 shrink-0 cursor-pointer flex-col items-center justify-center rounded-2xl border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on ? "border-primary bg-primary-soft text-foreground" : "border-border bg-surface text-muted-foreground",
              )}
            >
              <span className="font-semibold">{i === 0 ? "Today" : dayPart(d, { weekday: "short" })}</span>
              <span className="text-xs">{dayPart(d, { day: "numeric", month: "short" })}</span>
              <span className={cn("text-xs font-semibold tabular-nums", count > 0 ? "text-primary-hover" : "invisible")}>{count}</span>
            </button>
          );
        })}
      </div>

      {dayJobs.length === 0 ? (
        <EmptyState icon={CalendarOff} title="No jobs on this day" />
      ) : (
        <ul className="space-y-3">
          {dayJobs.map((job) => (
            <JobCard key={job.id} job={job} now={now} actions={actions} />
          ))}
        </ul>
      )}
    </div>
  );
}
