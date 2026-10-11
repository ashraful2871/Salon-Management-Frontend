import type { ReactNode } from "react";
import { TONE_CLASSES, type Tone } from "@/lib/status-tone";
import { cn } from "@/lib/utils";

export type TimelineItem = {
  at: string | Date;
  title: ReactNode;
  detail?: ReactNode;
  tone?: Tone;
  /** Small trailing line, e.g. who did it. */
  meta?: ReactNode;
};

const DHAKA = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "8 Oct 2026, 3:05 pm" in Asia/Dhaka, whatever the viewer's zone. */
export const formatDhaka = (at: string | Date) => DHAKA.format(new Date(at));

/**
 * Events in the order given, each at an absolute Dhaka time - admins match
 * these against support emails and gateway logs, where "3 h ago" is useless.
 */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("relative space-y-4 border-l border-border pl-5", className)}>
      {items.map((item, i) => (
        <li key={i} className="relative">
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full ring-4 ring-surface",
              TONE_CLASSES[item.tone ?? "neutral"].dot,
            )}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <p className="text-sm font-medium">{item.title}</p>
            <time
              dateTime={new Date(item.at).toISOString()}
              className="text-xs text-muted-foreground tabular-nums"
            >
              {formatDhaka(item.at)}
            </time>
          </div>
          {item.detail && <div className="mt-0.5 text-sm text-muted-foreground">{item.detail}</div>}
          {item.meta && <div className="mt-0.5 text-xs text-muted-foreground">{item.meta}</div>}
        </li>
      ))}
    </ol>
  );
}
