"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { showResultToast } from "@/components/Shared/showResultToast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { ApiResponse } from "@/lib/api-types";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { deleteHomeOffering } from "@/services/home-service/deleteHomeOffering";
import { toggleHomeOffering } from "@/services/home-service/toggleHomeOffering";
import type { HomeAudience, HomeOffering } from "@/services/home-service/types";
import { CATEGORY_LABEL, durationText } from "../content";
import { SIDE_LABEL } from "./format";
import { OfferingDialog } from "./OfferingDialog";

type Patch = { isActive?: boolean; gone?: boolean };
const NO_PATCHES: Record<string, Patch> = {};

/** The branch's home menu, one side at a time, Ladies first. */
export function MenuPanel({
  salonId,
  offerings,
  sides,
  initialSide,
}: {
  salonId: string;
  offerings: HomeOffering[];
  sides: HomeAudience[];
  initialSide?: HomeAudience;
}) {
  const [side, setSide] = useState(initialSide && sides.includes(initialSide) ? initialSide : sides[0]);
  const [editing, setEditing] = useState<{ offering: HomeOffering | null; opening: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState<HomeOffering | null>(null);
  const [patches, addPatch] = useOptimistic(NO_PATCHES, (current, next: { id: string; patch: Patch }) => ({
    ...current,
    [next.id]: { ...current[next.id], ...next.patch },
  }));
  const [, start] = useTransition();

  const run = (id: string, patch: Patch, action: () => Promise<ApiResponse<unknown>>) =>
    start(async () => {
      addPatch({ id, patch });
      const res = await action();
      if (!res.success) showResultToast(res);
    });

  const edit = (offering: HomeOffering | null) => {
    setEditing((e) => ({ offering, opening: (e?.opening ?? 0) + 1 }));
    setOpen(true);
  };

  const rows = offerings
    .filter((o) => o.audience === side && !patches[o.id]?.gone)
    .map((o) => ({ ...o, ...(patches[o.id]?.isActive !== undefined && { isActive: patches[o.id].isActive }) }));

  const columns: Column<HomeOffering>[] = [
    { key: "name", header: "Service", mobile: "primary", cell: (o) => <span className="font-medium">{o.name}</span> },
    { key: "category", header: "Category", mobile: "secondary", cell: (o) => CATEGORY_LABEL[o.category] },
    { key: "duration", header: "Duration", mobile: "meta", cell: (o) => durationText(o.durationMin) },
    { key: "price", header: "Price", mobile: "meta", align: "right", cell: (o) => formatBDT(o.priceMinor) },
    {
      key: "active",
      header: "On",
      mobile: "trailing",
      cell: (o) => (
        <Switch
          aria-label={`Offer ${o.name}`}
          checked={o.isActive}
          disabled={o.id in patches}
          onCheckedChange={(isActive) => run(o.id, { isActive }, () => toggleHomeOffering(salonId, o.id))}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {sides.length > 1 ? (
          <div role="group" aria-label="Side" className="flex gap-1 rounded-full bg-muted p-1">
            {sides.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={s === side}
                onClick={() => setSide(s)}
                className={cn(
                  "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  s === side ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {SIDE_LABEL[s]}
              </button>
            ))}
          </div>
        ) : (
          <h2 className="font-medium">{SIDE_LABEL[side]} at Home</h2>
        )}
        <Button onClick={() => edit(null)}>
          <Plus aria-hidden="true" />
          Add service
        </Button>
      </div>

      <DataList
        items={rows}
        rowKey={(o) => o.id}
        columns={columns}
        caption={`${SIDE_LABEL[side]} home menu`}
        rowClassName={(o) => cn(o.id in patches && "opacity-70")}
        rowActions={(o) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" aria-label={`Edit ${o.name}`} onClick={() => edit(o)}>
              <Pencil aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Remove ${o.name}`} onClick={() => setRemoving(o)}>
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        )}
        empty={
          <EmptyState
            icon={Sparkles}
            title={`No ${SIDE_LABEL[side]} services yet`}
            description="Add what your experts can do at a customer's home."
          />
        }
      />

      {editing && (
        <OfferingDialog
          key={editing.opening}
          salonId={salonId}
          audience={editing.offering?.audience ?? side}
          offering={editing.offering}
          open={open}
          onOpenChange={setOpen}
        />
      )}
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(next) => !next && setRemoving(null)}
        title={`Remove ${removing?.name ?? "this service"}?`}
        description="It leaves the menu and every expert it was linked to. Booked visits keep it."
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (removing) run(removing.id, { gone: true }, () => deleteHomeOffering(salonId, removing.id));
          setRemoving(null);
        }}
      />
    </div>
  );
}
