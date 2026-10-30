"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, Plus } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { FilterBar } from "@/components/Shared/FilterBar";
import { showResultToast } from "@/components/Shared/showResultToast";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/money";
import { removeHomeExpert } from "@/services/home-service/removeHomeExpert";
import type {
  ExpertVerification,
  HomeAudience,
  HomeExpertCandidate,
  HomeOffering,
  OwnerHomeExpert,
} from "@/services/home-service/types";
import { ExpertAvatar } from "../HomeCards";
import { AddExpertDialog } from "./AddExpertDialog";
import { ExpertDialog } from "./ExpertDialog";
import { SIDE_LABEL, VERIFICATION_LABEL } from "./format";

const FILTERS = Object.keys(VERIFICATION_LABEL) as ExpertVerification[];

const COLUMNS: Column<OwnerHomeExpert>[] = [
  {
    key: "name",
    header: "Expert",
    mobile: "primary",
    cell: (e) => (
      <span className="flex items-center gap-2.5">
        <ExpertAvatar name={e.staff.name} photo={e.staff.photo} className="size-8 text-xs" />
        <span className="font-medium">{e.staff.name}</span>
      </span>
    ),
    mobileCell: (e) => e.staff.name,
  },
  { key: "side", header: "Side", mobile: "secondary", cell: (e) => SIDE_LABEL[e.audience] },
  {
    key: "services",
    header: "Services",
    mobile: "meta",
    cell: (e) => {
      const n = e.offeringIds?.length ?? 0;
      return `${n} ${n === 1 ? "service" : "services"}`;
    },
  },
  { key: "jobs", header: "Jobs a day", mobile: "meta", cell: (e) => `Up to ${e.maxJobsPerDay} a day` },
  {
    key: "status",
    header: "Status",
    mobile: "trailing",
    cell: (e) => <ToneBadge status={e.verification}>{VERIFICATION_LABEL[e.verification]}</ToneBadge>,
  },
];

/** The branch's home experts. A row opens the expert; adding one goes on to its documents. */
export function ExpertsPanel({
  salonId,
  experts,
  candidates,
  offerings,
  sides,
}: {
  salonId: string;
  experts: OwnerHomeExpert[];
  candidates: HomeExpertCandidate[];
  offerings: HomeOffering[];
  sides: HomeAudience[];
}) {
  const [filter, setFilter] = useState<"ALL" | ExpertVerification>("ALL");
  const [addOpening, setAddOpening] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removing, setRemoving] = useState<OwnerHomeExpert | null>(null);
  const [removal, startRemoval] = useTransition();

  const countOf = (v: ExpertVerification) => experts.filter((e) => e.verification === v).length;
  const chips = [
    { value: "ALL", label: "All", count: experts.length },
    ...FILTERS.map((v) => ({ value: v, label: VERIFICATION_LABEL[v], count: countOf(v) })),
  ];
  const rows = filter === "ALL" ? experts : experts.filter((e) => e.verification === filter);
  const current = experts.find((e) => e.id === openId);

  const manage = (id: string) => {
    setOpenId(id);
    setDialogOpen(true);
  };

  const remove = () => {
    if (!removing) return;
    const { id } = removing;
    startRemoval(async () => {
      const res = await removeHomeExpert(salonId, id);
      setRemoving(null);
      if (!res.success || !res.data) {
        showResultToast(res);
        return;
      }
      setDialogOpen(false);
      const { reassigned, cancelled, refundedMinor, underWay } = res.data.upcoming;
      toast.success(
        res.message,
        reassigned + cancelled + underWay > 0
          ? {
              description: [
                reassigned > 0 && `${reassigned} moved to another expert.`,
                cancelled > 0 && `${cancelled} cancelled, ${formatBDT(refundedMinor)} refunded.`,
                underWay > 0 && `${underWay} already under way.`,
              ]
                .filter(Boolean)
                .join(" "),
              duration: 10_000,
            }
          : undefined,
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setAddOpening((n) => n + 1);
            setAddOpen(true);
          }}
          disabled={candidates.length === 0}
        >
          <Plus aria-hidden="true" />
          Add expert
        </Button>
      </div>

      <FilterBar chips={{ value: filter, options: chips, label: "Status", onChange: (v) => setFilter(v as typeof filter) }} />

      <DataList
        items={rows}
        rowKey={(e) => e.id}
        columns={COLUMNS}
        caption="Home experts"
        rowActions={(e) => (
          <Button size="sm" variant="outline" onClick={() => manage(e.id)}>
            Manage
          </Button>
        )}
        empty={
          <EmptyState
            icon={BadgeCheck}
            title={experts.length ? "No experts here" : "No experts yet"}
            description={
              candidates.length || experts.length
                ? "Add an expert from your staff, then upload their documents for verification."
                : "Add staff to this branch first, then come back to make them experts."
            }
          />
        }
      />

      {addOpening > 0 && (
        <AddExpertDialog
          key={addOpening}
          salonId={salonId}
          candidates={candidates}
          offerings={offerings}
          sides={sides}
          open={addOpen}
          onOpenChange={setAddOpen}
          onCreated={(id) => {
            setAddOpen(false);
            manage(id);
          }}
        />
      )}
      {current && (
        <ExpertDialog
          key={current.id}
          salonId={salonId}
          expert={current}
          offerings={offerings}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onRemove={() => setRemoving(current)}
        />
      )}
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(next) => !next && setRemoving(null)}
        title={`Remove ${removing?.staff.name ?? "this expert"}?`}
        description="Their upcoming visits move to another expert, or are cancelled with 100% back to the customer. You can't remove an expert during a visit."
        confirmLabel="Remove"
        destructive
        pending={removal}
        onConfirm={remove}
      />
    </div>
  );
}
