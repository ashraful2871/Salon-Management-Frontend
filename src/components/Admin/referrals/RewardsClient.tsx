"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { maskEmail } from "@/components/Admin/MaskedValue";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { formatDhaka } from "@/components/Admin/Timeline";
import { reasonText } from "@/components/Admin/users/labels";
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
import { can } from "@/lib/admin-permissions";
import { formatBDT } from "@/lib/money";
import type { AdminReferralListResponse } from "@/services/referral/request";
import { revokeReward } from "@/services/referral/revokeReward";
import type { AdminRewardQuery, AdminRewardRow, RewardKind, RewardStatus } from "@/services/referral/types";
import { GrantRewardDialog, type GrantDefaults } from "./GrantRewardDialog";
import {
  bookingRefText,
  KIND_LABELS,
  REVOKE_REASONS,
  REWARD_KINDS,
  REWARD_STATUSES,
  REWARD_STATUS_LABELS,
  SCOPE_LABELS,
  termsText,
} from "./labels";

const ALL = "ALL";

type Props = {
  response: AdminReferralListResponse<AdminRewardRow[]>;
  filters: AdminRewardQuery;
  permissions: string[];
  grantDefaults: GrantDefaults;
};

export function RewardsClient(props: Props) {
  return (
    <FilterNavigationProvider>
      <Explorer {...props} />
    </FilterNavigationProvider>
  );
}

function Explorer({ response, filters, permissions, grantDefaults }: Props) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const [q, setQ] = useState(filters.q ?? "");
  const [revoking, setRevoking] = useState<AdminRewardRow | null>(null);
  const [granting, setGranting] = useState(false);
  const rows = response.success && Array.isArray(response.data) ? response.data : [];
  const meta = response.meta;
  const canManage = can(permissions, "referrals.manage");
  const canUsers = can(permissions, "users.view");

  const go = (next: Partial<AdminRewardQuery>) => {
    const merged: AdminRewardQuery = { ...filters, page: 1, ...next };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined || value === "" || value === false || (key === "page" && value === 1)) continue;
      params.set(key, String(value));
    }
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const chips: FilterChip[] = [
    { value: ALL, label: "All" },
    ...REWARD_STATUSES.map((s) => ({ value: s, label: REWARD_STATUS_LABELS[s] })),
  ];
  const activeCount = [filters.kind, filters.includeTest].filter(Boolean).length;

  const columns: Column<AdminRewardRow>[] = [
    {
      key: "user",
      header: "Customer",
      mobile: "primary",
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">
            {canUsers ? (
              <Link href={`/dashboard/admin/users/${r.user.id}`} className="hover:underline">
                {r.user.name}
              </Link>
            ) : (
              r.user.name
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground tabular-nums">{maskEmail(r.user.email)}</p>
        </div>
      ),
    },
    { key: "kind", header: "Kind", mobile: "eyebrow", cell: (r) => KIND_LABELS[r.kind] },
    { key: "terms", header: "% / cap", mobile: "secondary", cell: (r) => termsText(r.percent, r.maxDiscountMinor) },
    { key: "scope", header: "Where", className: "hidden @3xl:table-cell", cell: (r) => SCOPE_LABELS[r.scope] },
    { key: "expires", header: "Expires", className: "hidden @3xl:table-cell", cell: (r) => formatDhaka(r.expiresAt) },
    {
      key: "booking",
      header: "Booking",
      className: "hidden @3xl:table-cell",
      cell: (r) =>
        r.booking?.href ? (
          <Link href={r.booking.href} className="text-primary hover:underline">
            {bookingRefText(r.booking)}
          </Link>
        ) : (
          (bookingRefText(r.booking) ?? <span className="text-muted-foreground">—</span>)
        ),
    },
    {
      key: "discount",
      header: "Discount",
      align: "right",
      className: "hidden @3xl:table-cell",
      cell: (r) => (r.discountMinor > 0 ? `−${formatBDT(r.discountMinor)}` : <span className="text-muted-foreground">—</span>),
    },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (r) => <ToneBadge status={r.status}>{REWARD_STATUS_LABELS[r.status]}</ToneBadge>,
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Rewards"
        description="Every referral and granted reward, newest first. A reward keeps the terms it was issued with."
        actions={
          canManage ? (
            <Button onClick={() => setGranting(true)}>
              <Plus aria-hidden /> Grant reward
            </Button>
          ) : undefined
        }
      />

      <FilterBar
        pending={isPending}
        search={{
          value: q,
          onChange: setQ,
          onSubmit: (value) => go({ q: value.trim() || undefined }),
          placeholder: "Code, name, email or reward ID",
          label: "Search rewards",
        }}
        chips={{
          value: filters.status ?? ALL,
          options: chips,
          onChange: (status) => go({ status: status === ALL ? undefined : (status as RewardStatus) }),
          label: "Status",
        }}
        extra={
          <>
            <Select value={filters.kind ?? ALL} onValueChange={(v) => go({ kind: v === ALL ? undefined : (v as RewardKind) })}>
              <SelectTrigger className="w-full md:w-48" aria-label="Kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Every kind</SelectItem>
                {REWARD_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {KIND_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch id="rew-test" checked={!!filters.includeTest} onCheckedChange={(on) => go({ includeTest: on || undefined })} />
              <Label htmlFor="rew-test" className="text-sm font-normal">
                Include test data
              </Label>
            </div>
          </>
        }
        activeCount={activeCount}
        onClear={() => go({ kind: undefined, includeTest: undefined })}
      />

      {!response.success ? (
        <ErrorState title="Couldn't load the rewards" message={response.message} />
      ) : (
        <PendingRegion>
          <DataList
            items={rows}
            rowKey={(r) => r.id}
            columns={columns}
            density="compact"
            tableFrom="3xl"
            rowActions={(r) =>
              canManage && r.canRevoke ? (
                <Button size="sm" variant="outline" onClick={() => setRevoking(r)}>
                  Revoke…
                </Button>
              ) : r.referral ? (
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/dashboard/admin/referrals/list?open=${encodeURIComponent(r.referral.id)}`}>Referral</Link>
                </Button>
              ) : null
            }
            caption="Rewards"
            empty={
              <EmptyState
                icon={Gift}
                title="No rewards match"
                description={activeCount || filters.q || filters.status ? "Try clearing a filter." : undefined}
              />
            }
          />
        </PendingRegion>
      )}

      {meta && (meta.totalPages ?? 1) > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages ?? 1}
          total={meta.total}
          pageSize={meta.limit}
          itemLabel="rewards"
          disabled={isPending}
          onPageChange={(page) => go({ page })}
        />
      )}

      {revoking && (
        <ReasonDialog
          open
          onOpenChange={(next) => !next && setRevoking(null)}
          title={`Revoke ${revoking.user.name}'s reward`}
          description={`${revoking.label} (${termsText(revoking.percent, revoking.maxDiscountMinor)}) stops working at once. The customer is told it was withdrawn.`}
          reasonCodes={REVOKE_REASONS}
          confirmLabel="Revoke reward"
          tone="danger"
          showNotify={false}
          stepUp
          onConfirm={(input) => revokeReward(revoking.id, reasonText(REVOKE_REASONS, input))}
          onDone={(result) => {
            showResultToast(result);
            setRevoking(null);
          }}
        />
      )}

      <GrantRewardDialog open={granting} onOpenChange={setGranting} defaults={grantDefaults} />
    </div>
  );
}
