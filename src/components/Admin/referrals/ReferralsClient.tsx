"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { maskEmail } from "@/components/Admin/MaskedValue";
import { formatDhaka } from "@/components/Admin/Timeline";
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
import type { AdminReferralListResponse } from "@/services/referral/request";
import { loadAdminReferral } from "@/services/referral/loadAdminReferral";
import type { AdminReferralDetail, AdminReferralQuery, AdminReferralRow, ReferralStatus } from "@/services/referral/types";
import { CHANNEL_LABELS, REFERRAL_STATUSES, REFERRAL_STATUS_LABELS, REWARD_STATUS_LABELS, SKIP_LABELS } from "./labels";
import { ReferralDecisionDialog, type Decision } from "./ReferralDecisionDialog";
import { ReferralSheet } from "./ReferralSheet";

const ALL = "ALL";

type Props = {
  response: AdminReferralListResponse<AdminReferralRow[]>;
  filters: AdminReferralQuery;
  permissions: string[];
  /** `?open=<id>` (the API's `href` for a referral): the sheet starts open on it. */
  initial: { id: string; detail: AdminReferralDetail | null; error: string | null } | null;
};

export function ReferralsClient(props: Props) {
  return (
    <FilterNavigationProvider>
      <Explorer {...props} />
    </FilterNavigationProvider>
  );
}

