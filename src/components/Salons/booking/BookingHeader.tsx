"use client";

import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

import { cn } from "@/lib/utils";

export const SALON_STEPS = ["Service", "Date & time", "Confirm"] as const;
/** At home the salon flow is only the first step; the rest is the Home Service flow's. */
export const HOME_STEPS = ["Services", "Date & time", "Address & advance"] as const;

type Step = { label: string; href?: string; onClick?: () => void };

/**
 * One header for every step of a salon booking: the way back, the title, and
 * the steps (done ones can be revisited).
 */
export default function BookingHeader({
  overline,
  title,
  steps,
  current,
  back,
}: {
  overline: string;
  title: string;
  steps: Step[];
  current: number;
  back: { label: string; href?: string; onClick?: () => void };
}) {
  const backClass =
    "-ml-2 inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4 sm:px-6 md:py-6 lg:px-8">
        {back.href ? (
          <Link href={back.href} className={backClass}>
            <ArrowLeft className="size-4" aria-hidden /> <span className="truncate">{back.label}</span>
          </Link>
        ) : (
          <button type="button" onClick={back.onClick} className={backClass}>
            <ArrowLeft className="size-4" aria-hidden /> {back.label}
          </button>
        )}

        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="truncate text-overline font-semibold tracking-[0.06em] text-primary uppercase">{overline}</p>
            <h1 className="font-display text-title-lg text-foreground md:text-3xl">{title}</h1>
          </div>
          <Stepper steps={steps} current={current} />
        </div>
      </div>
    </div>
  );
}

function Stepper({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <div className="md:min-w-[28rem] md:shrink-0">
      <p className="mb-2 text-sm text-muted-foreground md:hidden">
        Step {current + 1} of {steps.length} ·{" "}
        <span className="font-semibold text-foreground">{steps[current]?.label}</span>
      </p>
      <ol aria-label="Booking steps" className="flex items-center gap-2">
        {steps.map((s, i) => {
          const state = i < current ? "done" : i === current ? "current" : "todo";
          const dot = (
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors",
                state === "done" && "bg-primary-soft text-primary-hover",
                state === "current" && "bg-primary text-primary-foreground",
                state === "todo" && "bg-muted text-muted-foreground",
              )}
            >
              {state === "done" ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
          );
          const label = (
            <span
              className={cn(
                "hidden text-sm whitespace-nowrap md:inline",
                state === "current" ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          );
          const canGo = state === "done" && (s.href || s.onClick);
          const itemClass =
            "flex shrink-0 items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
          return (
            <li
              key={s.label}
              aria-current={state === "current" ? "step" : undefined}
              className={cn("flex items-center gap-2", i < steps.length - 1 && "flex-1")}
            >
              {canGo && s.href ? (
                <Link href={s.href} className={cn(itemClass, "hover:opacity-80")} aria-label={`${s.label} (change)`}>
                  {dot}
                  {label}
                </Link>
              ) : canGo ? (
                <button type="button" onClick={s.onClick} className={cn(itemClass, "hover:opacity-80")} aria-label={`${s.label} (change)`}>
                  {dot}
                  {label}
                </button>
              ) : (
                <span className={itemClass}>
                  {dot}
                  {label}
                </span>
              )}
              {i < steps.length - 1 && (
                <span aria-hidden className={cn("h-px min-w-3 flex-1", i < current ? "bg-primary" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
