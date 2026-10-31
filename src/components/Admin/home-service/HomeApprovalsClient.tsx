"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClock } from "@/components/Admin/useClock";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { reasonText } from "@/components/Admin/users/labels";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { FilterBar } from "@/components/Shared/FilterBar";
import { PageHeader } from "@/components/Shared/PageHeader";
import Pagination from "@/components/Shared/Pagination";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import { FilterNavigationProvider, useFilterNavigation } from "@/hooks/useFilterNavigation";
import { can } from "@/lib/admin-permissions";
import { approveHomeProfile } from "@/services/home-service/approveHomeProfile";
import type { HomeListResponse } from "@/services/home-service/request";
import { rejectHomeProfile } from "@/services/home-service/rejectHomeProfile";
import { suspendHomeProfile } from "@/services/home-service/suspendHomeProfile";
import type { AdminHomeProfileRow, HomeServiceStatus } from "@/services/home-service/types";
import { unsuspendHomeProfile } from "@/services/home-service/unsuspendHomeProfile";
import { HomeProfileSheet, expertTally } from "./HomeProfileSheet";
import { BRANCH_REASONS, BRANCH_STATUS_LABELS, SUSPEND_REASONS, UNSUSPEND_REASONS, waited } from "./labels";
import { useQueueAction } from "./useQueueAction";

export type BranchStatus = Exclude<HomeServiceStatus, "DRAFT">;

const ORDER: BranchStatus[] = ["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"];

type Dialog = { kind: "reject" | "suspend" | "unsuspend"; row: AdminHomeProfileRow } | null;

type Props = {
  response: HomeListResponse<AdminHomeProfileRow[]>;
  status: BranchStatus;
  permissions: string[];
};

export function HomeApprovalsClient(props: Props) {
  return (
    <FilterNavigationProvider>
      <Approvals {...props} />
    </FilterNavigationProvider>
  );
}

