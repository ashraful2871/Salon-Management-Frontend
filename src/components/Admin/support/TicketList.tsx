"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { timeAgo } from "@/components/Admin/users/labels";
import { useClock } from "@/components/Admin/useClock";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { FilterBar, type FilterChip } from "@/components/Shared/FilterBar";
import Pagination from "@/components/Shared/Pagination";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import type { ApiResponse } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import type {
  AdminTicketFilters,
  AdminTicketListMeta,
  AdminTicketRow,
  SupportAssignee,
} from "@/services/admin/support/types";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_ORDER,
  TICKET_PRIORITY_TONE,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_ORDER,
  TICKET_STATUS_TONE,
} from "./labels";

const BASE = "/dashboard/admin/support";
const ACTIVE = "active";
const ANY = "any";

/** The filters as a query string, so a ticket link keeps the list as it is. */
export const ticketQuery = (filters: AdminTicketFilters) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "" || (key === "page" && value === 1)) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
};

/**
 * The left pane of the support inbox: filters, then one row per ticket. The
 * default view is everything still open (OPEN + PENDING).
 */
export function TicketList({
  response,
  filters,
  selectedId,
  assignees,
}: {
  response: ApiResponse<AdminTicketRow[]>;
  filters: AdminTicketFilters;
  selectedId?: string;
  assignees: SupportAssignee[];
}) {
  const pathname = usePathname();
  const now = useClock();
  const { navigate, isPending } = useFilterNavigation();
  const [q, setQ] = useState(filters.q ?? "");

  const rows = response.success && Array.isArray(response.data) ? response.data : [];
  const meta = response.meta as unknown as AdminTicketListMeta | undefined;
  const counts = meta?.statusCounts ?? {};

  const go = (next: Partial<AdminTicketFilters>) =>
    navigate(`${pathname}${ticketQuery({ ...filters, page: 1, ...next })}`);

  const chips: FilterChip[] = [
    { value: ACTIVE, label: "Active", count: (counts.OPEN ?? 0) + (counts.PENDING ?? 0) },
    ...TICKET_STATUS_ORDER.map((s) => ({ value: s, label: TICKET_STATUS_LABELS[s], count: counts[s] ?? 0 })),
  ];

  return (
    <div className="min-w-0 space-y-4">
      <FilterBar
        pending={isPending}
        search={{
          value: q,
          onChange: setQ,
          onSubmit: (value) => go({ q: value.trim() || undefined }),
          placeholder: "#number, subject, name or email",
          label: "Search tickets",
        }}
        chips={{
          value: filters.status ?? ACTIVE,
          options: chips,
          onChange: (status) => go({ status: status === ACTIVE ? undefined : status }),
          label: "Status",
        }}
        extra={
          <>
            <Select value={filters.assignee ?? ANY} onValueChange={(v) => go({ assignee: v === ANY ? undefined : v })}>
              <SelectTrigger className="w-full md:w-40" aria-label="Assignee">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Anyone</SelectItem>
                <SelectItem value="me">Assigned to me</SelectItem>
                <SelectItem value="none">Unassigned</SelectItem>
                {assignees.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.category ?? ANY} onValueChange={(v) => go({ category: v === ANY ? undefined : v })}>
              <SelectTrigger className="w-full md:w-36" aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any category</SelectItem>
                {Object.entries(TICKET_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.priority ?? ANY} onValueChange={(v) => go({ priority: v === ANY ? undefined : v })}>
              <SelectTrigger className="w-full md:w-36" aria-label="Priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any priority</SelectItem>
                {TICKET_PRIORITY_ORDER.map((p) => (
                  <SelectItem key={p} value={p}>
                    {TICKET_PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        activeCount={[filters.assignee, filters.category, filters.priority].filter(Boolean).length}
        onClear={() => go({ assignee: undefined, category: undefined, priority: undefined })}
      />

      {!response.success ? (
        <ErrorState title="Couldn't load tickets" message={response.message} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Inbox} title="No tickets here" description="Contact-form messages arrive here as tickets." />
      ) : (
        <PendingRegion>
          <ul className="divide-y rounded-2xl border bg-surface">
            {rows.map((t) => (
              <li key={t.id}>
                <Link
                  href={`${BASE}/${t.id}${ticketQuery(filters)}`}
                  aria-current={t.id === selectedId ? "page" : undefined}
                  className={cn(
                    "block space-y-1.5 px-4 py-3 transition-colors hover:bg-surface-subtle",
                    t.id === selectedId && "bg-primary-soft hover:bg-primary-soft",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium">
                      <span className="text-muted-foreground tabular-nums">#{t.number}</span> {t.subject}
                    </p>
                    <ToneBadge status={t.status} tone={TICKET_STATUS_TONE[t.status]}>
                      {TICKET_STATUS_LABELS[t.status]}
                    </ToneBadge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.name} · {TICKET_CATEGORY_LABELS[t.category] ?? t.category} ·{" "}
                    {now == null ? "" : timeAgo(t.createdAt, now)} · {t.assigneeName ?? "Unassigned"}
                  </p>
                  {(t.slaBreached || t.priority === "HIGH" || t.priority === "URGENT") && (
                    <div className="flex flex-wrap gap-1.5">
                      {t.slaBreached && (
                        <ToneBadge status="SLA" tone="warning" dot>
                          No reply in 24 h
                        </ToneBadge>
                      )}
                      {(t.priority === "HIGH" || t.priority === "URGENT") && (
                        <ToneBadge status={t.priority} tone={TICKET_PRIORITY_TONE[t.priority]}>
                          {TICKET_PRIORITY_LABELS[t.priority]}
                        </ToneBadge>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </PendingRegion>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          pageSize={meta.limit}
          itemLabel="tickets"
          disabled={isPending}
          onPageChange={(page) => go({ ...filters, page })}
        />
      )}
    </div>
  );
}
