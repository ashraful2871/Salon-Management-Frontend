"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  APPEAL_APPROVE_REASONS,
  APPEAL_REJECT_REASONS,
  bookingWhen,
} from "@/components/Admin/bookings/labels";
import {
  HOME_APPEAL_REJECT_REASONS,
  HOME_APPEAL_UPHOLD_REASONS,
  SIDE_LABELS,
} from "@/components/Admin/home-service/labels";
import { CopyId } from "@/components/Admin/MaskedValue";
import { ReasonDialog, type ReasonInput } from "@/components/Admin/ReasonDialog";
import { formatDhaka } from "@/components/Admin/Timeline";
import { useClock } from "@/components/Admin/useClock";
import { reasonText } from "@/components/Admin/users/labels";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { PageHeader } from "@/components/Shared/PageHeader";
import { humanizeStatus, ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import type { ApiResponse } from "@/lib/api-types";
import { formatBDT } from "@/lib/money";
import { resolveAppeal } from "@/services/admin/appeals/resolveAppeal";
import type { AdminAppealRow } from "@/services/admin/bookings/types";
import { resolveHomeAppeal } from "@/services/home-service/resolveHomeAppeal";
import type { AdminHomeAppeal } from "@/services/home-service/types";

const HOUR = 60 * 60 * 1000;

/** "Due in 31 h", "Due in 40 min", "Overdue by 3 h". */
const dueLabel = (dueAt: string, now: number) => {
  const ms = new Date(dueAt).getTime() - now;
  const abs = Math.abs(ms);
  const span = abs >= HOUR ? `${Math.floor(abs / HOUR)} h` : `${Math.max(1, Math.round(abs / 60000))} min`;
  return ms >= 0 ? `Due in ${span}` : `Overdue by ${span}`;
};

type Row = AdminAppealRow | AdminHomeAppeal;

const isHome = (row: Row): row is AdminHomeAppeal => "kind" in row && row.kind === "HOME";

const reasonsFor = (row: Row, approve: boolean) =>
  isHome(row)
    ? approve
      ? HOME_APPEAL_UPHOLD_REASONS
      : HOME_APPEAL_REJECT_REASONS
    : approve
      ? APPEAL_APPROVE_REASONS
      : APPEAL_REJECT_REASONS;

/** Soonest deadline first, whichever kind it is. */
const byDue = (a: Row, b: Row) => (a.dueAt ?? "").localeCompare(b.dueAt ?? "");

const describeDecision = (row: Row, approve: boolean) => {
  if (isHome(row)) {
    return approve
      ? `${formatBDT(row.feeMinor)} goes back to ${row.customer.name}'s wallet. They get an email.`
      : `The fee stays kept. ${row.customer.name} gets an email with your note.`;
  }
  return approve
    ? `The no-show is reversed${
        row.depositMinor > 0 ? ` and ${formatBDT(row.depositMinor)} goes back to ${row.customer.name}'s wallet` : ""
      }. They get an email.`
    : `The deposit stays forfeited. ${row.customer.name} gets an email with your note.`;
};

function HomeAppealCard({
  row,
  pending,
  due,
  buttons,
}: {
  row: AdminHomeAppeal;
  pending: boolean;
  due: ReactNode;
  buttons: ReactNode;
}) {
  return (
    <Card className={pending ? "opacity-60" : undefined} aria-busy={pending}>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/dashboard/admin/home-service/bookings/${row.id}`} className="font-medium hover:underline">
                {row.code}
              </Link>
              <ToneBadge status="HOME" tone="primary">
                Home
              </ToneBadge>
              {row.isTest && <span className="text-xs text-muted-foreground">test</span>}
            </div>
            <p className="text-sm text-muted-foreground">
              <Link href={`/dashboard/admin/users/${row.customer.id}`} className="hover:underline">
                {row.customer.name}
              </Link>{" "}
              with{" "}
              <Link href={`/dashboard/admin/salons/${row.salon.id}`} className="hover:underline">
                {row.salon.name}
              </Link>{" "}
              · {row.services.join(", ")} · {formatDhaka(row.startAt)}
            </p>
          </div>
          {due}
        </div>

        {row.appealReason && (
          <blockquote className="rounded-lg bg-surface-subtle px-3 py-2 text-sm whitespace-pre-line">
            {row.appealReason}
          </blockquote>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Side</dt>
            <dd>{SIDE_LABELS[row.audience]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Advance</dt>
            <dd>{formatBDT(row.advanceMinor)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fee kept</dt>
            <dd>{formatBDT(row.feeMinor)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Ended by</dt>
            <dd>
              {row.noShowParty
                ? `${humanizeStatus(row.noShowParty)} no-show`
                : row.cancelledBy
                  ? humanizeStatus(row.cancelledBy)
                  : humanizeStatus(row.status)}
            </dd>
          </div>
        </dl>

        {row.cancelReason && <p className="text-xs text-muted-foreground">{row.cancelReason}</p>}
        {buttons}
      </CardContent>
    </Card>
  );
}

type Decision = { row: Row; approve: boolean } | null;

export function AppealsClient({
  response,
  homeResponse,
}: {
  response: ApiResponse<AdminAppealRow[]>;
  homeResponse: ApiResponse<AdminHomeAppeal[]>;
}) {
  const now = useClock();
  const salon = response.success && Array.isArray(response.data) ? response.data : [];
  const home = homeResponse.success && Array.isArray(homeResponse.data) ? homeResponse.data : [];
  const appeals: Row[] = [...salon, ...home].sort(byDue);
  const [rows, removeOptimistic] = useOptimistic(appeals, (state, id: string) => state.filter((r) => r.id !== id));
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [decision, setDecision] = useState<Decision>(null);
  const [, startTransition] = useTransition();

  const setPending = (id: string, on: boolean) =>
    setPendingIds((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  /**
   * The dialog resolves once the server answered; the row leaves the list as
   * soon as the decision is confirmed and comes back if it failed.
   */
  const decide = (row: Row, approve: boolean, input: ReasonInput) => {
    const text = reasonText(reasonsFor(row, approve), input);
    setPending(row.id, true);
    return new Promise<ApiResponse<{ id: string; appealStatus: string | null }>>((resolve) => {
      startTransition(async () => {
        removeOptimistic(row.id);
        const result = isHome(row)
          ? await resolveHomeAppeal(row.id, approve, text)
          : await resolveAppeal(row.id, approve ? { approve, reason: text } : { approve, note: text, reason: text });
        setPending(row.id, false);
        resolve(result);
      });
    });
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="No-show appeals"
        description="Customers who say they did turn up, or that a home visit's fee is wrong. Decide each within 48 hours of the appeal; the customer is emailed either way."
      />

      {response.success && !homeResponse.success && (
        <p role="alert" className="text-sm text-danger">
          Home visit appeals couldn&apos;t be loaded. {homeResponse.message}
        </p>
      )}

      {!response.success ? (
        <ErrorState title="Couldn't load the appeals" message={response.message} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Scale} title="No appeals waiting" description="New appeals show up here as customers send them." />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const pending = pendingIds.has(row.id);
            const msLeft = row.dueAt && now != null ? new Date(row.dueAt).getTime() - now : null;
            const tone = msLeft == null ? "neutral" : msLeft < 12 * HOUR ? "danger" : msLeft < 24 * HOUR ? "warning" : "neutral";
            const due = row.dueAt && (
              <ToneBadge status="APPEAL_DUE" tone={tone} dot>
                {now == null ? `Due ${formatDhaka(row.dueAt)}` : dueLabel(row.dueAt, now)}
              </ToneBadge>
            );
            const buttons = (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={pending} onClick={() => setDecision({ row, approve: true })}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" disabled={pending} onClick={() => setDecision({ row, approve: false })}>
                  Reject
                </Button>
              </div>
            );
            if (isHome(row)) {
              return (
                <li key={row.id}>
                  <HomeAppealCard row={row} pending={pending} due={due} buttons={buttons} />
                </li>
              );
            }
            return (
              <li key={row.id}>
                <Card className={pending ? "opacity-60" : undefined} aria-busy={pending}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/dashboard/admin/bookings/${row.id}`} className="font-medium hover:underline">
                            {row.token ?? "Booking"}
                          </Link>
                          {row.token && <CopyId id={row.token} label="token" />}
                          {(row.customer.isTest || row.salon.isTest) && (
                            <span className="text-xs text-muted-foreground">test</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <Link href={`/dashboard/admin/users/${row.customer.id}`} className="hover:underline">
                            {row.customer.name}
                          </Link>{" "}
                          at{" "}
                          <Link href={`/dashboard/admin/salons/${row.salon.id}`} className="hover:underline">
                            {row.salon.name}
                          </Link>{" "}
                          · {row.service.name} · {bookingWhen(row.appointmentDate, row.startTime)}
                        </p>
                      </div>
                      {due}
                    </div>

                    {row.appealReason && (
                      <blockquote className="rounded-lg bg-surface-subtle px-3 py-2 text-sm whitespace-pre-line">
                        {row.appealReason}
                      </blockquote>
                    )}

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                      <div>
                        <dt className="text-muted-foreground">Deposit</dt>
                        <dd>{row.depositMinor > 0 ? formatBDT(row.depositMinor) : "None"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Checked in</dt>
                        <dd>{row.checkedInAt ? formatDhaka(row.checkedInAt) : "No"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Reminders sent</dt>
                        <dd>{row.remindersSent.length ? row.remindersSent.join(", ") : "None"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">No-shows</dt>
                        <dd>
                          Customer {row.customerNoShows} · Salon{" "}
                          {row.salonNoShowRate90d == null
                            ? "—"
                            : `${Math.round(row.salonNoShowRate90d * 100)}% of ${row.salonSettled90d} (90 d)`}
                        </dd>
                      </div>
                    </dl>

                    {buttons}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {decision && (
        <ReasonDialog
          open
          onOpenChange={(open) => !open && setDecision(null)}
          title={decision.approve ? "Uphold this appeal" : "Reject this appeal"}
          description={describeDecision(decision.row, decision.approve)}
          reasonCodes={reasonsFor(decision.row, decision.approve)}
          showNotify={false}
          tone={decision.approve ? "default" : "danger"}
          confirmLabel={decision.approve ? "Approve appeal" : "Reject appeal"}
          onConfirm={(input) => decide(decision.row, decision.approve, input)}
          onDone={(result) => showResultToast(result)}
        />
      )}
    </div>
  );
}
