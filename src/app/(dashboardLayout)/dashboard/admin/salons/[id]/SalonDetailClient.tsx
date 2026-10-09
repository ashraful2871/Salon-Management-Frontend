"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntityHeader, EntityTabs, type EntityTab } from "@/components/Admin/EntityHeader";
import { CopyId } from "@/components/Admin/MaskedValue";
import { NotesPanel } from "@/components/Admin/NotesPanel";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { DeleteSalonDialog } from "@/components/Admin/salons/DeleteSalonDialog";
import { EditListingDialog } from "@/components/Admin/salons/EditListingDialog";
import { FixPinSheet } from "@/components/Admin/salons/FixPinSheet";
import { SALON_REASONS, SALON_STATUS_LABELS, salonChecklist } from "@/components/Admin/salons/labels";
import { SalonStatusDialog, type SalonReasonAction } from "@/components/Admin/salons/SalonStatusDialog";
import { Timeline, formatDhaka } from "@/components/Admin/Timeline";
import { formatDay, reasonText } from "@/components/Admin/users/labels";
import { LeafletMap, PinMarker } from "@/components/Map/MapClient";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { LocationAccuracyBadge } from "@/components/Shared/LocationAccuracyBadge";
import { ToneBadge, humanizeStatus } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import { can } from "@/lib/admin-permissions";
import type { ApiResponse } from "@/lib/api-types";
import { formatBDT } from "@/lib/money";
import { cancelSalonUpcoming } from "@/services/admin/salons/cancelSalonUpcoming";
import { getSalonImpact } from "@/services/admin/salons/getSalonImpact";
import { reindexAdminSalon } from "@/services/admin/salons/reindexAdminSalon";
import { updateAdminSalonStatus } from "@/services/admin/salons/updateAdminSalonStatus";
import type {
  AdminActivityRow,
  AdminSalonBooking,
  AdminSalonDetail,
  AdminSalonMoney,
  AdminSalonReview,
  AdminSalonService,
  AdminSalonTeam,
} from "@/services/admin/salons/types";

type Tabs = {
  services: ApiResponse<AdminSalonService[]> | null;
  team: ApiResponse<AdminSalonTeam> | null;
  bookings: ApiResponse<AdminSalonBooking[]> | null;
  reviews: ApiResponse<AdminSalonReview[]> | null;
  money: ApiResponse<AdminSalonMoney> | null;
  activity: ApiResponse<AdminActivityRow[]> | null;
};

type Dialog =
  | { kind: "status"; action: SalonReasonAction }
  | { kind: "reactivate" | "approve" | "cancel" | "pin" | "listing" | "delete" }
  | null;

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right break-words">{children}</dd>
  </div>
);

const Panel = ({ title, children }: { title: string; children: ReactNode }) => (
  <Card className="min-w-0">
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <dl className="divide-y divide-border">{children}</dl>
    </CardContent>
  </Card>
);

const dataOf = <T,>(response: ApiResponse<T> | null) => (response?.success ? (response.data ?? null) : null);

const tabError = (response: ApiResponse<unknown> | null, title: string) =>
  response && !response.success ? <EmptyState title={title} description={response.message} /> : null;

