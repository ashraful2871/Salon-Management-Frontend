"use client";

import { useOptimistic, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Star, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  SALON_STATUS_LABELS,
  SALON_STATUS_ORDER,
  salonChecklist,
  waitingFor,
} from "@/components/Admin/salons/labels";
import { SalonReviewSheet } from "@/components/Admin/salons/SalonReviewSheet";
import { SalonStatusDialog } from "@/components/Admin/salons/SalonStatusDialog";
import { formatDay } from "@/components/Admin/users/labels";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { FilterBar, type FilterChip } from "@/components/Shared/FilterBar";
import { LocationAccuracyBadge } from "@/components/Shared/LocationAccuracyBadge";
import { PageHeader } from "@/components/Shared/PageHeader";
import Pagination from "@/components/Shared/Pagination";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import SafeImage from "@/components/Shared/SafeImage";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import {
  FilterNavigationProvider,
  useFilterNavigation,
} from "@/hooks/useFilterNavigation";
import type { ApiResponse } from "@/lib/api-types";
import { updateAdminSalonStatus } from "@/services/admin/salons/updateAdminSalonStatus";
import type {
  AdminSalonFilters,
  AdminSalonListMeta,
  AdminSalonRow,
  AdminSalonStatus,
} from "@/services/admin/salons/types";

const ALL = "ALL";
const ANY = "ANY";

type Props = {
  response: ApiResponse<AdminSalonRow[]>;
  filters: AdminSalonFilters;
  permissions: string[];
  viewerId?: string;
};

export function SalonsClient(props: Props) {
  return (
    <FilterNavigationProvider>
      <SalonsList {...props} />
    </FilterNavigationProvider>
  );
}

