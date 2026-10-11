"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquareWarning, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  REPORT_REASON_LABELS,
  REVIEW_HIDE_REASONS,
  REVIEW_RESTORE_REASONS,
  hideReasonLabel,
} from "@/components/Admin/reviews/labels";
import { ReasonDialog, type ReasonInput } from "@/components/Admin/ReasonDialog";
import { formatDay } from "@/components/Admin/users/labels";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { FilterBar, type FilterChip } from "@/components/Shared/FilterBar";
import { PageHeader } from "@/components/Shared/PageHeader";
import Pagination from "@/components/Shared/Pagination";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import { FilterNavigationProvider, useFilterNavigation } from "@/hooks/useFilterNavigation";
import type { ApiResponse } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { moderateReview } from "@/services/admin/reviews/moderateReview";
import type {
  AdminReviewFilters,
  AdminReviewListMeta,
  AdminReviewRow,
} from "@/services/admin/reviews/types";

type Props = { response: ApiResponse<AdminReviewRow[]>; filters: AdminReviewFilters };

const ANY = "any";

/** Which rows leave the current tab once a decision is made. */
const leavesTab = (tab: string | undefined, status: "HIDDEN" | "PUBLISHED") =>
  tab === "reported" || (tab === "hidden" && status === "PUBLISHED") || (tab === "low" && status === "HIDDEN");

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          aria-hidden
          className={cn("h-3.5 w-3.5", s <= rating ? "fill-gold text-gold" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  );
}

export function ReviewsClient(props: Props) {
  return (
    <FilterNavigationProvider>
      <ReviewsList {...props} />
    </FilterNavigationProvider>
  );
}

type Decision = { row: AdminReviewRow; status: "HIDDEN" | "PUBLISHED" } | null;
type Change = { id: string; status: "HIDDEN" | "PUBLISHED" };

