"use client";

import Link from "next/link";
import { Check, ChevronDown, ChevronUp, ExternalLink, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDhaka } from "@/components/Admin/Timeline";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { AdminHomeProfileRow, ExpertVerification, HomeAudience } from "@/services/home-service/types";
import { BRANCH_STATUS_LABELS, SIDE_LABELS } from "./labels";

const count = (row: AdminHomeProfileRow, side: HomeAudience, state: ExpertVerification) =>
  row.experts[side][state] ?? 0;

/** "Ladies 3 · Gents 1": verified experts on the branch's sides. */
export const expertTally = (row: AdminHomeProfileRow) =>
  (["LADIES", "GENTS"] as const)
    .filter((side) => (side === "LADIES" ? row.sides.ladies : row.sides.gents))
    .map((side) => `${SIDE_LABELS[side]} ${count(row, side, "VERIFIED")}`)
    .join(" · ") || "—";

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right break-words">{children}</dd>
  </div>
);

/** The approval queue's side panel; decisions open their dialogs in the parent. */
export function HomeProfileSheet({
  row,
  position,
  total,
  canManage,
  canSeeUsers,
  pending,
  onClose,
  onStep,
  onApprove,
  onDialog,
}: {
  row: AdminHomeProfileRow | null;
  position: number;
  total: number;
  canManage: boolean;
  canSeeUsers: boolean;
  pending: boolean;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
  onApprove: (row: AdminHomeProfileRow) => void;
  onDialog: (kind: "reject" | "suspend" | "unsuspend", row: AdminHomeProfileRow) => void;
}) {
  return (
    <Sheet open={!!row} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex h-dvh w-full max-w-none flex-col gap-0 p-0 sm:max-w-xl">
        {row && (
          <>
            <SheetHeader className="border-b border-border px-5 py-4 text-left">
              <SheetTitle className="truncate pr-8">{row.salon.name}</SheetTitle>
              <SheetDescription className="truncate">
                {[row.salon.area, row.salon.district].filter(Boolean).join(", ")}
              </SheetDescription>
              <div className="flex items-center justify-between gap-2 pt-2">
                <ToneBadge status={row.status}>
                  {BRANCH_STATUS_LABELS[row.status as keyof typeof BRANCH_STATUS_LABELS] ?? row.status}
                </ToneBadge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>
                    {position + 1} of {total}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Previous branch"
                    disabled={position <= 0}
                    onClick={() => onStep(-1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Next branch"
                    disabled={position >= total - 1}
                    onClick={() => onStep(1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <section aria-labelledby="home-checklist-title" className="space-y-2">
                <h3 id="home-checklist-title" className="text-sm font-semibold">
                  Checklist
                </h3>
                <ul className="space-y-1.5 text-sm">
                  {row.checklist.map((item) => (
                    <li key={item.key} className="flex items-start gap-2">
                      {item.ok ? (
                        <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                      ) : (
                        <X aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
                      )}
                      <span className={cn(!item.ok && "text-danger")}>{item.hint}</span>
                      <span className="sr-only">{item.ok ? "done" : "missing"}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section aria-labelledby="home-branch-title" className="space-y-1">
                <h3 id="home-branch-title" className="text-sm font-semibold">
                  Branch
                </h3>
                <dl className="divide-y divide-border">
                  <Fact label="Sides">
                    {[row.sides.ladies && "Ladies", row.sides.gents && "Gents"].filter(Boolean).join(" · ") || "None"}
                  </Fact>
                  {(["LADIES", "GENTS"] as const).map((side) => (
                    <Fact key={side} label={`${SIDE_LABELS[side]} experts`}>
                      {count(row, side, "VERIFIED")} verified · {count(row, side, "PENDING")} waiting
                    </Fact>
                  ))}
                  <Fact label="Radius">{row.radiusKm} km</Fact>
                  <Fact label="Travel fee">{row.travelFeeMinor > 0 ? formatBDT(row.travelFeeMinor) : "None"}</Fact>
                  <Fact label="Minimum order">{formatBDT(row.minOrderMinor)}</Fact>
                  <Fact label="Hours">
                    {row.dayStart}–{row.dayEnd}
                  </Fact>
                  {row.reviewedAt && <Fact label="Last reviewed">{formatDhaka(row.reviewedAt)}</Fact>}
                </dl>
              </section>

              <section aria-labelledby="home-owner-title" className="space-y-1">
                <h3 id="home-owner-title" className="text-sm font-semibold">
                  Owner
                </h3>
                {row.owner ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.owner.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.owner.email}</p>
                    </div>
                    {canSeeUsers && (
                      <Link
                        href={`/dashboard/admin/users/${row.owner.id}`}
                        className="shrink-0 text-xs text-primary hover:underline"
                      >
                        Open
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unknown owner.</p>
                )}
              </section>

              {(row.statusReason || row.suspendedReason) && (
                <section className="space-y-1">
                  <h3 className="text-sm font-semibold">Last decision</h3>
                  <p className="text-sm text-muted-foreground">{row.suspendedReason ?? row.statusReason}</p>
                </section>
              )}

              <Link
                href={`/dashboard/admin/salons/${row.salon.id}`}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Open the full salon page
                <ExternalLink aria-hidden className="size-3.5" />
              </Link>
            </div>

            {canManage && (
              <SheetFooter className="flex-row flex-wrap justify-end gap-2 border-t border-border px-5 py-3">
                {row.status === "SUSPENDED" ? (
                  <Button disabled={pending} onClick={() => onDialog("unsuspend", row)}>
                    Unsuspend…
                  </Button>
                ) : (
                  <Button variant="outline" disabled={pending} onClick={() => onDialog("suspend", row)}>
                    Suspend…
                  </Button>
                )}
                {row.status === "PENDING_REVIEW" && (
                  <>
                    <Button variant="outline" disabled={pending} onClick={() => onDialog("reject", row)}>
                      Reject…
                    </Button>
                    <Button disabled={pending} onClick={() => onApprove(row)}>
                      {pending && <Loader2 aria-hidden className="animate-spin" />}
                      Approve
                    </Button>
                  </>
                )}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