function Explorer({ response, filters, permissions, initial }: Props) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const [q, setQ] = useState(filters.q ?? "");
  const [openId, setOpenId] = useState<string | null>(initial?.id ?? null);
  const [detail, setDetail] = useState<AdminReferralDetail | null>(initial?.detail ?? null);
  const [error, setError] = useState<string | null>(initial?.error ?? null);
  const [loading, startLoading] = useTransition();
  const [decision, setDecision] = useState<Decision | null>(null);
  const rows = response.success && Array.isArray(response.data) ? response.data : [];
  const meta = response.meta;

  const canManage = can(permissions, "referrals.manage");
  const canUsers = can(permissions, "users.view");
  const canReveal = can(permissions, "users.view_pii");

  const go = (next: Partial<AdminReferralQuery>) => {
    const merged: AdminReferralQuery = { ...filters, page: 1, ...next };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined || value === "" || value === false || (key === "page" && value === 1)) continue;
      params.set(key, String(value));
    }
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const open = (id: string) => {
    setOpenId(id);
    if (detail?.id !== id) setDetail(null);
    setError(null);
    startLoading(async () => {
      const result = await loadAdminReferral(id);
      if (result.success && result.data) setDetail(result.data);
      else setError(result.message);
    });
  };

  const chips: FilterChip[] = [
    { value: ALL, label: "All" },
    ...REFERRAL_STATUSES.map((s) => ({ value: s, label: REFERRAL_STATUS_LABELS[s] })),
  ];
  const activeCount = [filters.flagged, filters.from, filters.to, filters.includeTest].filter(Boolean).length;

  const columns: Column<AdminReferralRow>[] = [
    {
      key: "people",
      header: "Referrer → friend",
      mobile: "primary",
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">
            {r.referrer.name} <span aria-hidden>→</span>
            <span className="sr-only">referred</span> {r.referee.name}
            {r.isTest && <span className="ml-2 text-xs font-normal text-muted-foreground">test</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground tabular-nums">
            {maskEmail(r.referrer.email)} · {maskEmail(r.referee.email)}
          </p>
        </div>
      ),
    },
    { key: "created", header: "Created", mobile: "eyebrow", cell: (r) => formatDhaka(r.createdAt) },
    {
      key: "channel",
      header: "Channel",
      className: "hidden @3xl:table-cell",
      cell: (r) => (
        <span>
          {CHANNEL_LABELS[r.channel]} <code className="ml-1 font-mono text-xs text-muted-foreground">{r.code}</code>
        </span>
      ),
    },
    {
      key: "flags",
      header: "Flags",
      mobile: "secondary",
      cell: (r) =>
        r.riskFlags.length ? (
          <ToneBadge status="flagged" tone="warning">
            {r.riskFlags.length} flag{r.riskFlags.length === 1 ? "" : "s"}
          </ToneBadge>
        ) : (
          <span className="text-muted-foreground">None</span>
        ),
    },
    {
      key: "booking",
      header: "First booking",
      className: "hidden @3xl:table-cell",
      cell: (r) => (r.qualifiedAt ? formatDhaka(r.qualifiedAt) : <span className="text-muted-foreground">Not yet</span>),
    },
    {
      key: "reward",
      header: "Referrer reward",
      className: "hidden @3xl:table-cell",
      cell: (r) => {
        const bonus = r.rewards.find((w) => w.kind === "REFERRER_BONUS");
        if (bonus) return <ToneBadge status={bonus.status}>{REWARD_STATUS_LABELS[bonus.status]}</ToneBadge>;
        if (r.referrerRewardSkip) return <span className="text-xs text-muted-foreground">{SKIP_LABELS[r.referrerRewardSkip]}</span>;
        return <span className="text-muted-foreground">—</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (r) => <ToneBadge status={r.status}>{REFERRAL_STATUS_LABELS[r.status]}</ToneBadge>,
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="All referrals"
        description="Every code attached at sign-up, newest first. Open one for both people, its risk flags, the qualifying booking and its timeline."
      />

      <FilterBar
        pending={isPending}
        search={{
          value: q,
          onChange: setQ,
          onSubmit: (value) => go({ q: value.trim() || undefined }),
          placeholder: canReveal ? "Code, name or email" : "Code or name",
          label: "Search referrals",
        }}
        chips={{
          value: filters.status ?? ALL,
          options: chips,
          onChange: (status) => go({ status: status === ALL ? undefined : (status as ReferralStatus) }),
          label: "Status",
        }}
        extra={
          <>
            <div className="flex items-center gap-2">
              <Switch
                id="ref-flagged"
                checked={!!filters.flagged}
                onCheckedChange={(on) => go({ flagged: on || undefined })}
              />
              <Label htmlFor="ref-flagged" className="text-sm font-normal">
                Flagged only
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="ref-from" className="shrink-0 text-xs text-muted-foreground">
                Created
              </Label>
              <Input
                id="ref-from"
                type="date"
                aria-label="Created from"
                className="w-full md:w-36"
                value={filters.from ?? ""}
                onChange={(e) => go({ from: e.target.value || undefined })}
              />
              <Input
                type="date"
                aria-label="Created to"
                className="w-full md:w-36"
                value={filters.to ?? ""}
                onChange={(e) => go({ to: e.target.value || undefined })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="ref-test"
                checked={!!filters.includeTest}
                onCheckedChange={(on) => go({ includeTest: on || undefined })}
              />
              <Label htmlFor="ref-test" className="text-sm font-normal">
                Include test data
              </Label>
            </div>
          </>
        }
        activeCount={activeCount}
        onClear={() => go({ flagged: undefined, from: undefined, to: undefined, includeTest: undefined })}
      />

      {!response.success ? (
        <ErrorState title="Couldn't load the referrals" message={response.message} />
      ) : (
        <PendingRegion>
          <DataList
            items={rows}
            rowKey={(r) => r.id}
            columns={columns}
            density="compact"
            tableFrom="3xl"
            rowClassName={(r) => (r.id === openId ? "bg-primary-soft/40" : "")}
            rowActions={(r) => (
              <Button size="sm" variant={r.heldForReview && canManage ? "default" : "outline"} onClick={() => open(r.id)}>
                {r.heldForReview && canManage ? "Review" : "Open"}
              </Button>
            )}
            caption="Referrals"
            empty={
              <EmptyState
                icon={Gift}
                title="No referrals match"
                description={activeCount || filters.q || filters.status ? "Try clearing a filter." : "Nobody has signed up with a code yet."}
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
          itemLabel="referrals"
          disabled={isPending}
          onPageChange={(page) => go({ page })}
        />
      )}

      <ReferralSheet
        open={!!openId}
        detail={detail?.id === openId ? detail : null}
        error={error}
        loading={loading}
        canManage={canManage}
        canUsers={canUsers}
        canReveal={canReveal}
        onClose={() => setOpenId(null)}
        onDecide={(kind, d) => setDecision({ kind, id: d.id, who: d.referrer.name })}
      />

      <ReferralDecisionDialog
        decision={decision}
        onClose={() => setDecision(null)}
        onDone={(result, d) => {
          showResultToast(result);
          setDecision(null);
          open(d.id);
        }}
      />
    </div>
  );
}