function Approvals({ response, status, permissions }: Props) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const now = useClock();
  const { run, dialog: stepUpDialog } = useStepUp();
  const profiles = response.success && Array.isArray(response.data) ? response.data : [];
  const { rows, pendingId, act } = useQueueAction(profiles);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [confirmApprove, setConfirmApprove] = useState<AdminHomeProfileRow | null>(null);
  const canManage = can(permissions, "homeservice.manage");
  const meta = response.meta;

  const position = openId ? rows.findIndex((r) => r.id === openId) : -1;
  const open = position >= 0 ? rows[position] : null;

  const go = (next: { status?: BranchStatus; page?: number }) => {
    const params = new URLSearchParams();
    const shown = next.status ?? status;
    if (shown !== "PENDING_REVIEW") params.set("status", shown);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    setOpenId(null);
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  /** After a decision the sheet moves on to the next branch in the queue. */
  const advanceFrom = (id: string) => {
    const at = rows.findIndex((r) => r.id === id);
    const next = rows[at + 1] ?? rows[at - 1];
    setOpenId(next && next.id !== id ? next.id : null);
  };

  const approve = async (row: AdminHomeProfileRow) => {
    const result = await run(() => act(row.id, true, () => approveHomeProfile(row.id)));
    showResultToast(result);
    if (result.success) advanceFrom(row.id);
  };

  const requestApprove = (row: AdminHomeProfileRow) => {
    if (row.checklist.every((c) => c.ok)) void approve(row);
    else setConfirmApprove(row);
  };

  const columns: Column<AdminHomeProfileRow>[] = [
    {
      key: "salon",
      header: "Branch",
      mobile: "primary",
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">
            {r.salon.name}
            {r.salon.isTest && <span className="ml-2 text-xs font-normal text-muted-foreground">test</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[r.salon.area, r.salon.district].filter(Boolean).join(", ")}
          </p>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      mobile: "secondary",
      className: "hidden @3xl:table-cell",
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate">{r.owner?.name ?? "—"}</p>
          <p className="truncate text-xs text-muted-foreground">{r.owner?.email}</p>
        </div>
      ),
    },
    {
      key: "sides",
      header: "Sides",
      cell: (r) => [r.sides.ladies && "Ladies", r.sides.gents && "Gents"].filter(Boolean).join(" · ") || "—",
    },
    {
      key: "checklist",
      header: "Checklist",
      cell: (r) => {
        const done = r.checklist.filter((c) => c.ok).length;
        return (
          <ToneBadge status="CHECKLIST" tone={done === r.checklist.length ? "success" : "warning"}>
            {done} of {r.checklist.length}
          </ToneBadge>
        );
      },
    },
    { key: "experts", header: "Experts", cell: (r) => expertTally(r) },
    {
      key: "waiting",
      header: status === "PENDING_REVIEW" ? "Waiting" : "Updated",
      mobile: "eyebrow",
      className: "hidden @3xl:table-cell",
      cell: (r) => waited(r.updatedAt, now),
    },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (r) => <ToneBadge status={r.status}>{BRANCH_STATUS_LABELS[r.status as BranchStatus] ?? r.status}</ToneBadge>,
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Home Service approvals"
        description="Branches asking to offer home visits. A branch shows to customers only after you approve its first turn-on."
      />

      <FilterBar
        pending={isPending}
        chips={{
          value: status,
          options: ORDER.map((value) => ({ value, label: BRANCH_STATUS_LABELS[value] })),
          onChange: (value) => go({ status: value as BranchStatus }),
          label: "Status",
        }}
      />

      {!response.success ? (
        <ErrorState title="Couldn't load the branches" message={response.message} />
      ) : (
        <PendingRegion>
          <DataList
            items={rows}
            rowKey={(r) => r.id}
            columns={columns}
            density="compact"
            tableFrom="3xl"
            rowActions={(r) => (
              <Button
                size="sm"
                variant={r.status === "PENDING_REVIEW" ? "default" : "outline"}
                disabled={pendingId === r.id}
                onClick={() => setOpenId(r.id)}
              >
                Review
              </Button>
            )}
            caption="Home Service branches"
            empty={
              <EmptyState
                icon={ClipboardCheck}
                title={status === "PENDING_REVIEW" ? "Nothing waiting for review" : "No branches here"}
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
          itemLabel="branches"
          disabled={isPending}
          onPageChange={(page) => go({ page })}
        />
      )}

      <HomeProfileSheet
        row={open}
        position={position}
        total={rows.length}
        canManage={canManage}
        canSeeUsers={can(permissions, "users.view")}
        pending={!!open && pendingId === open.id}
        onClose={() => setOpenId(null)}
        onStep={(delta) => {
          const next = rows[position + delta];
          if (next) setOpenId(next.id);
        }}
        onApprove={requestApprove}
        onDialog={(kind, row) => setDialog({ kind, row })}
      />

      {dialog?.kind === "reject" && (
        <ReasonDialog
          open
          onOpenChange={(next) => !next && setDialog(null)}
          title={`Reject ${dialog.row.salon.name}`}
          description="Home Service turns off for this branch. The owner gets an email with your reason, and can fix it and turn on again."
          reasonCodes={BRANCH_REASONS}
          showNotify={false}
          stepUp
          tone="danger"
          confirmLabel="Reject branch"
          onConfirm={(input) =>
            act(dialog.row.id, true, () => rejectHomeProfile(dialog.row.id, reasonText(BRANCH_REASONS, input)))
          }
          onDone={(result) => {
            showResultToast(result);
            advanceFrom(dialog.row.id);
          }}
        />
      )}

      {dialog?.kind === "suspend" && (
        <ReasonDialog
          open
          onOpenChange={(next) => !next && setDialog(null)}
          title={`Suspend ${dialog.row.salon.name}`}
          description="It disappears from Home Service at once and the owner can't turn it back on. The owner gets an email."
          impact={
            <p className="rounded-xl border border-warning/30 bg-warning-soft/60 p-3 text-sm text-warning">
              Every upcoming visit of this branch is cancelled with a full refund. Visits under way go ahead.
            </p>
          }
          reasonCodes={SUSPEND_REASONS}
          showNotify={false}
          stepUp
          tone="danger"
          confirmLabel="Suspend branch"
          onConfirm={(input) =>
            act(dialog.row.id, true, () => suspendHomeProfile(dialog.row.id, reasonText(SUSPEND_REASONS, input)))
          }
          onDone={(result) => {
            showResultToast(result);
            advanceFrom(dialog.row.id);
          }}
        />
      )}

      {dialog?.kind === "unsuspend" && (
        <ReasonDialog
          open
          onOpenChange={(next) => !next && setDialog(null)}
          title={`Unsuspend ${dialog.row.salon.name}`}
          description={
            dialog.row.everApproved
              ? "It goes back to live straight away."
              : "It was never approved, so it goes back to the review queue if the owner has it on."
          }
          reasonCodes={UNSUSPEND_REASONS}
          showNotify={false}
          stepUp
          confirmLabel="Unsuspend branch"
          onConfirm={(input) =>
            act(dialog.row.id, true, () => unsuspendHomeProfile(dialog.row.id, reasonText(UNSUSPEND_REASONS, input)))
          }
          onDone={(result) => {
            showResultToast(result);
            advanceFrom(dialog.row.id);
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmApprove}
        onOpenChange={(next) => !next && setConfirmApprove(null)}
        title={`Approve ${confirmApprove?.salon.name ?? "this branch"}?`}
        description={`Still missing: ${
          confirmApprove
            ? confirmApprove.checklist
                .filter((c) => !c.ok)
                .map((c) => c.hint)
                .join(" ")
            : ""
        } It goes live anyway.`}
        confirmLabel="Approve anyway"
        onConfirm={() => {
          if (confirmApprove) void approve(confirmApprove);
          setConfirmApprove(null);
        }}
      />

      {stepUpDialog}
    </div>
  );
}
