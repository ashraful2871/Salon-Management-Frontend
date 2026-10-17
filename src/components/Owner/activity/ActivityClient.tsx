"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { History } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { FilterBar } from "@/components/Shared/FilterBar";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { getOwnerActivity } from "@/services/owner/getOwnerActivity";
import {
  ACTIVITY_GROUPS,
  ACTIVITY_RANGES,
  type ActivityFilters,
  type ActivityItem,
} from "@/services/owner/activity-types";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const ROLE_WORDS: Record<string, string> = {
  SALON_OWNER: "Owner",
  BRANCH_MANAGER: "Manager",
  STAFF: "Staff",
  SYSTEM: "Automatic",
};

/**
 * Who did what at the branch(es) in view. Group, person and range live in
 * the URL (`action`, `actor`, `range`); "Load more" appends the next page.
 */
export function ActivityClient({
  initial,
  nextCursor: initialCursor,
  actors,
  filters,
  range,
  showBranch,
}: {
  initial: ActivityItem[];
  nextCursor: string | null;
  actors: { id: string; name: string }[];
  filters: ActivityFilters;
  range: string;
  showBranch: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate, isPending } = useFilterNavigation();
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, startLoading] = useTransition();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const loadMore = () =>
    startLoading(async () => {
      if (!cursor) return;
      const result = await getOwnerActivity(filters, cursor);
      if (!result.success || !result.data) {
        toast.error(result.message || "Couldn't load more.");
        return;
      }
      setItems((rows) => [...rows, ...result.data!.items]);
      setCursor(result.data.nextCursor);
    });

  const activeCount = [filters.action, filters.actor, range !== "30d" ? range : null].filter(Boolean).length;

  const columns: Column<ActivityItem>[] = [
    {
      key: "at",
      header: "Time",
      mobile: "eyebrow",
      cell: (a) => <span className="whitespace-nowrap tabular-nums">{when(a.at)}</span>,
    },
    {
      key: "who",
      header: "Who",
      mobile: "primary",
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{a.actor.name}</p>
          <p className="text-xs text-muted-foreground">{ROLE_WORDS[a.actor.role] ?? a.actor.role}</p>
        </div>
      ),
      mobileCell: (a) => a.actor.name,
    },
    ...(showBranch
      ? [
          {
            key: "branch",
            header: "Branch",
            mobile: "meta" as const,
            cell: (a: ActivityItem) => <span className="truncate">{a.salon?.name ?? "—"}</span>,
            mobileCell: (a: ActivityItem) => a.salon?.name ?? null,
          },
        ]
      : []),
    {
      key: "what",
      header: "What",
      mobile: "secondary",
      cell: (a) => (
        <span>
          {a.text}
          {a.detail && <span className="text-muted-foreground"> {a.detail}</span>}
        </span>
      ),
      mobileCell: (a) => `${a.text}${a.detail ? ` ${a.detail}` : ""}`,
    },
    {
      key: "link",
      header: "",
      align: "right",
      mobile: "trailing",
      cell: (a) =>
        a.link ? (
          <Link href={a.link} className="text-sm font-medium text-primary-hover underline-offset-4 hover:underline">
            Open
          </Link>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        chips={{
          value: filters.action ?? "all",
          options: [{ value: "all", label: "Everything" }, ...ACTIVITY_GROUPS],
          onChange: (value) => setParam("action", value === "all" ? null : value),
          label: "Kind of action",
        }}
        extra={
          <div className="flex flex-col gap-2 md:flex-row">
            <Select value={filters.actor ?? "all"} onValueChange={(v) => setParam("actor", v === "all" ? null : v)}>
              <SelectTrigger className="md:w-52" aria-label="Who">
                <SelectValue placeholder="Anyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Anyone</SelectItem>
                {actors.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={(v) => setParam("range", v === "30d" ? null : v)}>
              <SelectTrigger className="md:w-44" aria-label="When">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        activeCount={activeCount}
        onClear={() => navigate(pathname)}
        pending={isPending}
      />

      <PendingRegion pending={isPending}>
        <DataList
          items={items}
          rowKey={(a) => a.id}
          columns={columns}
          caption="Activity"
          tableFrom="3xl"
          empty={
            <EmptyState
              icon={History}
              title="Nothing here"
              description={
                activeCount > 0
                  ? "Nothing matches these filters."
                  : "Check-ins, bookings, team and branch changes show up here as they happen."
              }
            />
          }
        />
      </PendingRegion>

      {cursor && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