function ReviewsList({ response, filters }: Props) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const [q, setQ] = useState(filters.q ?? "");
  const [decision, setDecision] = useState<Decision>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const loaded = response.success && Array.isArray(response.data) ? response.data : [];
  const meta = response.meta as unknown as AdminReviewListMeta | undefined;
  const counts = meta?.tabCounts;

  const [rows, applyOptimistic] = useOptimistic(loaded, (state, change: Change) =>
    leavesTab(filters.tab, change.status)
      ? state.filter((r) => r.id !== change.id)
      : state.map((r) => (r.id === change.id ? { ...r, status: change.status } : r)),
  );

  const setPending = (id: string, on: boolean) =>
    setPendingIds((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const go = (next: Partial<AdminReviewFilters>) => {
    const merged: AdminReviewFilters = { ...filters, page: 1, ...next };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined || value === "" || (key === "page" && value === 1)) continue;
      params.set(key, String(value));
    }
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const decide = (row: AdminReviewRow, status: "HIDDEN" | "PUBLISHED", input: ReasonInput) => {
    setPending(row.id, true);
    return new Promise<Awaited<ReturnType<typeof moderateReview>>>((resolve) => {
      startTransition(async () => {
        applyOptimistic({ id: row.id, status });
        const result = await moderateReview(row.id, row.salon.id, {
          status,
          reasonCode: input.reasonCode,
          note: input.note,
          notify: status === "HIDDEN" && input.notify,
        });
        setPending(row.id, false);
        resolve(result);
      });
    });
  };

  const chips: FilterChip[] = [
    { value: "reported", label: "Reported", count: counts?.reported },
    { value: "low", label: "Low ratings", count: counts?.low },
    { value: "all", label: "All" },
    { value: "hidden", label: "Hidden", count: counts?.hidden },
  ];

  const columns: Column<AdminReviewRow>[] = [
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      mobile: "eyebrow",
      cell: (r) => <Stars rating={r.rating} />,
    },
    {
      key: "comment",
      header: "Review",
      mobile: "primary",
      cell: (r) => (
        <div className="min-w-0 max-w-md space-y-1">
          <p className={cn("line-clamp-2 text-sm", !r.comment && "italic text-muted-foreground")}>
            {r.comment || "No comment"}
          </p>
          {r.status === "HIDDEN" && (
            <p className="text-xs text-muted-foreground">Hidden: {hideReasonLabel(r.hiddenReason)}</p>
          )}
          {r.reports.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Reported as {[...new Set(r.reports.map((p) => REPORT_REASON_LABELS[p.reason] ?? p.reason))].join(", ")}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "salon",
      header: "Salon",
      mobile: "secondary",
      cell: (r) => (
        <Link href={`/dashboard/admin/salons/${r.salon.id}`} className="hover:underline">
          {r.salon.name}
        </Link>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (r) => (
        <div className="min-w-0">
          <Link href={`/dashboard/admin/users/${r.customer.id}`} className="block truncate hover:underline">
            {r.customer.name}
          </Link>
          <span className="block truncate text-xs text-muted-foreground">{r.customer.email}</span>
        </div>
      ),
      mobileCell: (r) => r.customer.name,
    },
    {
      key: "reportCount",
      header: "Reports",
      align: "right",
      sortable: true,
      cell: (r) => (r.reportCount > 0 ? <span className="tabular-nums">{r.reportCount}</span> : "—"),
      mobileCell: (r) => (r.reportCount > 0 ? `${r.reportCount} report${r.reportCount === 1 ? "" : "s"}` : null),
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      cell: (r) => formatDay(r.createdAt),
    },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      className: "hidden @5xl:table-cell",
      cell: (r) => <ToneBadge status={r.status} tone={r.status === "HIDDEN" ? "neutral" : "success"} />,
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Reviews"
        description="Hide reviews that break the guidelines. A hidden review keeps its text, leaves the salon's page and stops counting toward its rating."
      />

      <FilterBar
        pending={isPending}
        search={{
          value: q,
          onChange: setQ,
          onSubmit: (value) => go({ q: value.trim() || undefined }),
          placeholder: "Text, salon or customer",
          label: "Search reviews",
        }}
        chips={{
          value: filters.tab ?? "reported",
          options: chips,
          onChange: (tab) => go({ tab, sort: undefined }),
          label: "Tab",
        }}
        extra={
          <>
            <Select value={filters.rating ?? ANY} onValueChange={(v) => go({ rating: v === ANY ? undefined : v })}>
              <SelectTrigger className="w-full md:w-36" aria-label="Rating">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any rating</SelectItem>
                {["1", "2", "3", "4", "5"].map((n) => (
                  <SelectItem key={n} value={n}>
                    {n} star{n === "1" ? "" : "s"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        activeCount={[filters.rating, filters.salonId, filters.includeTest].filter(Boolean).length}
        onClear={() => go({ rating: undefined, salonId: undefined, includeTest: undefined })}
      />

      {!response.success ? (
        <ErrorState title="Couldn't load reviews" message={response.message} />
      ) : (
        <PendingRegion>
          <DataList
            items={rows}
            rowKey={(r) => r.id}
            columns={columns}
            density="compact"
            caption="Reviews"
            rowClassName={(r) => (pendingIds.has(r.id) ? "opacity-60" : "")}
            rowActions={(r) => {
              const pending = pendingIds.has(r.id);
              return (
                <div className="flex justify-end gap-2">
                  {r.status === "PUBLISHED" && filters.tab === "reported" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => setDecision({ row: r, status: "PUBLISHED" })}
                    >
                      Keep
                    </Button>
                  )}
                  {r.status === "PUBLISHED" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => setDecision({ row: r, status: "HIDDEN" })}
                    >
                      Hide
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => setDecision({ row: r, status: "PUBLISHED" })}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              );
            }}
            empty={
              <EmptyState
                icon={MessageSquareWarning}
                title={filters.tab === "reported" ? "No reported reviews" : "No reviews match"}
                description={
                  filters.includeTest !== "true"
                    ? "Test data is hidden. Turn on “Include test data” or clear a filter."
                    : "Try another tab or clear a filter."
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
          itemLabel="reviews"
          disabled={isPending}
          onPageChange={(page) => go({ ...filters, page })}
        />
      )}

      {decision && (
        <ReasonDialog
          open
          onOpenChange={(open) => !open && setDecision(null)}
          title={
            decision.status === "HIDDEN"
              ? "Hide this review"
              : decision.row.status === "HIDDEN"
                ? "Restore this review"
                : "Keep this review up"
          }
          description={
            decision.status === "HIDDEN"
              ? `It leaves ${decision.row.salon.name}'s page and its rating is recalculated. The text is kept.`
              : decision.row.status === "HIDDEN"
                ? `It goes back on ${decision.row.salon.name}'s page and counts toward its rating again.`
                : "It stays up and leaves the Reported queue. A new report brings it back."
          }
          reasonCodes={decision.status === "HIDDEN" ? REVIEW_HIDE_REASONS : REVIEW_RESTORE_REASONS}
          showNotify={decision.status === "HIDDEN"}
          notifyLabel="Notify reviewer (reason only, never who reported it)"
          defaultNotify={false}
          tone={decision.status === "HIDDEN" ? "danger" : "default"}
          confirmLabel={decision.status === "HIDDEN" ? "Hide review" : decision.row.status === "HIDDEN" ? "Restore" : "Keep"}
          onConfirm={(input) => decide(decision.row, decision.status, input)}
          onDone={(result) => showResultToast(result)}
        />
      )}
    </div>
  );
}
