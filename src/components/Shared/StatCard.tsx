import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TONE_CLASSES, type Tone } from "@/lib/status-tone";

/**
 * One figure on a dashboard page. Lay several out with
 * `grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4`.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 pt-0.5 text-sm font-medium text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl",
              TONE_CLASSES[tone].soft,
              TONE_CLASSES[tone].text,
            )}
          >
            <Icon aria-hidden="true" className="size-[18px]" />
          </span>
        )}
      </div>
      <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere] sm:text-2xl">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
