"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  APPEAL_LABELS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_ORDER,
  CHANNEL_LABELS,
  DEPOSIT_LABELS,
  SOURCE_LABELS,
  bookingWhen,
} from "@/components/Admin/bookings/labels";
import { CopyId } from "@/components/Admin/MaskedValue";
import { StatusBadge } from "@/components/Dashboard/appointments/StatusBadge";
import { addDays, dhakaToday } from "@/components/Dashboard/appointments/format";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { FilterBar, type FilterChip } from "@/components/Shared/FilterBar";
import { PageHeader } from "@/components/Shared/PageHeader";
import Pagination from "@/components/Shared/Pagination";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import {
  FilterNavigationProvider,
  useFilterNavigation,
} from "@/hooks/useFilterNavigation";
import type { ApiResponse } from "@/lib/api-types";
import { formatBDT } from "@/lib/money";
import { ExportButton } from "@/components/Admin/finance/ExportButton";
import type {
  AdminBookingFilters,
  AdminBookingListMeta,
  AdminBookingRow,
} from "@/services/admin/bookings/types";

const ALL = "ALL";
const ANY = "ANY";

type Props = {
  response: ApiResponse<AdminBookingRow[]>;
  filters: AdminBookingFilters;
  canExport?: boolean;
};

type SelectKey = "channel" | "source" | "depositStatus" | "appealStatus";

/** Date presets, as `from`/`to` in Dhaka calendar days. */
const PRESETS: { value: string; label: string; range: () => { from: string; to: string } }[] = [
  { value: "today", label: "Today", range: () => ({ from: dhakaToday(), to: dhakaToday() }) },
  { value: "next7", label: "Next 7 days", range: () => ({ from: dhakaToday(), to: addDays(dhakaToday(), 6) }) },
  { value: "last7", label: "Last 7 days", range: () => ({ from: addDays(dhakaToday(), -6), to: dhakaToday() }) },
  { value: "last30", label: "Last 30 days", range: () => ({ from: addDays(dhakaToday(), -29), to: dhakaToday() }) },
];

export function BookingsClient(props: Props) {
  return (
    <FilterNavigationProvider>
      <BookingsList {...props} />
    </FilterNavigationProvider>
  );
}

