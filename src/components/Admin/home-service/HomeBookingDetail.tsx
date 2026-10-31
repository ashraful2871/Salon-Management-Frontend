"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LEDGER_ACCOUNT_LABELS } from "@/components/Admin/bookings/labels";
import { EntityHeader } from "@/components/Admin/EntityHeader";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { formatDhaka, Timeline, type TimelineItem } from "@/components/Admin/Timeline";
import { reasonText } from "@/components/Admin/users/labels";
import { humanizeStatus, ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import { can } from "@/lib/admin-permissions";
import { decideOutcome, policyShortLine, snapshotOf } from "@/lib/home-policy";
import { formatBDT } from "@/lib/money";
import { toneOf } from "@/lib/status-tone";
import { adminCancelHome } from "@/services/home-service/adminCancelHome";
import type { AdminHomeBooking, HomeBookingStatus } from "@/services/home-service/types";
import { HOME_CANCEL_REASONS, REPORT_KIND_LABELS, REPORT_STATUS_LABELS, SIDE_LABELS } from "./labels";

/** `ADMIN_CANCELLABLE` in the API's home.cancel.ts. */
const CANCELLABLE: HomeBookingStatus[] = ["PENDING_PAYMENT", "CONFIRMED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"];

const signed = (minor: number) => `${minor >= 0 ? "+" : "−"}${formatBDT(Math.abs(minor))}`;

/** Events store a reason code, or a sentence with ISO times (a reschedule). */
const eventDetail = (reason: string | null) => {
  if (!reason) return undefined;
  if (/^[A-Z_]+$/.test(reason)) return humanizeStatus(reason);
  return reason.replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, (iso) => formatDhaka(iso));
};

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right break-words">{children}</dd>
  </div>
);

