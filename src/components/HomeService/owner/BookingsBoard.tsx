"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { CalendarCheck, EllipsisVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { FilterBar } from "@/components/Shared/FilterBar";
import Pagination from "@/components/Shared/Pagination";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { showResultToast } from "@/components/Shared/showResultToast";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { markExpertNoShow } from "@/services/home-service/markExpertNoShow";
import { overrideStartHome } from "@/services/home-service/overrideStartHome";
import { ownerCancelHome } from "@/services/home-service/ownerCancelHome";
import { reassignHome } from "@/services/home-service/reassignHome";
import type {
  HomeAudience,
  HomeBookingStatus,
  HomeEndResult,
  HomeReassignCandidate,
  OwnerHomeBooking,
  OwnerHomeBookingTab,
  OwnerHomeExpert,
} from "@/services/home-service/types";
import { dayOf, dayText, HOME_STATUS_LABEL, timeText } from "../booking/format";
import { ReasonDialog, ReassignDialog } from "./BoardDialogs";
import { ADVANCE_TEXT, firstName, HOME_BASE, SIDE_LABEL } from "./format";

/** An expert can be marked as not arrived from this long after the start (the API refuses before). */
const NO_SHOW_AFTER_MS = 45 * 60 * 1000;

const TABS: { value: OwnerHomeBookingTab; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

const ANY = "ALL";
const FILTER_STATUSES = Object.keys(HOME_STATUS_LABEL).filter(
  (s) => s !== "PENDING_PAYMENT" && s !== "EXPIRED",
) as HomeBookingStatus[];

export type BoardFilters = {
  tab: OwnerHomeBookingTab;
  audience?: HomeAudience;
  expertId?: string;
  status?: HomeBookingStatus;
};

type Patch = Partial<Pick<OwnerHomeBooking, "status" | "expert" | "advanceStatus">>;
const NO_PATCHES: Record<string, Patch> = {};

type Target = { kind: "reassign" | "cancel" | "override" | "noShow"; booking: OwnerHomeBooking; opening: number };

/** The branch's visits. Rows change at once and spin alone; the server's page replaces them when the action ends. */
export function BookingsBoard({
  salonId,
  bookings,
  filters,
  page,
  total,
  pageSize,
  totalPages,
  heldMinor,
  experts,
  sides,
  showMoneyLink,
  creditMinor,
}: {
  salonId: string;
  bookings: OwnerHomeBooking[];
  filters: BoardFilters;
  page: number;
  total: number;
  pageSize: number;
  totalPages: number;
  heldMinor: number;
  experts: OwnerHomeExpert[];
  sides: HomeAudience[];
  /** Money is the owner's alone. */
  showMoneyLink: boolean;
  /** What the salon pays on top of the refund when it cancels. */
  creditMinor: number;
}) {
  const { navigate, isPending } = useFilterNavigation();
  const [now] = useState(() => Date.now());
  const [target, setTarget] = useState<Target | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [patches, addPatch] = useOptimistic(NO_PATCHES, (current, next: { id: string; patch: Patch }) => ({
    ...current,
    [next.id]: { ...current[next.id], ...next.patch },
  }));
  const [, start] = useTransition();

  const hrefFor = (next: Partial<BoardFilters>, nextPage = 1) => {
    const merged = { ...filters, ...next };
    const query = new URLSearchParams({ tab: merged.tab });
    if (merged.audience) query.set("audience", merged.audience);
    if (merged.expertId) query.set("expertId", merged.expertId);
    if (merged.status) query.set("status", merged.status);
    if (nextPage > 1) query.set("page", String(nextPage));
    return `${HOME_BASE}/bookings?${query}`;
  };

  const open = (kind: Target["kind"], booking: OwnerHomeBooking) => {
    setTarget((t) => ({ kind, booking, opening: (t?.opening ?? 0) + 1 }));
    setDialogOpen(true);
  };

  const refundToast = (res: { success: boolean; message: string; data?: HomeEndResult }) => {
    if (!res.success || !res.data) {
      showResultToast(res);
      return;
    }
    const back = res.data.outcome.refundMinor + res.data.balanceReleasedMinor + res.data.outcome.salonCreditMinor;
    toast.success(`${res.message}. ${formatBDT(back)} back to the customer.`);
  };

  const reassign = (booking: OwnerHomeBooking, expert: HomeReassignCandidate, reason: string) => {
    setDialogOpen(false);
    start(async () => {
      addPatch({ id: booking.id, patch: { expert: { ...booking.expert, id: expert.id, name: expert.name } } });
      showResultToast(await reassignHome(salonId, booking.id, expert.id, reason));
    });
  };

  const cancel = (booking: OwnerHomeBooking, reason: string) => {
    setDialogOpen(false);
    start(async () => {
      addPatch({ id: booking.id, patch: { status: "CANCELLED", advanceStatus: "RELEASED" } });
      refundToast(await ownerCancelHome(salonId, booking.id, reason));
    });
  };

  const noShow = (booking: OwnerHomeBooking, reason: string) => {
    setDialogOpen(false);
    start(async () => {
      addPatch({ id: booking.id, patch: { status: "NO_SHOW", advanceStatus: "RELEASED" } });
      refundToast(await markExpertNoShow(salonId, booking.id, reason));
    });
  };

  const override = (booking: OwnerHomeBooking, reason: string) => {
    setDialogOpen(false);
    start(async () => {
      addPatch({ id: booking.id, patch: { status: "IN_PROGRESS" } });
      showResultToast(await overrideStartHome(salonId, booking.id, reason));
    });
  };

  const rows = bookings.map((b) => (patches[b.id] ? { ...b, ...patches[b.id] } : b));

  const columns: Column<OwnerHomeBooking>[] = [
    {
      key: "when",
      header: "Time",
      mobile: "eyebrow",
      cell: (b) => (filters.tab === "today" ? timeText(b.startAt) : `${dayText(dayOf(b.startAt))} · ${timeText(b.startAt)}`),
    },
    { key: "customer", header: "Customer", mobile: "primary", cell: (b) => firstName(b.customerName) },
    { key: "expert", header: "Expert", mobile: "secondary", cell: (b) => b.expert.name },
    { key: "area", header: "Area", mobile: "secondary", cell: (b) => b.address.area ?? "—" },
    {
      key: "advance",
      header: "Advance",
      mobile: "meta",
      cell: (b) => (
        <span className="inline-flex items-center gap-1.5">
          {formatBDT(b.advanceMinor)}
          <ToneBadge status={b.advanceStatus} tone={ADVANCE_TEXT[b.advanceStatus].tone}>
            {ADVANCE_TEXT[b.advanceStatus].label}
          </ToneBadge>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (b) => <ToneBadge status={b.status}>{HOME_STATUS_LABEL[b.status]}</ToneBadge>,
    },
  ];

  const actionsFor = (b: OwnerHomeBooking) => {
    const pending = b.id in patches;
    const late = now >= Date.parse(b.startAt) + NO_SHOW_AFTER_MS;
    const canReassign = b.status === "CONFIRMED";
    const canCancel = b.status === "CONFIRMED" || b.status === "EN_ROUTE" || b.status === "ARRIVED";
    const canOverride = b.status === "ARRIVED";
    const canNoShow = late && (b.status === "CONFIRMED" || b.status === "EN_ROUTE");
    if (pending) return <Loader2 aria-label="Saving" className="size-4 animate-spin text-muted-foreground" />;
    if (!canReassign && !canCancel && !canOverride && !canNoShow) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${b.code}`}>
            <EllipsisVertical aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canReassign && <DropdownMenuItem onSelect={() => open("reassign", b)}>Reassign</DropdownMenuItem>}
          {canOverride && <DropdownMenuItem onSelect={() => open("override", b)}>Override start</DropdownMenuItem>}
          {canNoShow && <DropdownMenuItem onSelect={() => open("noShow", b)}>Expert didn&apos;t come</DropdownMenuItem>}
          {canCancel && (
            <DropdownMenuItem variant="destructive" onSelect={() => open("cancel", b)}>
              Cancel as salon
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const active = [filters.audience, filters.expertId, filters.status].filter(Boolean).length;
  const sideExperts = experts.filter((e) => !filters.audience || e.audience === filters.audience);

  return (
    <div className="space-y-4">
      {heldMinor > 0 && (
        <p className="rounded-2xl bg-info-soft p-4 text-sm">
          <span className="font-semibold">{formatBDT(heldMinor)}</span> advances held for upcoming visits — paid into
          your balance after each visit.
          {showMoneyLink && (
            <>
              {" "}
              <Link href="/dashboard/money" className="font-medium text-primary hover:underline">
                See Money
              </Link>
            </>
          )}
        </p>
      )}

      <FilterBar
        pending={isPending}
        chips={{
          value: filters.tab,
          options: TABS,
          label: "When",
          onChange: (tab) => navigate(hrefFor({ tab: tab as OwnerHomeBookingTab })),
        }}
        activeCount={active}
        onClear={() => navigate(`${HOME_BASE}/bookings?tab=${filters.tab}`)}
        extra={
          <>
            {sides.length > 1 && (
              <Select
                value={filters.audience ?? ANY}
                onValueChange={(v) =>
                  navigate(hrefFor({ audience: v === ANY ? undefined : (v as HomeAudience), expertId: undefined }))
                }
              >
                <SelectTrigger aria-label="Side" className="w-full md:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value={ANY}>Both sides</SelectItem>
                  {sides.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SIDE_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={filters.expertId ?? ANY}
              onValueChange={(v) => navigate(hrefFor({ expertId: v === ANY ? undefined : v }))}
            >
              <SelectTrigger aria-label="Expert" className="w-full md:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={ANY}>All experts</SelectItem>
                {sideExperts.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status ?? ANY}
              onValueChange={(v) => navigate(hrefFor({ status: v === ANY ? undefined : (v as HomeBookingStatus) }))}
            >
              <SelectTrigger aria-label="Status" className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={ANY}>All statuses</SelectItem>
                {FILTER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {HOME_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <PendingRegion pending={isPending}>
        <DataList
          items={rows}
          rowKey={(b) => b.id}
          columns={columns}
          caption="Home visits"
          tableFrom="3xl"
          rowClassName={(b) => cn(b.id in patches && "opacity-70")}
          rowActions={actionsFor}
          empty={
            <EmptyState
              icon={CalendarCheck}
              title={active ? "No visits match" : "No visits here"}
              description={active ? "Try clearing the filters." : "Booked home visits show here."}
            />
          }
        />
      </PendingRegion>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          itemLabel="visits"
          disabled={isPending}
          onPageChange={(next) => navigate(hrefFor({}, next))}
        />
      )}

      {target?.kind === "reassign" && (
        <ReassignDialog
          key={target.opening}
          booking={target.booking}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConfirm={(expert, reason) => reassign(target.booking, expert, reason)}
        />
      )}
      {target?.kind === "cancel" && (
        <ReasonDialog
          key={target.opening}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Cancel this visit as the salon?"
          description={
            creditMinor > 0
              ? `The customer gets 100% back automatically, plus ${formatBDT(creditMinor)} credit paid by your salon.`
              : "The customer gets 100% back automatically."
          }
          confirmLabel="Cancel the visit"
          destructive
          onConfirm={(reason) => cancel(target.booking, reason)}
        />
      )}
      {target?.kind === "override" && (
        <ReasonDialog
          key={target.opening}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Start without the customer's code?"
          description="For a customer who can't find the code, or a code that locked. The reason is kept on the visit."
          confirmLabel="Start the visit"
          onConfirm={(reason) => override(target.booking, reason)}
        />
      )}
      {target?.kind === "noShow" && (
        <ReasonDialog
          key={target.opening}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Expert didn't come?"
          description="The visit ends and the customer gets 100% back automatically."
          confirmLabel="Mark as not arrived"
          destructive
          onConfirm={(reason) => noShow(target.booking, reason)}
        />
      )}
    </div>
  );
}