function BookingsList({ response, filters, canExport }: Props) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const [q, setQ] = useState(filters.q ?? "");
  const [area, setArea] = useState(filters.area ?? "");
  const [salonId, setSalonId] = useState(filters.salonId ?? "");

  const rows = response.success && Array.isArray(response.data) ? response.data : [];
  const meta = response.meta as unknown as AdminBookingListMeta | undefined;
  const counts = meta?.statusCounts ?? {};
  const allCount = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

  // Any change but paging starts again from page 1.
  const go = (next: Partial<AdminBookingFilters>) => {
    const merged: AdminBookingFilters = { ...filters, page: 1, ...next };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined || value === "" || (key === "page" && value === 1)) continue;
      params.set(key, String(value));
    }
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const chips: FilterChip[] = [
    { value: ALL, label: "All", count: allCount },
    ...BOOKING_STATUS_ORDER.map((status) => ({
      value: status,
      label: BOOKING_STATUS_LABELS[status],
      count: counts[status] ?? 0,
    })),
  ];

  const activeCount = [
    filters.salonId,
    filters.area,
    filters.from,
    filters.to,
    filters.channel,
    filters.source,
    filters.depositStatus,
    filters.appealStatus,
    filters.includeTest,
  ].filter(Boolean).length;

  const preset = PRESETS.find((p) => {
    const r = p.range();
    return r.from === filters.from && r.to === filters.to;
  })?.value;

  const selectFilter = (key: SelectKey, label: string, options: Record<string, string>) => (
    <Select value={filters[key] ?? ANY} onValueChange={(v) => go({ [key]: v === ANY ? undefined : v })}>
      <SelectTrigger className="w-full md:w-40" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{`Any ${label.toLowerCase()}`}</SelectItem>
        {Object.entries(options).map(([value, text]) => (
          <SelectItem key={value} value={value}>
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const columns: Column<AdminBookingRow>[] = [
    {
      key: "token",
      header: "Booking",
      mobile: "primary",
      cell: (b) => (
        <div className="min-w-0">
          {b.token ? <CopyId id={b.token} label="token" /> : <CopyId id={b.id} />}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {b.serialNumber != null ? `Serial #${b.serialNumber}` : "No serial"}
            {(b.salon.isTest || b.customer.isTest) && <span className="ml-2">test</span>}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (b) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{b.customer.name}</p>
          <p className="truncate text-xs text-muted-foreground">{b.customer.email}</p>
        </div>
      ),
    },
    {
      key: "salon",
      header: "Salon",
      cell: (b) => (
        <div className="min-w-0">
          <p className="truncate">{b.salon.name}</p>
          <p className="truncate text-xs text-muted-foreground">{b.service.name}</p>
        </div>
      ),
    },
    {
      key: "appointmentDate",
      header: "When",
      sortable: true,
      cell: (b) => <span className="whitespace-nowrap text-sm">{bookingWhen(b.appointmentDate, b.startTime)}</span>,
    },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (b) => (
        <div className="flex flex-wrap items-center gap-1">
          <StatusBadge status={b.status} />
          {b.appealStatus && (
            <ToneBadge status={`APPEAL_${b.appealStatus}`} tone={b.appealStatus === "PENDING" ? "warning" : "neutral"}>
              {APPEAL_LABELS[b.appealStatus]}
            </ToneBadge>
          )}
        </div>
      ),
    },
    {
      key: "deposit",
      header: "Deposit",
      className: "hidden @5xl:table-cell",
      cell: (b) =>
        b.depositMinor > 0 ? (
          <span className="text-sm">
            {formatBDT(b.depositMinor)}{" "}
            <span className="text-xs text-muted-foreground">{DEPOSIT_LABELS[b.depositStatus] ?? b.depositStatus}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        ),
    },
    {
      key: "totalMinor",
      header: "Total",
      align: "right",
      sortable: true,
      cell: (b) => <span className="tabular-nums">{formatBDT(b.totalMinor)}</span>,
    },
    {
      key: "channel",
      header: "Channel",
      className: "hidden @5xl:table-cell",
      cell: (b) => <span className="text-xs text-muted-foreground">{CHANNEL_LABELS[b.bookedVia] ?? b.bookedVia}</span>,
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Bookings"
        description="Every booking on SalonKhuji. Search by TKN- token, customer email or phone; open one for its timeline and money."
        actions={
          canExport ? (
            <ExportButton
              kind="bookings"
              from={filters.from}
              to={filters.to}
              includeTest={filters.includeTest === "true"}
              label="Export"
            />
          ) : undefined
        }
      />

      <FilterBar
        pending={isPending}
        search={{
          value: q,
          onChange: setQ,
          onSubmit: (value) => go({ q: value.trim() || undefined }),
          placeholder: "TKN-…, email, phone or name",
          label: "Search bookings",
        }}
        chips={{
          value: filters.status ?? ALL,
          options: chips,
          onChange: (status) => go({ status: status === ALL ? undefined : status }),
          label: "Status",
        }}
        extra={
          <>
            <Select
              value={filters.dateField ?? "appointmentDate"}
              onValueChange={(v) => go({ dateField: v === "appointmentDate" ? undefined : v })}
            >
              <SelectTrigger className="w-full md:w-40" aria-label="Date is">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointmentDate">Appointment date</SelectItem>
                <SelectItem value="createdAt">Booked on</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={preset ?? (filters.from || filters.to ? "custom" : ANY)}
              onValueChange={(v) => {
                if (v === ANY) go({ from: undefined, to: undefined });
                const found = PRESETS.find((p) => p.value === v);
                if (found) go(found.range());
              }}
            >
              <SelectTrigger className="w-full md:w-36" aria-label="Date range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any date</SelectItem>
                {PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom" disabled>
                  Custom range
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                aria-label="From"
                className="w-full md:w-36"
                value={filters.from ?? ""}
                onChange={(e) => go({ from: e.target.value || undefined })}
              />
              <Input
                type="date"
                aria-label="To"
                className="w-full md:w-36"
                value={filters.to ?? ""}
                onChange={(e) => go({ to: e.target.value || undefined })}
              />
            </div>
            {selectFilter("channel", "Channel", CHANNEL_LABELS)}
            {selectFilter("source", "Source", SOURCE_LABELS)}
            {selectFilter("depositStatus", "Deposit", DEPOSIT_LABELS)}
            {selectFilter("appealStatus", "Appeal", APPEAL_LABELS)}
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                go({ area: area.trim() || undefined, salonId: salonId.trim() || undefined });
              }}
            >
              <Input
                aria-label="Area"
                placeholder="Area"
                className="w-full md:w-32"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
              <Input
                aria-label="Salon ID"
                placeholder="Salon ID"
                className="w-full md:w-40"
                value={salonId}
                onChange={(e) => setSalonId(e.target.value)}
              />
              <button type="submit" className="sr-only">
                Apply
              </button>
            </form>
            <div className="flex items-center gap-2">
              <Switch
                id="include-test"
                checked={filters.includeTest === "true"}
                onCheckedChange={(on) => go({ includeTest: on ? "true" : undefined })}
              />
              <Label htmlFor="include-test" className="text-sm">
                Include test data
              </Label>
            </div>
          </>
        }
        activeCount={activeCount}
        onClear={() => {
          setArea("");
          setSalonId("");
          go({
            salonId: undefined,
            area: undefined,
            from: undefined,
            to: undefined,
            dateField: undefined,
            channel: undefined,
            source: undefined,
            depositStatus: undefined,
            appealStatus: undefined,
            includeTest: undefined,
          });
        }}
      />

      {filters.salonId && rows[0] && rows.every((r) => r.salon.id === filters.salonId) && (
        <p className="text-sm text-muted-foreground">
          Showing bookings at <span className="font-medium text-foreground">{rows[0].salon.name}</span>
        </p>
      )}

      {!response.success ? (
        <ErrorState title="Couldn't load bookings" message={response.message} />
      ) : (
        <PendingRegion>
          <DataList
            items={rows}
            rowKey={(b) => b.id}
            columns={columns}
            density="compact"
            rowHref={(b) => `/dashboard/admin/bookings/${b.id}`}
            caption="Bookings"
            empty={
              <EmptyState
                icon={CalendarClock}
                title="No bookings match"
                description={
                  filters.includeTest !== "true"
                    ? "Test data is hidden. Turn on “Include test data” or clear a filter."
                    : "Try clearing a filter."
                }
              />
            }
          />
        </PendingRegion>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          pageSize={meta.limit}
          itemLabel="bookings"
          disabled={isPending}
          onPageChange={(page) => go({ ...filters, page })}
        />
      )}
    </div>
  );
}
