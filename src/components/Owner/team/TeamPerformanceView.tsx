"use client";

import Link from "next/link";
import { BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { StatCard } from "@/components/Shared/StatCard";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { PerformanceRow, TeamPerformance } from "@/services/staff/schedule-types";

const RANGES = [
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const day = (ymd: string) => dayFmt.format(new Date(`${ymd}T00:00:00Z`));
const percent = (u: number | null) => (u === null ? "—" : `${Math.round(u * 100)}%`);
const hours = (min: number | null) => (min === null ? "—" : `${Math.round(min / 6) / 10} h`);

/**
 * The team's figures for a range. Bookings count by appointment day; revenue
 * is completed bookings only. "Unassigned" holds bookings with no stylist, so
 * the totals match every booking in the range.
 */
export function TeamPerformanceView({
  data,
  range,
  salonId,
  showBranch,
}: {
  data: TeamPerformance;
  range: string;
  salonId?: string;
  showBranch: boolean;
}) {
  const csv = `/api/owner/export/team-performance.csv?${new URLSearchParams({
    from: data.from,
    to: data.to,
    ...(salonId && { salonId }),
  })}`;

  const columns: Column<PerformanceRow>[] = [
    {
      key: "name",
      header: "Stylist",
      mobile: "primary",
      cell: (r) => (
        <div className="min-w-0">
          <p className={cn("truncate font-medium", r.staffId === null && "text-muted-foreground")}>{r.name}</p>
          {showBranch && <p className="truncate text-xs text-muted-foreground">{r.salonName}</p>}
        </div>
      ),
    },
    { key: "bookings", header: "Bookings", align: "right", cell: (r) => r.bookings, mobileCell: (r) => `${r.bookings} bookings` },
    {
      key: "completed",
      header: "Completed",
      align: "right",
      cell: (r) => r.completed,
      mobileCell: (r) => `${r.completed} completed`,
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      mobile: "trailing",
      cell: (r) => <span className="font-medium tabular-nums">{formatBDT(r.revenueMinor)}</span>,
    },
    {
      key: "avg",
      header: "Avg ticket",
      align: "right",
      cell: (r) => (r.completed ? formatBDT(r.avgTicketMinor) : "—"),
      mobileCell: (r) => (r.completed ? `avg ${formatBDT(r.avgTicketMinor)}` : null),
    },
    {
      key: "rating",
      header: "Rating",
      align: "right",
      cell: (r) => (r.rating === null ? "—" : `${r.rating.toFixed(1)} ★`),
      mobileCell: (r) => (r.rating === null ? null : `${r.rating.toFixed(1)} ★`),
    },
    {
      key: "noShows",
      header: "No-shows",
      align: "right",
      cell: (r) => r.noShows,
      mobileCell: (r) => (r.noShows ? `${r.noShows} no-show${r.noShows === 1 ? "" : "s"}` : null),
    },
    {
      key: "utilisation",
      header: "Utilisation",
      align: "right",
      cell: (r) => (
        <span title={`${hours(r.bookedMinutes)} booked of ${hours(r.availableMinutes)} on shift`}>
          {percent(r.utilisation)}
        </span>
      ),
      mobileCell: (r) => (r.utilisation === null ? null : `${percent(r.utilisation)} busy`),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Date range" className="-mx-1 overflow-x-auto px-1 pb-1">
          <ul className="flex w-max gap-1.5">
            {RANGES.map((r) => (
              <li key={r.value}>
                <Link
                  href={r.value === "month" ? "?" : `?range=${r.value}`}
                  aria-current={r.value === range ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    r.value === range
                      ? "border-primary/40 bg-primary-soft font-medium text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Button asChild variant="outline" size="sm">
          <a href={csv} download>
            <Download />
            Payroll CSV
          </a>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {day(data.from)} – {day(data.to)}
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Bookings" value={data.totals.bookings} hint={`${data.totals.completed} completed`} />
        <StatCard label="Revenue" value={formatBDT(data.totals.revenueMinor)} hint="Completed bookings" />
        <StatCard
          label="Avg ticket"
          value={data.totals.completed ? formatBDT(data.totals.avgTicketMinor) : "—"}
        />
        <StatCard
          label="Utilisation"
          value={percent(data.totals.utilisation)}
          hint={`${data.totals.noShows} no-show${data.totals.noShows === 1 ? "" : "s"}`}
        />
      </div>

      <DataList
        items={data.rows}
        rowKey={(r) => `${r.salonId}:${r.staffId ?? "unassigned"}`}
        columns={columns}
        caption="Performance per stylist"
        tableFrom="3xl"
        empty={
          <div className="rounded-2xl border border-dashed border-border">
            <EmptyState
              icon={BarChart3}
              title="No stylists yet"
              description="Invite your stylists from Members to see their figures here."
            />
          </div>
        }
      />
      <p className="text-xs text-muted-foreground">
        Utilisation is booked time over time on shift (shifts minus time off; a stylist without fixed hours counts
        the salon&apos;s opening hours). Ratings are all-time.
      </p>
    </div>
  );
}
