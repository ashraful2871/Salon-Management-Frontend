"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { cn } from "@/lib/utils";
import { RANGE_PRESETS, type RangePreset } from "./range";

/**
 * Date presets + "Include test data", both in the URL so a view can be
 * shared. Seed salons are all test data, so it is off by default.
 */
export function RangeChips({
  range,
  includeTest,
  showRange = true,
}: {
  range: RangePreset;
  includeTest: boolean;
  showRange?: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate, isPending } = useFilterNavigation();

  const go = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    next.delete("cursor");
    const query = next.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2",
        isPending && "opacity-70",
      )}
      aria-busy={isPending}
    >
      {showRange && (
        <div role="group" aria-label="Date range" className="flex flex-wrap gap-1.5">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              aria-pressed={range === preset.value}
              onClick={() => go({ range: preset.value })}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                range === preset.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground hover:bg-muted",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Switch
          id="include-test"
          checked={includeTest}
          onCheckedChange={(on) => go({ includeTest: on ? "1" : null })}
        />
        <Label htmlFor="include-test" className="text-sm font-normal text-muted-foreground">
          Include test data
        </Label>
      </div>
    </div>
  );
}
