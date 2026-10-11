"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  APPEAL_APPROVE_REASONS,
  APPEAL_LABELS,
  APPEAL_REJECT_REASONS,
  CANCEL_REASONS,
  CHANNEL_LABELS,
  DEPOSIT_LABELS,
  LEDGER_ACCOUNT_LABELS,
  SOURCE_LABELS,
  bookingWhen,
} from "@/components/Admin/bookings/labels";
import { EntityHeader } from "@/components/Admin/EntityHeader";
import { CopyId } from "@/components/Admin/MaskedValue";
import { NotesPanel } from "@/components/Admin/NotesPanel";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { Timeline, formatDhaka, type TimelineItem } from "@/components/Admin/Timeline";
import { reasonText } from "@/components/Admin/users/labels";
import { StatusBadge } from "@/components/Dashboard/appointments/StatusBadge";
import { ToneBadge, humanizeStatus } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import { can } from "@/lib/admin-permissions";
import { formatBDT } from "@/lib/money";
import { resolveAppeal } from "@/services/admin/appeals/resolveAppeal";
import { cancelAdminBooking } from "@/services/admin/bookings/cancelAdminBooking";
import { reverseNoShow } from "@/services/admin/bookings/reverseNoShow";
import type { AdminBookingDetail } from "@/services/admin/bookings/types";

type Dialog = "cancel" | "approve" | "reject" | "reverse" | null;

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

const signed = (minor: number) => `${minor >= 0 ? "+" : "−"}${formatBDT(Math.abs(minor))}`;