export function SalonDetailClient({
  salon,
  tabs,
  permissions,
  viewerId,
}: {
  salon: AdminSalonDetail;
  /** Null for agents: they see the overview only. */
  tabs: Tabs | null;
  permissions: string[];
  viewerId?: string;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [upcoming, setUpcoming] = useState<number | null>(null);
  const [busy, startTransition] = useTransition();

  const status = salon.status;
  const reviewable = status === "PENDING_APPROVAL" || status === "REJECTED";
  const canReview = can(permissions, "salons.review");
  const isAdmin = tabs !== null;
  const canManage = isAdmin && can(permissions, "salons.manage");
  const canReindex = isAdmin && can(permissions, "system.operate");
  const canDelete = isAdmin && can(permissions, "salons.delete");

  const close = (open: boolean) => {
    if (!open) setDialog(null);
  };

  // Delete is refused while bookings stand; say so before the admin types.
  const deleting = dialog?.kind === "delete";
  useEffect(() => {
    if (!deleting) return;
    let live = true;
    void getSalonImpact(salon.id).then((r) => {
      if (live && r.success && r.data) setUpcoming(r.data.upcomingBookings);
    });
    return () => {
      live = false;
    };
  }, [deleting, salon.id]);

  const setActive = () =>
    startTransition(async () => {
      const result = await updateAdminSalonStatus(salon.id, { status: "ACTIVE", notify: true });
      showResultToast(result);
      setDialog(null);
    });

  const reindex = () =>
    startTransition(async () => {
      showResultToast(await reindexAdminSalon(salon.id));
    });

  const missing = salonChecklist({
    address: salon.address,
    phone: salon.phone,
    latitude: salon.latitude,
    locationAccuracy: salon.locationAccuracy,
    imageCount: salon.images.length,
    pricedServices: dataOf(tabs?.services ?? null)?.filter((s) => s.isActive && s.priceMinor > 0).length ?? 1,
    hasHours: !!salon.operatingHours && Object.keys(salon.operatingHours).length > 0,
  }).filter((c) => !c.ok);

  const hasActions = canReview || canManage || canReindex || canDelete;
  const actions = hasActions ? (
    <div className="flex flex-wrap gap-2">
      {canReview && reviewable && (
        <>
          <Button disabled={busy} onClick={() => (missing.length ? setDialog({ kind: "approve" }) : setActive())}>
            {busy && <Loader2 aria-hidden className="animate-spin" />}
            Approve
          </Button>
          {status === "PENDING_APPROVAL" && (
            <Button variant="outline" onClick={() => setDialog({ kind: "status", action: "REJECTED" })}>
              Reject…
            </Button>
          )}
        </>
      )}
      {(canManage || canReindex || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Actions
              <ChevronDown className="ml-1.5 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            {canManage && status === "ACTIVE" && (
              <>
                <DropdownMenuItem
                  className="text-danger"
                  onSelect={() => setDialog({ kind: "status", action: "SUSPENDED" })}
                >
                  Suspend…
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDialog({ kind: "status", action: "INACTIVE" })}>
                  Set inactive…
                </DropdownMenuItem>
              </>
            )}
            {canManage && (status === "SUSPENDED" || status === "INACTIVE") && (
              <DropdownMenuItem onSelect={() => setDialog({ kind: "reactivate" })}>Reactivate…</DropdownMenuItem>
            )}
            {canManage && (
              <>
                <DropdownMenuItem onSelect={() => setDialog({ kind: "cancel" })}>
                  Cancel upcoming bookings…
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setDialog({ kind: "pin" })}>Fix pin…</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDialog({ kind: "listing" })}>Edit listing…</DropdownMenuItem>
              </>
            )}
            {canReindex && (
              <DropdownMenuItem disabled={busy} onSelect={reindex}>
                Re-index for AI search
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-danger" onSelect={() => setDialog({ kind: "delete" })}>
                  Delete…
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  ) : undefined;

  const facts: ReactNode[] = [
    [salon.area, salon.district, salon.division].filter((p) => p && p !== "N/A").join(", "),
    `Added ${formatDay(salon.createdAt)}`,
    salon.approvedAt ? `Live since ${formatDay(salon.approvedAt)}` : null,
    <CopyId key="id" id={salon.id} />,
  ];
  if (salon.isTest) facts.push("Test data");

  const hasPin = salon.latitude != null && salon.longitude != null;

  const overview = (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Listing">
        <Fact label="Address">{salon.address}</Fact>
        <Fact label="Phone">{salon.phone}</Fact>
        {salon.email && <Fact label="Email">{salon.email}</Fact>}
        {salon.website && <Fact label="Website">{salon.website}</Fact>}
        <Fact label="Photos">{salon.images.length}</Fact>
        <Fact label="Opening hours">{salon.operatingHours ? "Set" : "Not set"}</Fact>
        <Fact label="Deposit">
          {salon.depositPercent != null ? `${salon.depositPercent}%` : formatBDT(salon.depositMinor)} · free cancel{" "}
          {Math.round(salon.cancellationWindowMin / 60)} h before
        </Fact>
      </Panel>
      <Panel title="Status">
        <Fact label="Status">
          <ToneBadge status={status}>{SALON_STATUS_LABELS[status]}</ToneBadge>
        </Fact>
        {salon.statusReason && <Fact label="Reason">{salon.statusReason}</Fact>}
        {salon.statusChangedAt && <Fact label="Changed">{formatDhaka(salon.statusChangedAt)}</Fact>}
        {missing.length > 0 && reviewable && (
          <Fact label="Missing">{missing.map((m) => m.label.toLowerCase()).join(", ")}</Fact>
        )}
        {salon.statusHistory.length > 0 && (
          <div className="pt-3">
            <Timeline
              items={salon.statusHistory.map((h) => ({
                at: h.createdAt,
                title: humanizeStatus(h.action.replace(/^salon\./, "")),
                detail: h.reason ?? undefined,
                meta: h.actorName ?? humanizeStatus(h.actorRole),
              }))}
            />
          </div>
        )}
      </Panel>
      <Panel title="Owner">
        <Fact label="Name">
          {can(permissions, "users.view") ? (
            <Link href={`/dashboard/admin/users/${salon.owner.user.id}`} className="text-primary hover:underline">
              {salon.owner.user.name}
            </Link>
          ) : (
            salon.owner.user.name
          )}
        </Fact>
        <Fact label="Email">{salon.owner.user.email}</Fact>
        <Fact label="Phone">{salon.owner.user.phone ?? "—"}</Fact>
        <Fact label="Account">
          <ToneBadge status={salon.owner.user.status} />
        </Fact>
        {salon.owner.businessName && <Fact label="Business">{salon.owner.businessName}</Fact>}
        {salon.piiMasked && (
          <p className="pt-2 text-xs text-muted-foreground">Contact details are masked for your role.</p>
        )}
      </Panel>
      <Panel title="Activity">
        <Fact label="Services">{salon.counts.services}</Fact>
        <Fact label="Staff">{salon.counts.staff}</Fact>
        <Fact label="Counters">{salon.counts.counters}</Fact>
        <Fact label="Bookings, last 30 days">{salon.counts.bookings30d}</Fact>
        <Fact label="No-show rate, 30 days">
          {salon.counts.noShowRate30d == null ? "—" : `${Math.round(salon.counts.noShowRate30d * 100)}%`}
        </Fact>
        <Fact label="Rating">
          {salon.totalReviews ? `${salon.rating.toFixed(1)} from ${salon.totalReviews}` : "No reviews"}
        </Fact>
        {salon.balance && <Fact label="Owed to the owner">{formatBDT(salon.balance.payableMinor)}</Fact>}
      </Panel>
      <Card className="min-w-0 lg:col-span-2">
        <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-base">Map</CardTitle>
          <LocationAccuracyBadge latitude={salon.latitude} locationAccuracy={salon.locationAccuracy} />
        </CardHeader>
        <CardContent>
          {hasPin ? (
            <div className="h-56 overflow-hidden rounded-xl border border-border">
              <LeafletMap
                center={[salon.latitude!, salon.longitude!]}
                zoom={salon.locationAccuracy === "EXACT" ? 16 : 14}
                interactive={false}
                className="h-full rounded-none"
              >
                <PinMarker
                  position={[salon.latitude!, salon.longitude!]}
                  approximate={salon.locationAccuracy !== "EXACT"}
                  active
                  title={salon.name}
                />
              </LeafletMap>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No map pin yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ------------------------------------------------------------ admin tabs

  const services = dataOf(tabs?.services ?? null) ?? [];
  const serviceColumns: Column<AdminSalonService>[] = [
    { key: "name", header: "Service", mobile: "primary", cell: (s) => s.name },
    { key: "category", header: "Category", mobile: "eyebrow", cell: (s) => humanizeStatus(s.category) },
    { key: "price", header: "Price", align: "right", mobile: "trailing", cell: (s) => formatBDT(s.priceMinor) },
    { key: "duration", header: "Duration", align: "right", cell: (s) => `${s.duration} min` },
    { key: "bookings", header: "Bookings", align: "right", cell: (s) => s._count.appointments },
    {
      key: "active",
      header: "Shown",
      cell: (s) => (
        <ToneBadge status={s.isActive ? "ACTIVE" : "INACTIVE"}>{s.isActive ? "Shown" : "Hidden"}</ToneBadge>
      ),
    },
  ];

  const team = dataOf(tabs?.team ?? null);
  const staffColumns: Column<AdminSalonTeam["staff"][number]>[] = [
    { key: "name", header: "Name", mobile: "primary", cell: (s) => s.user.name },
    { key: "email", header: "Email", mobile: "secondary", cell: (s) => s.user.email },
    { key: "speciality", header: "Speciality", cell: (s) => s.speciality ?? "—" },
    { key: "status", header: "Status", mobile: "trailing", cell: (s) => <ToneBadge status={s.status} /> },
  ];

  const bookings = dataOf(tabs?.bookings ?? null) ?? [];
  const bookingColumns: Column<AdminSalonBooking>[] = [
    {
      key: "when",
      header: "When",
      mobile: "primary",
      cell: (b) => `${formatDay(b.appointmentDate)} · ${b.startTime}`,
    },
    { key: "customer", header: "Customer", mobile: "secondary", cell: (b) => b.customer.name },
    { key: "service", header: "Service", cell: (b) => b.service.name },
    { key: "status", header: "Status", mobile: "trailing", cell: (b) => <ToneBadge status={b.status} /> },
    { key: "total", header: "Total", align: "right", cell: (b) => formatBDT(b.totalMinor) },
    {
      key: "deposit",
      header: "Deposit",
      align: "right",
      cell: (b) => (b.depositMinor ? `${formatBDT(b.depositMinor)} · ${humanizeStatus(b.depositStatus)}` : "—"),
    },
  ];

  const reviews = dataOf(tabs?.reviews ?? null) ?? [];
  const reviewColumns: Column<AdminSalonReview>[] = [
    { key: "date", header: "Date", mobile: "eyebrow", cell: (r) => formatDay(r.createdAt) },
    { key: "customer", header: "Customer", mobile: "primary", cell: (r) => r.customer.name },
    {
      key: "rating",
      header: "Rating",
      mobile: "trailing",
      cell: (r) => (
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-current text-warning" aria-hidden />
          {r.rating}
        </span>
      ),
    },
    { key: "comment", header: "Comment", mobile: "secondary", cell: (r) => r.comment || "—" },
  ];

  const money = dataOf(tabs?.money ?? null);
  const entryColumns: Column<AdminSalonMoney["entries"][number]>[] = [
    { key: "date", header: "Date", mobile: "eyebrow", cell: (e) => formatDay(e.createdAt) },
    { key: "description", header: "Description", mobile: "primary", cell: (e) => e.description },
    { key: "account", header: "Account", cell: (e) => humanizeStatus(e.account) },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      mobile: "trailing",
      cell: (e) => (
        <span className={e.amountMinor < 0 ? "text-danger" : e.amountMinor > 0 ? "text-success" : undefined}>
          {formatBDT(e.amountMinor)}
        </span>
      ),
    },
    { key: "paid", header: "Paid out", cell: (e) => (e.payoutId ? "Yes" : "Not yet") },
  ];

  const moneyTab = !tabs?.money ? (
    <EmptyState title="Money needs finance access" />
  ) : !money ? (
    tabError(tabs.money, "Couldn't load money")
  ) : (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Owed to the owner, not yet paid out:{" "}
        <span className="font-medium text-foreground">{formatBDT(money.balance.payableMinor)}</span>
        {money.payouts[0] &&
          ` · last payout ${formatBDT(money.payouts[0].netMinor)} (${humanizeStatus(money.payouts[0].status)}, ${formatDay(money.payouts[0].createdAt)})`}
      </p>
      <DataList
        items={money.entries}
        rowKey={(e) => e.id}
        columns={entryColumns}
        density="compact"
        caption="Ledger entries"
        empty={<EmptyState title="No ledger entries yet" />}
      />
    </div>
  );

  const searchTab = (
    <Panel title="AI search index">
      <Fact label="Embedded">{salon.index.hasEmbedding ? "Yes" : "No"}</Fact>
      <Fact label="Model">{salon.index.embeddingModel ?? "—"}</Fact>
      <Fact label="Last embedded">{salon.index.embeddedAt ? formatDhaka(salon.index.embeddedAt) : "Never"}</Fact>
      <Fact label="State">
        {status !== "ACTIVE" ? (
          "Not searchable (not live)"
        ) : salon.index.stale ? (
          <ToneBadge status="STALE" tone="warning">
            Stale
          </ToneBadge>
        ) : (
          <ToneBadge status="CURRENT" tone="success">
            Up to date
          </ToneBadge>
        )}
      </Fact>
      {canReindex && (
        <div className="pt-3">
          <Button variant="outline" size="sm" disabled={busy} onClick={reindex}>
            {busy && <Loader2 aria-hidden className="animate-spin" />}
            Re-index now
          </Button>
        </div>
      )}
    </Panel>
  );

  const activity = dataOf(tabs?.activity ?? null) ?? [];
  const timeline = activity.map((a) => ({
    at: a.createdAt,
    title: `${humanizeStatus(a.action.replace(/\./g, "_"))}${a.entityType === "salon" ? "" : ` (${a.entityType})`}`,
    detail: a.reason ?? undefined,
    tone: a.action.includes("suspend") || a.action.includes("reject") ? ("danger" as const) : undefined,
    meta: `${a.actorName ?? humanizeStatus(a.actorRole)}${a.source !== "api" ? ` · ${a.source}` : ""}`,
  }));

  const entityTabs: EntityTab[] = [{ key: "overview", label: "Overview", content: overview }];
  if (tabs) {
    entityTabs.push(
      {
        key: "services",
        label: "Services",
        content: tabError(tabs.services, "Couldn't load services") ?? (
          <DataList
            items={services}
            rowKey={(s) => s.id}
            columns={serviceColumns}
            density="compact"
            caption="Services"
            empty={<EmptyState title="No services yet" />}
          />
        ),
      },
      {
        key: "team",
        label: "Team",
        content: tabError(tabs.team, "Couldn't load the team") ?? (
          <div className="space-y-4">
            <DataList
              items={team?.staff ?? []}
              rowKey={(s) => s.id}
              columns={staffColumns}
              density="compact"
              caption="Staff"
              empty={<EmptyState title="No staff yet" />}
            />
            <p className="text-sm text-muted-foreground">
              Counters:{" "}
              {team?.counters.length
                ? team.counters.map((c) => `${c.name}${c.isActive ? "" : " (off)"}`).join(", ")
                : "none"}
            </p>
          </div>
        ),
      },
      {
        key: "bookings",
        label: "Bookings",
        content: tabError(tabs.bookings, "Couldn't load bookings") ?? (
          <DataList
            items={bookings}
            rowKey={(b) => b.id}
            columns={bookingColumns}
            density="compact"
            caption="Bookings"
            empty={<EmptyState title="No bookings yet" />}
          />
        ),
      },
      {
        key: "reviews",
        label: "Reviews",
        content: tabError(tabs.reviews, "Couldn't load reviews") ?? (
          <DataList
            items={reviews}
            rowKey={(r) => r.id}
            columns={reviewColumns}
            density="compact"
            caption="Reviews"
            empty={<EmptyState title="No reviews yet" />}
          />
        ),
      },
      { key: "money", label: "Money", content: moneyTab },
      { key: "search", label: "Search", content: searchTab },
      {
        key: "activity",
        label: "Activity",
        content: timeline.length ? <Timeline items={timeline} /> : <EmptyState title="Nothing on the audit log yet" />,
      },
      {
        key: "notes",
        label: "Notes",
        content: <NotesPanel entityType="salon" entityId={salon.id} currentUserId={viewerId} />,
      },
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <EntityHeader
        title={salon.name}
        imageUrl={salon.images[0] ?? null}
        shape="cover"
        status={status}
        statusLabel={SALON_STATUS_LABELS[status]}
        facts={facts}
        actions={actions}
      />
      <EntityTabs tabs={entityTabs} />

      {dialog?.kind === "status" && (
        <SalonStatusDialog open onOpenChange={close} action={dialog.action} salon={salon} />
      )}
      <ConfirmDialog
        open={dialog?.kind === "reactivate"}
        onOpenChange={close}
        title={`Reactivate ${salon.name}?`}
        description="It shows up in search, on the map and in AI search again, and the owner gets an email."
        confirmLabel="Reactivate"
        pending={busy}
        onConfirm={setActive}
      />
      <ConfirmDialog
        open={dialog?.kind === "approve"}
        onOpenChange={close}
        title={`Approve ${salon.name}?`}
        description={`Still missing: ${missing.map((m) => m.label.toLowerCase()).join(", ")}. It goes live anyway.`}
        confirmLabel="Approve anyway"
        pending={busy}
        onConfirm={setActive}
      />
      <ReasonDialog
        open={dialog?.kind === "cancel"}
        onOpenChange={close}
        title="Cancel every upcoming booking"
        description="Each customer gets the whole deposit back plus the goodwill credit, and an email. The salon stays as it is."
        reasonCodes={SALON_REASONS}
        showNotify={false}
        tone="danger"
        confirmLabel="Cancel bookings"
        stepUp
        onConfirm={(input) => cancelSalonUpcoming(salon.id, reasonText(SALON_REASONS, input))}
        onDone={(result) => showResultToast(result)}
      />
      {dialog?.kind === "pin" && <FixPinSheet open onOpenChange={close} salon={salon} />}
      {dialog?.kind === "listing" && <EditListingDialog open onOpenChange={close} salon={salon} />}
      {dialog?.kind === "delete" && (
        <DeleteSalonDialog open onOpenChange={close} salon={salon} upcomingBookings={upcoming} />
      )}
    </div>
  );
}