const Panel = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <Card className="min-w-0">
    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
      {action}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export function HomeBookingDetail({ booking, permissions }: { booking: AdminHomeBooking; permissions: string[] }) {
  const [cancelling, setCancelling] = useState(false);
  const [salonAtFault, setSalonAtFault] = useState(false);
  const canCancel = can(permissions, "homeservice.manage") && CANCELLABLE.includes(booking.status);
  const policy = snapshotOf(booking.policySnapshot);

  const timeline: TimelineItem[] = booking.events.map((e) => ({
    at: e.createdAt,
    title:
      e.fromStatus && e.fromStatus !== e.toStatus
        ? `${humanizeStatus(e.fromStatus)} → ${humanizeStatus(e.toStatus)}`
        : humanizeStatus(e.toStatus),
    detail: eventDetail(e.reason),
    tone: toneOf(e.toStatus),
    meta: humanizeStatus(e.actorRole),
  }));

  const outcome = decideOutcome(
    {
      status: booking.status,
      startAt: new Date(booking.startAt),
      advanceMinor: booking.advanceMinor,
      confirmedAt: booking.confirmedAt ? new Date(booking.confirmedAt) : null,
      policySnapshot: booking.policySnapshot,
    },
    { kind: "ADMIN_CANCEL", salonAtFault },
  );

  const balanced = booking.ledgerSumMinor === 0;

  return (
    <div className="min-w-0 space-y-6">
      <EntityHeader
        title={booking.code}
        status={booking.status}
        statusLabel={humanizeStatus(booking.status)}
        facts={[
          SIDE_LABELS[booking.audience],
          formatDhaka(booking.startAt),
          booking.services.join(", "),
          booking.isTest && "test",
        ]}
        actions={
          canCancel ? (
            <Button variant="outline" onClick={() => setCancelling(true)}>
              Cancel visit…
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Panel title="Timeline">
            {timeline.length ? (
              <Timeline items={timeline} />
            ) : (
              <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
            )}
          </Panel>

          <Panel
            title="Money"
            action={
              booking.ledgerEntries.length === 0 ? null : balanced ? (
                <ToneBadge status="BALANCED" tone="success">
                  Σ = 0 ✓
                </ToneBadge>
              ) : (
                <ToneBadge status="UNBALANCED" tone="danger" dot>
                  Σ = {signed(booking.ledgerSumMinor)}
                </ToneBadge>
              )
            }
          >
            <dl className="divide-y divide-border">
              <Fact label="Services">{formatBDT(booking.subtotalMinor)}</Fact>
              <Fact label="Travel fee">{booking.travelFeeMinor > 0 ? formatBDT(booking.travelFeeMinor) : "None"}</Fact>
              <Fact label="Total">{formatBDT(booking.totalMinor)}</Fact>
              <Fact label={`Advance (${booking.advancePercent}%)`}>
                {formatBDT(booking.advanceMinor)} · {humanizeStatus(booking.advanceStatus)}
              </Fact>
              <Fact label="Refunded">{formatBDT(booking.refundedMinor ?? 0)}</Fact>
              <Fact label="Fee kept">{formatBDT(booking.feeMinor)}</Fact>
              <Fact label="Balance">
                {formatBDT(booking.balanceMinor)}
                {booking.balanceMethod && ` · ${humanizeStatus(booking.balanceMethod)}`}
                {booking.balanceCollectedMinor != null &&
                  ` · ${formatBDT(booking.balanceCollectedMinor)} collected`}
              </Fact>
              <Fact label="Commission">{booking.commissionBps / 100}%</Fact>
            </dl>

            <h3 className="mt-5 mb-2 text-sm font-medium">Ledger</h3>
            {booking.ledgerEntries.length ? (
              <ul className="divide-y divide-border text-sm">
                {booking.ledgerEntries.map((row) => (
                  <li key={row.id} className="flex items-start justify-between gap-4 py-1.5">
                    <div className="min-w-0">
                      <p>{LEDGER_ACCOUNT_LABELS[row.account] ?? row.account}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDhaka(row.createdAt)} · {row.description}
                      </p>
                    </div>
                    <span className="shrink-0 tabular-nums">{signed(row.amountMinor)}</span>
                  </li>
                ))}
                <li className="flex justify-between gap-4 py-1.5 font-medium">
                  <span>Σ</span>
                  <span className={balanced ? "tabular-nums" : "tabular-nums text-danger"}>
                    {signed(booking.ledgerSumMinor)}
                  </span>
                </li>
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No ledger entries.</p>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-4">
          <Panel title="Policy at booking">
            <p className="text-sm font-medium">{policyShortLine(policy)}</p>
            <dl className="mt-2 divide-y divide-border">
              <Fact label="Policy">{humanizeStatus(policy.policy)}</Fact>
              {policy.policy === "WINDOW" && (
                <>
                  <Fact label="Free until">{policy.freeCancelHours} h before</Fact>
                  <Fact label="Late cancel keeps">{policy.lateCancelPercent}%</Fact>
                </>
              )}
              {policy.policy === "NON_REFUNDABLE" && (
                <Fact label="Grace">{policy.nonRefundableGraceMinutes} min</Fact>
              )}
              <Fact label="No-show keeps">
                {policy.policy === "NON_REFUNDABLE" ? 100 : policy.noShowPercent}%
              </Fact>
              <Fact label="Salon's share of a fee">{policy.feeSalonSharePercent}%</Fact>
              <Fact label="Salon cancel credit">{formatBDT(policy.salonCancelCreditMinor)}</Fact>
            </dl>
            <h3 className="mt-4 mb-1 text-sm font-medium">What the customer saw</h3>
            <blockquote className="rounded-lg bg-surface-subtle px-3 py-2 text-sm whitespace-pre-line">
              {booking.disclaimerText || "No disclaimer stored."}
            </blockquote>
            <p className="mt-1 text-xs text-muted-foreground">
              {booking.policyAcceptedAt
                ? `Accepted ${formatDhaka(booking.policyAcceptedAt)}`
                : "No acceptance was needed."}
            </p>
          </Panel>

          <Panel title="Customer">
            <dl className="divide-y divide-border">
              <Fact label="Name">
                {can(permissions, "users.view") ? (
                  <Link href={`/dashboard/admin/users/${booking.customer.id}`} className="hover:underline">
                    {booking.customer.name}
                  </Link>
                ) : (
                  booking.customer.name
                )}
              </Fact>
              <Fact label="Email">{booking.customer.email}</Fact>
              <Fact label="Recipient">{booking.recipientName}</Fact>
              <Fact label="Contact">{booking.contactPhone}</Fact>
              <Fact label="Address">
                {[booking.addressLine, booking.landmark].filter(Boolean).join(", ")}
              </Fact>
              <Fact label="Distance">{booking.distanceKm} km</Fact>
            </dl>
          </Panel>

          <Panel title="Salon & expert">
            <dl className="divide-y divide-border">
              <Fact label="Salon">
                <Link href={`/dashboard/admin/salons/${booking.salon.id}`} className="hover:underline">
                  {booking.salon.name}
                </Link>
              </Fact>
              <Fact label="Expert">{booking.expert.name}</Fact>
            </dl>
          </Panel>

          {booking.safetyReports.length > 0 && (
            <Panel title="Reports">
              <ul className="divide-y divide-border text-sm">
                {booking.safetyReports.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-1.5">
                    <span>
                      {REPORT_KIND_LABELS[r.kind]} · {formatDhaka(r.createdAt)}
                    </span>
                    <ToneBadge status={r.status}>{REPORT_STATUS_LABELS[r.status]}</ToneBadge>
                  </li>
                ))}
              </ul>
              {can(permissions, "homeservice.manage") && (
                <Link
                  href="/dashboard/admin/home-service/safety"
                  className="mt-2 inline-block text-sm text-primary hover:underline"
                >
                  Open the safety queue
                </Link>
              )}
            </Panel>
          )}

          {booking.appealStatus && (
            <Panel title="Appeal">
              <dl className="divide-y divide-border">
                <Fact label="Status">{humanizeStatus(booking.appealStatus)}</Fact>
                {booking.appealedAt && <Fact label="Sent">{formatDhaka(booking.appealedAt)}</Fact>}
                {booking.appealResolvedAt && <Fact label="Decided">{formatDhaka(booking.appealResolvedAt)}</Fact>}
              </dl>
              {booking.appealReason && (
                <blockquote className="mt-2 rounded-lg bg-surface-subtle px-3 py-2 text-sm whitespace-pre-line">
                  {booking.appealReason}
                </blockquote>
              )}
            </Panel>
          )}
        </div>
      </div>

      {cancelling && (
        <ReasonDialog
          open
          onOpenChange={setCancelling}
          title={`Cancel ${booking.code}`}
          description="The customer, the salon and the expert are told."
          impact={
            <div className="space-y-3 rounded-xl border border-border p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="salon-at-fault" className="text-sm font-medium">
                  Salon at fault?
                </Label>
                <Switch id="salon-at-fault" checked={salonAtFault} onCheckedChange={setSalonAtFault} />
              </div>
              {outcome.reasonCode === "NOT_PAID" ? (
                <p className="text-muted-foreground">The advance was never paid, so there is nothing to refund.</p>
              ) : (
                <p className="font-medium">
                  Customer gets 100% back: {formatBDT(outcome.refundMinor)}
                  {outcome.salonCreditMinor > 0 &&
                    `, plus ${formatBDT(outcome.salonCreditMinor)} credit paid by the salon`}
                </p>
              )}
            </div>
          }
          reasonCodes={HOME_CANCEL_REASONS}
          showNotify={false}
          stepUp
          tone="danger"
          confirmLabel="Cancel visit"
          onConfirm={(input) =>
            adminCancelHome(booking.id, reasonText(HOME_CANCEL_REASONS, input), salonAtFault)
          }
          onDone={(result) => showResultToast(result)}
        />
      )}
    </div>
  );
}
