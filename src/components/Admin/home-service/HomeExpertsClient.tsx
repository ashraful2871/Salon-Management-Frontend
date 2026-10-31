"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { useClock } from "@/components/Admin/useClock";
import { reasonText } from "@/components/Admin/users/labels";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { FilterBar } from "@/components/Shared/FilterBar";
import { PageHeader } from "@/components/Shared/PageHeader";
import Pagination from "@/components/Shared/Pagination";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import SafeImage from "@/components/Shared/SafeImage";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import { FilterNavigationProvider, useFilterNavigation } from "@/hooks/useFilterNavigation";
import { can } from "@/lib/admin-permissions";
import type { HomeListResponse } from "@/services/home-service/request";
import { rejectHomeExpert } from "@/services/home-service/rejectHomeExpert";
import { setHomeExpertGender } from "@/services/home-service/setHomeExpertGender";
import { suspendHomeExpert } from "@/services/home-service/suspendHomeExpert";
import type { AdminHomeExpertRow, ExpertGender, ExpertVerification } from "@/services/home-service/types";
import { verifyHomeExpert } from "@/services/home-service/verifyHomeExpert";
import { HomeExpertSheet } from "./HomeExpertSheet";
import {
  EXPERT_REJECT_REASONS,
  EXPERT_STATUS_LABELS,
  GENDER_LABELS,
  GENDER_REASONS,
  SIDE_LABELS,
  SUSPEND_REASONS,
  waited,
} from "./labels";
import { useQueueAction } from "./useQueueAction";

const ORDER: ExpertVerification[] = ["PENDING", "VERIFIED", "SUSPENDED", "REJECTED", "DRAFT"];

type Dialog = { kind: "reject" | "suspend" | "gender"; row: AdminHomeExpertRow } | null;

type Props = {
  response: HomeListResponse<AdminHomeExpertRow[]>;
  status: ExpertVerification;
  permissions: string[];
};

export function HomeExpertsClient(props: Props) {
  return (
    <FilterNavigationProvider>
      <Experts {...props} />
    </FilterNavigationProvider>
  );
}

