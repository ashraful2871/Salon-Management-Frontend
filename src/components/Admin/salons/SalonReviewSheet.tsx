"use client";

import Link from "next/link";
import type { KeyboardEvent } from "react";
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
import { NotesPanel } from "@/components/Admin/NotesPanel";
import { formatDay } from "@/components/Admin/users/labels";
import { LeafletMap, PinMarker } from "@/components/Map/MapClient";
import { LocationAccuracyBadge } from "@/components/Shared/LocationAccuracyBadge";
import SafeImage from "@/components/Shared/SafeImage";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { can } from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";
import type { AdminSalonRow } from "@/services/admin/salons/types";
import { SALON_STATUS_LABELS, salonChecklist, waitingFor } from "./labels";

const isTyping = (target: EventTarget) => {
  const el = target as HTMLElement;
  return (
    el.isContentEditable ||
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT"
  );
};

/**
 * The approval queue's side panel: checklist, map, owner, notes, and
 * Approve / Reject. While it has focus, J and K step through the list and A
 * approves. Right-hand on desktop, full screen on phones. The reject dialog
 * lives in the parent so its keystrokes never reach these shortcuts.
 */
export function SalonReviewSheet({
  salon,
  position,
  total,
  permissions,
  viewerId,
  pending,
  onClose,
  onStep,
  onApprove,
  onReject,
}: {
  salon: AdminSalonRow | null;
  position: number;
  total: number;
  permissions: readonly string[];
  viewerId?: string;
  pending: boolean;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
  onApprove: (salon: AdminSalonRow) => void;
  onReject: (salon: AdminSalonRow) => void;
}) {
  const canReview = can(permissions, "salons.review");
  const reviewable = !!salon && (salon.status === "PENDING_APPROVAL" || salon.status === "REJECTED");
  const checklist = salon ? salonChecklist(salon) : [];
  const allOk = checklist.every((c) => c.ok);

  const onKeyDown = (e: KeyboardEvent) => {
    if (!salon || e.altKey || e.ctrlKey || e.metaKey || isTyping(e.target)) return;
    const key = e.key.toLowerCase();
    if (key === "j") {
      e.preventDefault();
      onStep(1);
    } else if (key === "k") {
      e.preventDefault();
      onStep(-1);
    } else if (key === "a" && canReview && reviewable && salon.status === "PENDING_APPROVAL" && !pending) {
      e.preventDefault();
      onApprove(salon);
    }
  };

  return (
    <Sheet open={!!salon} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        onKeyDown={onKeyDown}
        className="flex h-dvh w-full max-w-none flex-col gap-0 p-0 sm:max-w-xl"
      >
        {salon && (
          <>
            <SheetHeader className="border-b border-border px-5 py-4 text-left">
              <div className="flex items-center gap-3 pr-8">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface-subtle">
                  <SafeImage src={salon.coverImage} alt="" fill sizes="48px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate">{salon.name}</SheetTitle>
                  <SheetDescription className="truncate">
                    {[salon.area, salon.district].filter(Boolean).join(", ")} ·{" "}
                    {salon.status === "PENDING_APPROVAL"
                      ? `waiting ${waitingFor(salon.createdAt)}`
                      : `added ${formatDay(salon.createdAt)}`}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2">
                <ToneBadge status={salon.status}>{SALON_STATUS_LABELS[salon.status]}</ToneBadge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>
                    {position + 1} of {total}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Previous salon (K)"
                    disabled={position <= 0}
                    onClick={() => onStep(-1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Next salon (J)"
                    disabled={position >= total - 1}
                    onClick={() => onStep(1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <section aria-labelledby="checklist-title" className="space-y-2">
                <h3 id="checklist-title" className="text-sm font-semibold">
                  Checklist
                </h3>
                <ul className="space-y-1.5 text-sm">
                  {checklist.map((item) => (
                    <li key={item.key} className="flex items-center gap-2">
                      {item.ok ? (
                        <Check aria-hidden className="size-4 text-success" />
                      ) : (
                        <X aria-hidden className="size-4 text-danger" />
                      )}
                      <span className={cn(!item.ok && "text-danger")}>{item.label}</span>
                      <span className="sr-only">{item.ok ? "done" : "missing"}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  {salon.services} active service{salon.services === 1 ? "" : "s"}, {salon.pricedServices} priced ·{" "}
                  {salon.imageCount} photo{salon.imageCount === 1 ? "" : "s"}
                </p>
              </section>

              <section aria-labelledby="place-title" className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 id="place-title" className="text-sm font-semibold">
                    Location
                  </h3>
                  <LocationAccuracyBadge latitude={salon.latitude} locationAccuracy={salon.locationAccuracy} />
                </div>
                <p className="text-sm">{salon.address}</p>
                <p className="text-sm text-muted-foreground">{salon.phone}</p>
                {salon.latitude != null && salon.longitude != null ? (
                  <div className="h-48 overflow-hidden rounded-xl border border-border">
                    <LeafletMap
                      key={salon.id}
                      center={[salon.latitude, salon.longitude]}
                      zoom={salon.locationAccuracy === "EXACT" ? 16 : 14}
                      interactive={false}
                      className="h-full rounded-none"
                    >
                      <PinMarker
                        position={[salon.latitude, salon.longitude]}
                        approximate={salon.locationAccuracy !== "EXACT"}
                        active
                        title={salon.name}
                      />
                    </LeafletMap>
                  </div>
                ) : (
                  <p className="rounded-xl border border-warning/30 bg-warning-soft/60 p-3 text-sm text-warning">
                    No map pin: this salon won&apos;t show up in &quot;near me&quot; and can&apos;t be given directions.
                  </p>
                )}
              </section>

              {salon.description && (
                <section className="space-y-1">
                  <h3 className="text-sm font-semibold">Description</h3>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{salon.description}</p>
                </section>
              )}

              <section aria-labelledby="owner-title" className="space-y-1">
                <h3 id="owner-title" className="text-sm font-semibold">
                  Owner
                </h3>
                {salon.owner ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{salon.owner.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{salon.owner.email}</p>
                    </div>
                    {can(permissions, "users.view") && (
                      <Link
                        href={`/dashboard/admin/users/${salon.owner.id}`}
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

              {salon.statusReason && (
                <section className="space-y-1">
                  <h3 className="text-sm font-semibold">Last decision</h3>
                  <p className="text-sm text-muted-foreground">{salon.statusReason}</p>
                </section>
              )}

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Notes</h3>
                <NotesPanel key={salon.id} entityType="salon" entityId={salon.id} currentUserId={viewerId} />
              </section>

              <Link
                href={`/dashboard/admin/salons/${salon.id}`}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Open the full salon page
                <ExternalLink aria-hidden className="size-3.5" />
              </Link>
            </div>

            {canReview && reviewable && (
              <SheetFooter className="flex-row gap-2 border-t border-border px-5 py-3">
                <p className="mr-auto hidden self-center text-xs text-muted-foreground sm:block">
                  <kbd className="rounded border px-1">J</kbd>/<kbd className="rounded border px-1">K</kbd> move ·{" "}
                  <kbd className="rounded border px-1">A</kbd> approve
                </p>
                <Button variant="outline" disabled={pending} onClick={() => onReject(salon)}>
                  Reject…
                </Button>
                <Button
                  disabled={pending}
                  onClick={() => onApprove(salon)}
                  title={allOk ? undefined : "Some checklist items are missing"}
                >
                  {pending && <Loader2 aria-hidden className="animate-spin" />}
                  Approve
                </Button>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
