"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDhaka, Timeline, type TimelineItem } from "@/components/Admin/Timeline";
import { useClock } from "@/components/Admin/useClock";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import type { AdminReferralDetail } from "@/services/referral/types";
import { CHANNEL_LABELS, REFERRAL_STATUS_LABELS } from "./labels";
import { BookingFacts, FlagList, PersonFacts, RewardFacts } from "./ReferralParts";

const EVENT_TONE: Record<string, TimelineItem["tone"]> = {
  flagged: "warning",
  rejected: "danger",
  revoked: "danger",
  blocked: "danger",
  approved: "success",
  qualified: "success",
  redeemed: "success",
  "referrer.issued": "success",
  "welcome.issued": "success",
  expired: "neutral",
};

/**
 * One referral: both people (contacts masked; revealed with users.view_pii),
 * the risk flags in plain English, the qualifying booking, both rewards and
 * every event. Approve / Reject with referrals.manage, when the API says so.
 */
export function ReferralSheet({
  open,
  detail,
  error,
  loading,
  canManage,
  canUsers,
  canReveal,
  onClose,
  onDecide,
}: {
  open: boolean;
  detail: AdminReferralDetail | null;
  error: string | null;
  loading: boolean;
  canManage: boolean;
  canUsers: boolean;
  canReveal: boolean;
  onClose: () => void;
  onDecide: (kind: "approve" | "reject", detail: AdminReferralDetail) => void;
}) {
  const now = useClock();
  const autoClosed = !!detail?.flags.some((f) => f.flag === "AUTO_CLOSED");
  const reveal = canReveal && !detail?.piiMasked;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="flex h-dvh w-full max-w-none flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle className="pr-8">
            {detail ? `${detail.referrer.name} → ${detail.referee.name}` : "Referral"}
          </SheetTitle>
          <SheetDescription>
            {detail
              ? `Code ${detail.code} · by ${CHANNEL_LABELS[detail.channel].toLowerCase()} · ${formatDhaka(detail.createdAt)}`
              : "Loading the referral…"}
          </SheetDescription>
          {detail && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <ToneBadge status={detail.status}>{REFERRAL_STATUS_LABELS[detail.status]}</ToneBadge>
              {detail.isTest && <ToneBadge status="test" tone="neutral">Test</ToneBadge>}
              {detail.flags.length > 0 && (
                <ToneBadge status="flagged" tone="warning">
                  {detail.flags.length} flag{detail.flags.length === 1 ? "" : "s"}
                </ToneBadge>
              )}
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {loading && !detail ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 aria-hidden className="size-4 animate-spin" /> Loading…
            </p>
          ) : error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : detail ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <PersonFacts title="Referrer" person={detail.referrer} canUsers={canUsers} canReveal={reveal} nowMs={now} />
                <PersonFacts title="Friend" person={detail.referee} canUsers={canUsers} canReveal={reveal} nowMs={now} />
              </div>

              <section aria-labelledby="ref-flags" className="space-y-2">
                <h3 id="ref-flags" className="text-sm font-semibold">
                  Risk flags
                </h3>
                <FlagList flags={detail.flags} />
              </section>

              <section aria-labelledby="ref-booking" className="space-y-1">
                <h3 id="ref-booking" className="text-sm font-semibold">
                  Qualifying booking
                </h3>
                <BookingFacts booking={detail.qualifyingBooking} autoClosed={autoClosed} />
              </section>

              <div className="grid gap-3 sm:grid-cols-2">
                <RewardFacts title="Friend's welcome reward" reward={detail.rewards.welcome} />
                <RewardFacts title="Referrer reward" reward={detail.rewards.referrer} skip={detail.referrerRewardSkip} />
              </div>

              {(detail.rejectedReason || detail.reviewNote) && (
                <section className="space-y-1 text-sm">
                  <h3 className="font-semibold">Last decision</h3>
                  <p className="text-muted-foreground">
                    {detail.rejectedReason ?? detail.reviewNote}
                    {detail.reviewedAt && ` · ${formatDhaka(detail.reviewedAt)}`}
                  </p>
                </section>
              )}

              <section aria-labelledby="ref-events" className="space-y-2">
                <h3 id="ref-events" className="text-sm font-semibold">
                  Timeline
                </h3>
                {detail.events.length ? (
                  <Timeline
                    items={[...detail.events].reverse().map((e) => ({
                      at: e.createdAt,
                      title: e.label,
                      detail: e.actor ? `By ${e.actor.name ?? "an admin"}` : undefined,
                      tone: EVENT_TONE[e.type] ?? "neutral",
                    }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No events yet.</p>
                )}
              </section>
            </>
          ) : null}
        </div>

        {detail && canManage && (detail.canApprove || detail.canReject) && (
          <SheetFooter className="flex-row flex-wrap justify-end gap-2 border-t border-border px-5 py-3">
            {detail.canReject && (
              <Button variant="outline" disabled={loading} onClick={() => onDecide("reject", detail)}>
                Reject…
              </Button>
            )}
            {detail.canApprove && (
              <Button disabled={loading} onClick={() => onDecide("approve", detail)}>
                Approve reward…
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
