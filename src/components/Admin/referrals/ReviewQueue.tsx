"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDhaka } from "@/components/Admin/Timeline";
import { useClock } from "@/components/Admin/useClock";
import { EmptyState } from "@/components/Shared/EmptyState";
import { PageHeader } from "@/components/Shared/PageHeader";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import { can } from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";
import type { AdminReferralDetail, AdminRewardRow } from "@/services/referral/types";
import { termsText } from "./labels";
import { ageOf, BookingFacts, Fact, FlagList } from "./ReferralParts";
import { ReferralDecisionDialog, type Decision } from "./ReferralDecisionDialog";

export type ReviewItem = {
  reward: AdminRewardRow;
  detail: AdminReferralDetail;
  /** Referrals on the referrer's code since the 1st (Dhaka); null when the count failed. */
  thisMonth: number | null;
};

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/**
 * One card per held referrer reward, oldest first, with everything needed to
 * decide: the flags explained, the friend's account age and verification,
 * the first booking (salon, amount, who completed it) and how busy the
 * referrer's code has been this month. `j` / `k` move between cards; Tab
 * reaches the buttons. Decided cards leave at once.
 */
export function ReviewQueue({ items, total, permissions }: { items: ReviewItem[]; total: number; permissions: string[] }) {
  const now = useClock();
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const [decision, setDecision] = useState<Decision | null>(null);
  const [active, setActive] = useState(0);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const canUsers = can(permissions, "users.view");
  const visible = items.filter((i) => !done.has(i.detail.id));
  const current = Math.min(active, Math.max(visible.length - 1, 0));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (decision || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      if (document.querySelector("[role=dialog]")) return;
      if (e.key !== "j" && e.key !== "k") return;
      e.preventDefault();
      const next = Math.min(Math.max(current + (e.key === "j" ? 1 : -1), 0), visible.length - 1);
      setActive(next);
      cards.current[next]?.focus();
      cards.current[next]?.scrollIntoView({ block: "nearest" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, decision, visible.length]);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Review"
        description={
          visible.length
            ? `${Math.max(total - done.size, visible.length)} held referrer reward${total === 1 ? "" : "s"}, oldest first. Press j / k to move between cards, Tab to reach the buttons.`
            : "Referrer rewards held because of a risk flag wait here for a decision."
        }
      />

      {visible.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing to review." description="Held rewards show up here, oldest first." />
      ) : (
        <ol className="space-y-4" aria-label="Held referrer rewards">
          {visible.map((item, index) => {
            const d = item.detail;
            const autoClosed = d.flags.some((f) => f.flag === "AUTO_CLOSED");
            return (
              <li key={d.id}>
                <Card
                  ref={(el) => {
                    cards.current[index] = el;
                  }}
                  tabIndex={-1}
                  aria-label={`${d.referrer.name} referred ${d.referee.name}`}
                  onFocus={() => setActive(index)}
                  className={cn(
                    "gap-0 py-0 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    index === current && "border-primary/60",
                  )}
                >
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {canUsers ? (
                            <Link href={`/dashboard/admin/users/${d.referrer.id}`} className="text-primary hover:underline">
                              {d.referrer.name}
                            </Link>
                          ) : (
                            d.referrer.name
                          )}{" "}
                          <span className="text-muted-foreground">referred</span>{" "}
                          {canUsers ? (
                            <Link href={`/dashboard/admin/users/${d.referee.id}`} className="text-primary hover:underline">
                              {d.referee.name}
                            </Link>
                          ) : (
                            d.referee.name
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Code {d.code} · held {formatDhaka(item.reward.createdAt)}
                          {now !== null && ` · waiting ${ageOf(item.reward.createdAt, now)}`}
                        </p>
                      </div>
                      <ToneBadge status="PENDING_REVIEW">
                        Held · {termsText(item.reward.percent, item.reward.maxDiscountMinor)}
                      </ToneBadge>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                      <section aria-label="Why it was held" className="space-y-2 lg:col-span-1">
                        <h3 className="text-sm font-semibold">Why it was held</h3>
                        <FlagList flags={d.flags} emptyText="No flags on the referral (held by a rule)." />
                      </section>
                      <section aria-label="The friend" className="space-y-1">
                        <h3 className="text-sm font-semibold">The friend</h3>
                        <dl className="divide-y divide-border">
                          <Fact label="Account age">{now === null ? formatDhaka(d.referee.joinedAt) : ageOf(d.referee.joinedAt, now)}</Fact>
                          <Fact label="Email">
                            <ToneBadge status={d.referee.emailVerified ? "VERIFIED" : "UNVERIFIED"} tone={d.referee.emailVerified ? "success" : "warning"}>
                              {d.referee.emailVerified ? "Verified" : "Not verified"}
                            </ToneBadge>
                          </Fact>
                          <Fact label="Referrer this month">
                            {item.thisMonth === null ? "—" : `${item.thisMonth} referral${item.thisMonth === 1 ? "" : "s"}`}
                          </Fact>
                        </dl>
                      </section>
                      <section aria-label="First booking" className="space-y-1">
                        <h3 className="text-sm font-semibold">First booking</h3>
                        <BookingFacts booking={d.qualifyingBooking} autoClosed={autoClosed} />
                      </section>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
                      <Button variant="ghost" asChild className="mr-auto">
                        <Link href={`/dashboard/admin/referrals/list?open=${encodeURIComponent(d.id)}`}>Full details</Link>
                      </Button>
                      {d.canReject && (
                        <Button variant="outline" onClick={() => setDecision({ kind: "reject", id: d.id, who: d.referrer.name })}>
                          Reject…
                        </Button>
                      )}
                      {d.canApprove && (
                        <Button onClick={() => setDecision({ kind: "approve", id: d.id, who: d.referrer.name })}>Approve…</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ol>
      )}

      <ReferralDecisionDialog
        decision={decision}
        onClose={() => setDecision(null)}
        onDone={(result, decided) => {
          showResultToast(result);
          setDecision(null);
          setDone((prev) => new Set(prev).add(decided.id));
          // Focus the card that moved up into this place.
          requestAnimationFrame(() => cards.current[current]?.focus());
        }}
      />
    </div>
  );
}
