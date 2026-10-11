"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  APPEAL_APPROVE_REASONS,
  APPEAL_REJECT_REASONS,
  bookingWhen,
} from "@/components/Admin/bookings/labels";
import { CopyId } from "@/components/Admin/MaskedValue";
import { ReasonDialog, type ReasonInput } from "@/components/Admin/ReasonDialog";
import { formatDhaka } from "@/components/Admin/Timeline";
import { useClock } from "@/components/Admin/useClock";
import { reasonText } from "@/components/Admin/users/labels";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { PageHeader } from "@/components/Shared/PageHeader";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import type { ApiResponse } from "@/lib/api-types";
import { formatBDT } from "@/lib/money";
import { resolveAppeal } from "@/services/admin/appeals/resolveAppeal";
import type { AdminAppealRow } from "@/services/admin/bookings/types";

const HOUR = 60 * 60 * 1000;

/** "Due in 31 h", "Due in 40 min", "Overdue by 3 h". */
const dueLabel = (dueAt: string, now: number) => {
  const ms = new Date(dueAt).getTime() - now;
  const abs = Math.abs(ms);
  const span = abs >= HOUR ? `${Math.floor(abs / HOUR)} h` : `${Math.max(1, Math.round(abs / 60000))} min`;
  return ms >= 0 ? `Due in ${span}` : `Overdue by ${span}`;
};

type Decision = { row: AdminAppealRow; approve: boolean } | null;

export function AppealsClient({ response }: { response: ApiResponse<AdminAppealRow[]> }) {
  const now = useClock();
  const appeals = response.success && Array.isArray(response.data) ? response.data : [];
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
  const decide = (row: AdminAppealRow, approve: boolean, input: ReasonInput) => {
    const codes = approve ? APPEAL_APPROVE_REASONS : APPEAL_REJECT_REASONS;
    const text = reasonText(codes, input);
    setPending(row.id, true);
    return new Promise<ApiResponse<{ id: string; appealStatus: string | null }>>((resolve) => {
      startTransition(async () => {
        removeOptimistic(row.id);
        const result = await resolveAppeal(row.id, approve ? { approve, reason: text } : { approve, note: text, reason: text });
        setPending(row.id, false);
        resolve(result);
      });
    });
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="No-show appeals"
        description="Customers who say they did turn up. Decide each within 48 hours of the appeal; the customer is emailed either way."
      />

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
                      {row.dueAt && (
                        <ToneBadge status="APPEAL_DUE" tone={tone} dot>
                          {now == null ? `Due ${formatDhaka(row.dueAt)}` : dueLabel(row.dueAt, now)}
                        </ToneBadge>
                      )}
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

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" disabled={pending} onClick={() => setDecision({ row, approve: true })}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => setDecision({ row, approve: false })}>
                        Reject
                      </Button>
                    </div>
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
          description={
            decision.approve
              ? `The no-show is reversed${
                  decision.row.depositMinor > 0
                    ? ` and ${formatBDT(decision.row.depositMinor)} goes back to ${decision.row.customer.name}'s wallet`
                    : ""
                }. They get an email.`
              : `The deposit stays forfeited. ${decision.row.customer.name} gets an email with your note.`
          }
          reasonCodes={decision.approve ? APPEAL_APPROVE_REASONS : APPEAL_REJECT_REASONS}
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