export function BookingDetailClient({
  booking,
  permissions,
  viewerId,
}: {
  booking: AdminBookingDetail;
  permissions: string[];
  viewerId?: string;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = (open: boolean) => !open && setDialog(null);
  const { money, customer, salon } = booking;

  const canCancel =
    can(permissions, "bookings.manage") && (booking.status === "PENDING" || booking.status === "CONFIRMED");
  const canResolve = can(permissions, "appeals.resolve");
  const appealPending = booking.appealStatus === "PENDING";
  const canReverse =
    canResolve &&
    booking.status === "NO_SHOW" &&
    !appealPending &&
    booking.appealStatus !== "APPROVED" &&
    (money.deposit.amountMinor === 0 || money.deposit.status === "FORFEITED");

  const actions =
    canCancel || (canResolve && appealPending) || canReverse ? (
      <div className="flex flex-wrap gap-2">
        {canCancel && (
          <Button variant="outline" onClick={() => setDialog("cancel")}>
            Cancel for customer
          </Button>
        )}
        {canResolve && appealPending && (
          <>
            <Button onClick={() => setDialog("approve")}>Approve appeal</Button>
            <Button variant="outline" onClick={() => setDialog("reject")}>
              Reject appeal
            </Button>
          </>
        )}
        {canReverse && (
          <Button variant="outline" onClick={() => setDialog("reverse")}>
            Reverse no-show
          </Button>
        )}
      </div>
    ) : null;

  const facts: ReactNode[] = [
    <Link key="salon" href={`/dashboard/admin/salons/${salon.id}`} className="hover:underline">
      {salon.name}
    </Link>,
    bookingWhen(booking.appointmentDate, booking.startTime),
    booking.serialNumber != null ? `Serial #${booking.serialNumber}` : null,
    `${CHANNEL_LABELS[booking.bookedVia] ?? booking.bookedVia} · ${SOURCE_LABELS[booking.source] ?? booking.source}`,
    booking.appealStatus ? APPEAL_LABELS[booking.appealStatus] : null,
    <CopyId key="id" id={booking.id} />,
  ];

  const timeline: TimelineItem[] = booking.timeline.map((e) => ({
    at: e.at,
    title: (
      <span>
        {e.title}
        {e.amountMinor != null && e.amountMinor !== 0 && (
          <span className="ml-2 font-normal tabular-nums text-muted-foreground">{signed(e.amountMinor)}</span>
        )}
      </span>
    ),
    detail: e.detail ?? undefined,
    tone: e.tone,
    meta: e.actor ?? undefined,
  }));

  const depositAmount = formatBDT(money.deposit.amountMinor);

  return (
    <div className="min-w-0 space-y-6">
      <EntityHeader
        title={booking.token ?? "Booking"}
        shape="avatar"
        status={booking.status}
        statusLabel={humanizeStatus(booking.status)}
        facts={facts}
        actions={actions}
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
              money.ledger.length === 0 ? null : money.balanced ? (
                <ToneBadge status="BALANCED" tone="success">
                  Σ = 0 ✓
                </ToneBadge>
              ) : (
                <ToneBadge status="UNBALANCED" tone="danger" dot>
                  Σ = {signed(money.ledgerSumMinor)}
                </ToneBadge>
              )
            }
          >
            <dl className="divide-y divide-border">
              <Fact label="Service">
                {booking.service.name} · {formatBDT(booking.totalMinor)}
              </Fact>
              <Fact label="Deposit">
                {money.deposit.amountMinor > 0
                  ? `${depositAmount} · ${DEPOSIT_LABELS[money.deposit.status] ?? money.deposit.status}`
                  : "None"}
              </Fact>
              <Fact label="Payment">
                {money.payment
                  ? `${formatBDT(money.payment.amountMinor)} · ${humanizeStatus(money.payment.paymentMethod)} · ${humanizeStatus(money.payment.status)}`
                  : "Not recorded"}
              </Fact>
            </dl>

            <h3 className="mt-5 mb-2 text-sm font-medium">Wallet transactions</h3>
            {money.walletTx.length ? (
              <ul className="divide-y divide-border text-sm">
                {money.walletTx.map((tx) => (
                  <li key={tx.id} className="flex items-start justify-between gap-4 py-1.5">
                    <div className="min-w-0">
                      <p>{humanizeStatus(tx.type)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDhaka(tx.createdAt)} · {tx.description}
                      </p>
                    </div>
                    <span className="shrink-0 tabular-nums">{signed(tx.amountMinor)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">None.</p>
            )}

            <h3 className="mt-5 mb-2 text-sm font-medium">Ledger</h3>
            {money.ledger.length ? (
              <ul className="divide-y divide-border text-sm">
                {money.ledger.map((row) => (
                  <li key={row.id} className="flex items-start justify-between gap-4 py-1.5">
                    <div className="min-w-0">
                      <p>{LEDGER_ACCOUNT_LABELS[row.account] ?? row.account}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDhaka(row.createdAt)} · {row.description}
                        {row.payoutId ? " · paid out" : ""}
                      </p>
                    </div>
                    <span className="shrink-0 tabular-nums">{signed(row.amountMinor)}</span>
                  </li>
                ))}
                <li className="flex justify-between gap-4 py-1.5 font-medium">
                  <span>Σ</span>
                  <span className={money.balanced ? "tabular-nums" : "tabular-nums text-danger"}>
                    {signed(money.ledgerSumMinor)}
                  </span>
                </li>
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No ledger entries.</p>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-4">
          <Panel
            title="Customer"
            action={
              <Link href={`/dashboard/admin/users/${customer.id}`} className="text-sm text-primary hover:underline">
                Open
              </Link>
            }
          >
            <dl className="divide-y divide-border">
              <Fact label="Name">
                {customer.name}
                {customer.isTest && <span className="ml-2 text-xs text-muted-foreground">test</span>}
              </Fact>
              <Fact label="Email">{customer.email}</Fact>
              <Fact label="Phone">{customer.phone ?? "—"}</Fact>
              <Fact label="Account">
                <StatusBadge status={customer.status} />
              </Fact>
              <Fact label="Bookings">{customer.bookings}</Fact>
              <Fact label="No-shows">{customer.noShows}</Fact>
            </dl>
          </Panel>

          <Panel
            title="Salon"
            action={
              <Link href={`/dashboard/admin/salons/${salon.id}`} className="text-sm text-primary hover:underline">
                Open
              </Link>
            }
          >
            <dl className="divide-y divide-border">
              <Fact label="Name">{salon.name}</Fact>
              <Fact label="Area">{salon.area ?? "—"}</Fact>
              <Fact label="Status">
                <StatusBadge status={salon.status} />
              </Fact>
              <Fact label="Phone">{salon.phone ?? "—"}</Fact>
              <Fact label="Owner">
                {salon.owner ? (
                  <Link href={`/dashboard/admin/users/${salon.owner.id}`} className="hover:underline">
                    {salon.owner.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Fact>
              {salon.owner && <Fact label="Owner email">{salon.owner.email}</Fact>}
              <Fact label="Staff">{booking.staff?.user?.name ?? "Any"}</Fact>
              <Fact label="Counter">{booking.counter?.name ?? "—"}</Fact>
            </dl>
          </Panel>

          {booking.appealReason && (
            <Panel title="Appeal">
              <p className="text-sm whitespace-pre-line">{booking.appealReason}</p>
              {booking.appealedAt && (
                <p className="mt-2 text-xs text-muted-foreground">Appealed {formatDhaka(booking.appealedAt)}</p>
              )}
            </Panel>
          )}

          <Panel title="Notes">
            <NotesPanel entityType="booking" entityId={booking.id} currentUserId={viewerId} />
          </Panel>
        </div>
      </div>

      <ReasonDialog
        open={dialog === "cancel"}
        onOpenChange={close}
        title="Cancel this booking for the customer"
        description={`The slot reopens and ${
          money.deposit.amountMinor > 0 ? `the whole ${depositAmount} deposit` : "any deposit"
        } goes back to the customer's wallet, with no late penalty.`}
        reasonCodes={CANCEL_REASONS}
        notifyLabel="Email the customer and the salon"
        tone="danger"
        confirmLabel="Cancel booking"
        onConfirm={(input) =>
          cancelAdminBooking(booking.id, {
            reasonCode: input.reasonCode,
            note: input.note || undefined,
            notify: input.notify,
          })
        }
        onDone={(result) => showResultToast(result)}
      />
      <ReasonDialog
        open={dialog === "approve"}
        onOpenChange={close}
        title="Uphold this appeal"
        description={`The no-show is reversed and ${
          money.deposit.amountMinor > 0 ? `${depositAmount} goes back to the customer's wallet` : "the appeal is closed"
        }. The customer gets an email.`}
        reasonCodes={APPEAL_APPROVE_REASONS}
        showNotify={false}
        confirmLabel="Approve appeal"
        onConfirm={(input) => {
          const reason = reasonText(APPEAL_APPROVE_REASONS, input);
          return resolveAppeal(booking.id, { approve: true, reason });
        }}
        onDone={(result) => showResultToast(result)}
      />
      <ReasonDialog
        open={dialog === "reject"}
        onOpenChange={close}
        title="Reject this appeal"
        description="The deposit stays forfeited. The customer gets an email with your note."
        reasonCodes={APPEAL_REJECT_REASONS}
        showNotify={false}
        tone="danger"
        confirmLabel="Reject appeal"
        onConfirm={(input) => {
          const note = reasonText(APPEAL_REJECT_REASONS, input);
          return resolveAppeal(booking.id, { approve: false, note, reason: note });
        }}
        onDone={(result) => showResultToast(result)}
      />
      <ReasonDialog
        open={dialog === "reverse"}
        onOpenChange={close}
        title="Reverse this no-show"
        description={`No appeal is on file. ${
          money.deposit.amountMinor > 0 ? `${depositAmount} goes back to the customer's wallet` : "Nothing was forfeited"
        }, and the customer gets an email.`}
        reasonCodes={APPEAL_APPROVE_REASONS}
        showNotify={false}
        confirmLabel="Reverse no-show"
        onConfirm={(input) => reverseNoShow(booking.id, reasonText(APPEAL_APPROVE_REASONS, input))}
        onDone={(result) => showResultToast(result)}
      />
    </div>
  );
}