function Experts({ response, status, permissions }: Props) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const now = useClock();
  const { run, dialog: stepUpDialog } = useStepUp();
  const experts = response.success && Array.isArray(response.data) ? response.data : [];
  const { rows, pendingId, act } = useQueueAction(experts);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const canVerify = can(permissions, "homeservice.experts_verify");
  const meta = response.meta;

  const position = openId ? rows.findIndex((r) => r.id === openId) : -1;
  const open = position >= 0 ? rows[position] : null;

  const go = (next: { status?: ExpertVerification; page?: number }) => {
    const params = new URLSearchParams();
    const shown = next.status ?? status;
    if (shown !== "PENDING") params.set("status", shown);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    setOpenId(null);
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  /** After a decision the sheet moves on to the next expert in the queue. */
  const advanceFrom = (id: string) => {
    const at = rows.findIndex((r) => r.id === id);
    const next = rows[at + 1] ?? rows[at - 1];
    setOpenId(next && next.id !== id ? next.id : null);
  };

  const verify = async (row: AdminHomeExpertRow) => {
    const result = await run(() => act(row.id, true, () => verifyHomeExpert(row.id)));
    showResultToast(result);
    if (result.success) advanceFrom(row.id);
  };

  const other: ExpertGender | null = dialog?.kind === "gender" ? (dialog.row.gender === "FEMALE" ? "MALE" : "FEMALE") : null;

  const columns: Column<AdminHomeExpertRow>[] = [
    {
      key: "name",
      header: "Expert",
      mobile: "primary",
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-surface-subtle">
            <SafeImage src={r.staff.photo} alt="" fill sizes="36px" className="object-cover" />
          </div>
          <p className="truncate font-medium">{r.staff.name}</p>
        </div>
      ),
    },
    { key: "salon", header: "Branch", mobile: "secondary", cell: (r) => r.salon.name },
    { key: "gender", header: "Declared", cell: (r) => GENDER_LABELS[r.gender] },
    { key: "side", header: "Side", cell: (r) => SIDE_LABELS[r.audience] },
    {
      key: "docs",
      header: "Documents",
      className: "hidden @3xl:table-cell",
      cell: (r) => `${Object.values(r.docs).filter(Boolean).length} of 3`,
    },
    {
      key: "waiting",
      header: status === "PENDING" ? "Waiting" : "Updated",
      mobile: "eyebrow",
      className: "hidden @3xl:table-cell",
      cell: (r) => waited(status === "PENDING" ? r.submittedAt : r.updatedAt, now),
    },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (r) => <ToneBadge status={r.verification}>{EXPERT_STATUS_LABELS[r.verification]}</ToneBadge>,
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Home experts"
        description="Nobody visits a customer's home until you have checked their ID and selfie. Viewing a document is logged."
      />

      <FilterBar
        pending={isPending}
        chips={{
          value: status,
          options: ORDER.map((value) => ({ value, label: EXPERT_STATUS_LABELS[value] })),
          onChange: (value) => go({ status: value as ExpertVerification }),
          label: "Verification",
        }}
      />

      {!response.success ? (
        <ErrorState title="Couldn't load the experts" message={response.message} />
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
                variant={r.verification === "PENDING" ? "default" : "outline"}
                disabled={pendingId === r.id}
                onClick={() => setOpenId(r.id)}
              >
                {canVerify ? "Review" : "Open"}
              </Button>
            )}
            caption="Home experts"
            empty={
              <EmptyState
                icon={UserCheck}
                title={status === "PENDING" ? "Nobody waiting to be verified" : "No experts here"}
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
          itemLabel="experts"
          disabled={isPending}
          onPageChange={(page) => go({ page })}
        />
      )}

      <HomeExpertSheet
        expert={open}
        position={position}
        total={rows.length}
        canVerify={canVerify}
        pending={!!open && pendingId === open.id}
        onClose={() => setOpenId(null)}
        onStep={(delta) => {
          const next = rows[position + delta];
          if (next) setOpenId(next.id);
        }}
        onVerify={(row) => void verify(row)}
        onDialog={(kind, row) => setDialog({ kind, row })}
      />

      {dialog?.kind === "reject" && (
        <ReasonDialog
          open
          onOpenChange={(next) => !next && setDialog(null)}
          title={`Reject ${dialog.row.staff.name}`}
          description="It goes back to the owner with your reason, to fix and send again."
          reasonCodes={EXPERT_REJECT_REASONS}
          showNotify={false}
          stepUp
          tone="danger"
          confirmLabel="Reject expert"
          onConfirm={(input) =>
            act(dialog.row.id, true, () => rejectHomeExpert(dialog.row.id, reasonText(EXPERT_REJECT_REASONS, input)))
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
          title={`Suspend ${dialog.row.staff.name}`}
          description="They can't be booked from now on."
          impact={
            <p className="rounded-xl border border-warning/30 bg-warning-soft/60 p-3 text-sm text-warning">
              Their upcoming visits move to another expert, or are cancelled with a full refund if nobody is free.
            </p>
          }
          reasonCodes={SUSPEND_REASONS}
          showNotify={false}
          stepUp
          tone="danger"
          confirmLabel="Suspend expert"
          onConfirm={(input) =>
            act(dialog.row.id, true, () => suspendHomeExpert(dialog.row.id, reasonText(SUSPEND_REASONS, input)))
          }
          onDone={(result) => {
            showResultToast(result);
            advanceFrom(dialog.row.id);
          }}
        />
      )}

      {dialog?.kind === "gender" && other && (
        <ReasonDialog
          open
          onOpenChange={(next) => !next && setDialog(null)}
          title={`Change ${dialog.row.staff.name} to ${GENDER_LABELS[other].toLowerCase()}`}
          description={`They move to the ${other === "FEMALE" ? "Ladies" : "Gents"} side and lose the ${SIDE_LABELS[dialog.row.audience]} services they were linked to.`}
          impact={
            <p className="rounded-xl border border-warning/30 bg-warning-soft/60 p-3 text-sm text-warning">
              This suspends them until they are verified again. Their upcoming visits move to another expert, or are
              cancelled with a full refund.
            </p>
          }
          reasonCodes={GENDER_REASONS}
          showNotify={false}
          stepUp
          tone="danger"
          confirmLabel="Change gender"
          onConfirm={(input) =>
            act(dialog.row.id, dialog.row.verification !== "SUSPENDED", () =>
              setHomeExpertGender(dialog.row.id, other, reasonText(GENDER_REASONS, input)),
            )
          }
          onDone={(result) => showResultToast(result)}
        />
      )}

      {stepUpDialog}
    </div>
  );
}