function SalonsList({ response, filters, permissions, viewerId }: Props) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const [q, setQ] = useState(filters.q ?? "");
  const [area, setArea] = useState(filters.area ?? "");
  const [openId, setOpenId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AdminSalonRow | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<AdminSalonRow | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const salons = response.success && Array.isArray(response.data) ? response.data : [];
  const [rows, setOptimistic] = useOptimistic(
    salons,
    (state, { id, status }: { id: string; status: AdminSalonStatus }) =>
      state.map((s) => (s.id === id ? { ...s, status } : s)),
  );
  const meta = response.meta as unknown as AdminSalonListMeta | undefined;
  const counts = meta?.statusCounts ?? {};
  const allCount = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

  const position = openId ? rows.findIndex((s) => s.id === openId) : -1;
  const open = position >= 0 ? rows[position] : null;

  // Any change but paging starts again from page 1.
  const go = (next: Partial<AdminSalonFilters>) => {
    const merged: AdminSalonFilters = { ...filters, page: 1, ...next };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined || value === "" || (key === "page" && value === 1)) continue;
      params.set(key, String(value));
    }
    setOpenId(null);
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const chips: FilterChip[] = [
    ...SALON_STATUS_ORDER.map((status) => ({
      value: status,
      label: SALON_STATUS_LABELS[status],
      count: counts[status] ?? 0,
    })),
    { value: ALL, label: "All", count: allCount },
  ];

  const activeCount = [
    filters.location,
    filters.minRating,
    filters.area,
    filters.district,
    filters.division,
    filters.from,
    filters.to,
    filters.includeTest,
  ].filter(Boolean).length;

  const step = (delta: 1 | -1) => {
    const next = rows[position + delta];
    if (next) setOpenId(next.id);
  };

  /** After a decision the sheet moves on to the next salon in the queue. */
  const advanceFrom = (id: string) => {
    const at = rows.findIndex((s) => s.id === id);
    const next = rows[at + 1] ?? rows[at - 1];
    setOpenId(next && next.id !== id ? next.id : null);
  };

  const approve = (salon: AdminSalonRow) => {
    setPendingId(salon.id);
    startTransition(async () => {
      setOptimistic({ id: salon.id, status: "ACTIVE" });
      const result = await updateAdminSalonStatus(salon.id, { status: "ACTIVE", notify: true });
      showResultToast(result);
      setPendingId((current) => (current === salon.id ? null : current));
      if (result.success && filters.status === "PENDING_APPROVAL") advanceFrom(salon.id);
    });
  };

  // Missing checklist items take an explicit second click.
  const requestApprove = (salon: AdminSalonRow) => {
    if (salonChecklist(salon).every((c) => c.ok)) approve(salon);
    else setConfirmApprove(salon);
  };

  const selectFilter = (
    key: "location" | "minRating",
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <Select value={filters[key] ?? ANY} onValueChange={(v) => go({ [key]: v === ANY ? undefined : v })}>
      <SelectTrigger className="w-full md:w-40" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{`Any ${label.toLowerCase()}`}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const columns: Column<AdminSalonRow>[] = [
    {
      key: "name",
      header: "Salon",
      sortable: true,
      mobile: "primary",
      cell: (s) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-surface-subtle">
            <SafeImage src={s.coverImage} alt="" fill sizes="36px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">
              {s.name}
              {s.isTest && <span className="ml-2 text-xs font-normal text-muted-foreground">test</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {[s.area, s.district].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      mobile: "secondary",
      className: "hidden @3xl:table-cell",
      cell: (s) => (
        <div className="min-w-0">
          <p className="truncate">{s.owner?.name ?? "—"}</p>
          <p className="truncate text-xs text-muted-foreground">{s.owner?.email}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (s) => <ToneBadge status={s.status}>{SALON_STATUS_LABELS[s.status]}</ToneBadge>,
    },
    {
      key: "location",
      header: "Pin",
      cell: (s) => <LocationAccuracyBadge latitude={s.latitude} locationAccuracy={s.locationAccuracy} />,
    },
    { key: "services", header: "Services", align: "right", cell: (s) => s.services },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      align: "right",
      className: "hidden @3xl:table-cell",
      cell: (s) =>
        s.totalReviews ? (
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-current text-warning" aria-hidden />
            {s.rating.toFixed(1)}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "bookings30d",
      header: "Bookings 30 d",
      align: "right",
      className: "hidden @4xl:table-cell",
      cell: (s) => s.bookings30d,
    },
    {
      key: "createdAt",
      header: filters.status === "PENDING_APPROVAL" ? "Waiting" : "Added",
      sortable: true,
      mobile: "eyebrow",
      cell: (s) => (s.status === "PENDING_APPROVAL" ? waitingFor(s.createdAt) : formatDay(s.createdAt)),
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Salons"
        description="Every salon on SalonKhuji. Pending salons wait here for review; open one to see the checklist."
      />

      <FilterBar
        pending={isPending}
        search={{
          value: q,
          onChange: setQ,
          onSubmit: (value) => go({ q: value.trim() || undefined }),
          placeholder: "Name, phone, address, owner or ID",
          label: "Search salons",
        }}
        chips={{
          value: filters.status ?? ALL,
          options: chips,
          onChange: (status) => go({ status }),
          label: "Status",
        }}
        extra={
          <>
            {selectFilter("location", "Pin", [
              { value: "EXACT", label: "Exact pin" },
              { value: "APPROXIMATE", label: "Approximate pin" },
              { value: "NONE", label: "No pin" },
            ])}
            {selectFilter("minRating", "Rating", [
              { value: "4", label: "4★ and up" },
              { value: "3", label: "3★ and up" },
              { value: "2", label: "2★ and up" },
            ])}
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                go({ area: area.trim() || undefined });
              }}
            >
              <Input
                aria-label="Area"
                placeholder="Area, e.g. Dhanmondi"
                className="w-full md:w-44"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </form>
            <div className="flex items-center gap-2">
              <Label htmlFor="added-from" className="shrink-0 text-xs text-muted-foreground">
                Added
              </Label>
              <Input
                id="added-from"
                type="date"
                aria-label="Added from"
                className="w-full md:w-36"
                value={filters.from ?? ""}
                onChange={(e) => go({ from: e.target.value || undefined })}
              />
              <Input
                type="date"
                aria-label="Added to"
                className="w-full md:w-36"
                value={filters.to ?? ""}
                onChange={(e) => go({ to: e.target.value || undefined })}
              />
            </div>
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
          go({
            location: undefined,
            minRating: undefined,
            area: undefined,
            district: undefined,
            division: undefined,
            from: undefined,
            to: undefined,
            includeTest: undefined,
          });
        }}
      />

      {!response.success ? (
        <ErrorState title="Couldn't load salons" message={response.message} />
      ) : (
        <PendingRegion>
          <DataList
            items={rows}
            rowKey={(s) => s.id}
            columns={columns}
            density="compact"
            rowHref={(s) => `/dashboard/admin/salons/${s.id}`}
            rowActions={(s) => (
              <Button size="sm" variant={s.status === "PENDING_APPROVAL" ? "default" : "outline"} onClick={() => setOpenId(s.id)}>
                Review
              </Button>
            )}
            caption="Salons"
            empty={
              <EmptyState
                icon={Store}
                title={filters.status === "PENDING_APPROVAL" ? "Nothing waiting for review" : "No salons match"}
                description={activeCount || filters.q ? "Try clearing a filter." : undefined}
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
          itemLabel="salons"
          disabled={isPending}
          onPageChange={(page) => go({ ...filters, page })}
        />
      )}

      <SalonReviewSheet
        salon={open}
        position={position}
        total={rows.length}
        permissions={permissions}
        viewerId={viewerId}
        pending={!!open && pendingId === open.id}
        onClose={() => setOpenId(null)}
        onStep={step}
        onApprove={requestApprove}
        onReject={setRejecting}
      />

      {rejecting && (
        <SalonStatusDialog
          open
          onOpenChange={(next) => !next && setRejecting(null)}
          action="REJECTED"
          salon={rejecting}
          onDone={(result) => {
            if (result.success && filters.status === "PENDING_APPROVAL") advanceFrom(rejecting.id);
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmApprove}
        onOpenChange={(next) => !next && setConfirmApprove(null)}
        title={`Approve ${confirmApprove?.name ?? "this salon"}?`}
        description={`Still missing: ${
          confirmApprove
            ? salonChecklist(confirmApprove)
                .filter((c) => !c.ok)
                .map((c) => c.label.toLowerCase())
                .join(", ")
            : ""
        }. It goes live anyway.`}
        confirmLabel="Approve anyway"
        onConfirm={() => {
          if (confirmApprove) approve(confirmApprove);
          setConfirmApprove(null);
        }}
      />
    </div>
  );
}
