"use client";

import { useId, useState, type ReactNode } from "react";
import { BarChart3, Download, Info, Table2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { cn } from "@/lib/utils";

export function InfoTip({ label, text }: { label: string; text: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`What "${label}" means`}
            className="rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Info aria-hidden="true" className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-72">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const toggle = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
  );

/**
 * One metric's frame: title + ⓘ definition, a "Chart | Table" switch (the
 * table is the accessible twin with the same numbers), and the report's CSV.
 * While the filters re-render the page, the previous chart stays, dimmed.
 * Wide charts scroll sideways inside the card, never the page.
 */
export function ChartCard({
  title,
  definition,
  chart,
  table,
  csvHref,
  note,
  className,
}: {
  title: string;
  definition?: string;
  /** Omit for a table-only card. */
  chart?: ReactNode;
  table: ReactNode;
  csvHref?: string;
  /** A line under the title, e.g. "Area filter not applied". */
  note?: ReactNode;
  className?: string;
}) {
  const [view, setView] = useState<"chart" | "table">(chart ? "chart" : "table");
  const id = useId();

  return (
    <Card className={cn("min-w-0 gap-3 py-4", className)}>
      <CardContent className="space-y-3 px-4">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 id={id} className="truncate text-sm font-semibold text-foreground">
                {title}
              </h3>
              {definition && <InfoTip label={title} text={definition} />}
            </div>
            {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
          </div>
          <div className="flex items-center gap-2">
            {chart && (
              <div
                role="group"
                aria-label={`${title}: view as`}
                className="inline-flex rounded-full bg-muted p-0.5"
              >
                <button
                  type="button"
                  aria-pressed={view === "chart"}
                  onClick={() => setView("chart")}
                  className={toggle(view === "chart")}
                >
                  <BarChart3 className="size-3.5" aria-hidden /> Chart
                </button>
                <button
                  type="button"
                  aria-pressed={view === "table"}
                  onClick={() => setView("table")}
                  className={toggle(view === "table")}
                >
                  <Table2 className="size-3.5" aria-hidden /> Table
                </button>
              </div>
            )}
            {csvHref && (
              <a
                href={csvHref}
                download
                aria-label={`Download ${title} report as CSV`}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Download className="size-3.5" aria-hidden /> CSV
              </a>
            )}
          </div>
        </div>
        <PendingRegion>
          <div role="region" aria-labelledby={id} className="overflow-x-auto">
            {view === "chart" && chart ? chart : table}
          </div>
        </PendingRegion>
      </CardContent>
    </Card>
  );
}
