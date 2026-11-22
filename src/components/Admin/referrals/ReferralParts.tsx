"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, Eye, EyeOff } from "lucide-react";
import { formatDhaka } from "@/components/Admin/Timeline";
import { maskEmail, maskPhone } from "@/components/Admin/MaskedValue";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { formatBDT } from "@/lib/money";
import type {
  AdminBookingRef,
  AdminReferralPerson,
  AdminRewardView,
  RewardSkip,
  RiskFlag,
} from "@/services/referral/types";
import {
  bookingRefText,
  FLAG_TEXT,
  KIND_LABELS,
  REWARD_STATUS_LABELS,
  SCOPE_LABELS,
  SKIP_LABELS,
  termsText,
} from "./labels";

/*
 * The pieces the detail sheet and the review cards share: a person, the risk
 * flags in plain English, the qualifying booking and a reward.
 */

export const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right break-words">{children}</dd>
  </div>
);

/**
 * A contact masked by default. With `users.view_pii` the API sent it whole,
 * and "Show" reveals it; without, it is already masked and there is no button.
 */
export function RevealValue({ value, kind, canReveal }: { value: string | null | undefined; kind: "email" | "phone"; canReveal: boolean }) {
  const [shown, setShown] = useState(false);
  if (!value) return <span className="text-muted-foreground">—</span>;
  const masked = kind === "email" ? maskEmail(value) : maskPhone(value);
  if (!canReveal) return <span className="tabular-nums">{value.includes("•") ? value : masked}</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="tabular-nums">{shown ? value : masked}</span>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? `Hide ${kind}` : `Show ${kind}`}
        aria-pressed={shown}
        className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {shown ? <EyeOff aria-hidden className="size-3.5" /> : <Eye aria-hidden className="size-3.5" />}
      </button>
    </span>
  );
}

/** "3 d" / "5 h" since an ISO time. */
export const ageOf = (iso: string, nowMs: number) => {
  const h = Math.max(0, Math.floor((nowMs - Date.parse(iso)) / 3_600_000));
  if (h < 48) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
};

export function PersonFacts({
  title,
  person,
  canUsers,
  canReveal,
  nowMs,
}: {
  title: string;
  person: AdminReferralPerson;
  canUsers: boolean;
  canReveal: boolean;
  nowMs: number | null;
}) {
  return (
    <section aria-label={title} className="min-w-0 rounded-xl border border-border p-3">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
        {person.isTest && <ToneBadge status="test" tone="neutral">Test</ToneBadge>}
      </div>
      <p className="truncate font-medium">
        {canUsers ? (
          <Link href={`/dashboard/admin/users/${person.id}`} className="text-primary underline-offset-4 hover:underline">
            {person.name}
          </Link>
        ) : (
          person.name
        )}
      </p>
      <dl className="divide-y divide-border">
        <Fact label="Email">
          <RevealValue value={person.email} kind="email" canReveal={canReveal} />
        </Fact>
        {person.phone !== undefined && (
          <Fact label="Phone">
            <RevealValue value={person.phone} kind="phone" canReveal={canReveal} />
          </Fact>
        )}
        <Fact label="Account">
          {formatDhaka(person.joinedAt)}
          {nowMs !== null && <span className="text-muted-foreground"> · {ageOf(person.joinedAt, nowMs)} old</span>}
        </Fact>
        <Fact label="Email verified">
          <ToneBadge status={person.emailVerified ? "VERIFIED" : "UNVERIFIED"} tone={person.emailVerified ? "success" : "warning"}>
            {person.emailVerified ? "Verified" : "Not verified"}
          </ToneBadge>
        </Fact>
        {person.status !== "ACTIVE" && (
          <Fact label="Status">
            <ToneBadge status={person.status} />
          </Fact>
        )}
        {person.code && (
          <Fact label="Code">
            <code className="font-mono text-xs">{person.code}</code>
            {person.codeBlocked && (
              <ToneBadge status="BLOCKED" className="ml-2">
                Blocked
              </ToneBadge>
            )}
          </Fact>
        )}
      </dl>
    </section>
  );
}

export function FlagList({ flags, emptyText = "No risk flags." }: { flags: Array<{ flag: RiskFlag; reason: string }>; emptyText?: string }) {
  if (flags.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <ul className="space-y-2">
      {flags.map((f) => (
        <li key={f.flag} className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft/60 p-3 text-sm">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
          <span className="min-w-0">
            <span className="block font-medium">{FLAG_TEXT[f.flag] ?? f.flag}</span>
            <span className="block text-muted-foreground">{f.reason}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function BookingFacts({ booking, autoClosed }: { booking: AdminBookingRef | null; autoClosed: boolean }) {
  if (!booking) return <p className="text-sm text-muted-foreground">No qualifying booking yet.</p>;
  const ref = bookingRefText(booking);
  return (
    <dl className="divide-y divide-border">
      <Fact label="Booking">
        {booking.href ? (
          <Link href={booking.href} className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
            {ref}
            <ExternalLink aria-hidden className="size-3.5" />
          </Link>
        ) : (
          ref
        )}
      </Fact>
      {booking.salon && <Fact label="Salon">{booking.salon.name}</Fact>}
      <Fact label="Kind">{booking.kind === "HOME" ? "Home visit" : "Salon booking"}</Fact>
      {booking.billableMinor !== undefined && <Fact label="Amount">{formatBDT(booking.billableMinor)}</Fact>}
      {!!booking.promoDiscountMinor && <Fact label="Referral discount">−{formatBDT(booking.promoDiscountMinor)}</Fact>}
      {booking.completedAt && <Fact label="Completed">{formatDhaka(booking.completedAt)}</Fact>}
      {booking.status === "COMPLETED" && (
        <Fact label="Completed by">
          {autoClosed ? (
            <span className="text-warning">The system (closed automatically)</span>
          ) : booking.kind === "HOME" ? (
            "The expert"
          ) : (
            "The salon"
          )}
        </Fact>
      )}
      {booking.status !== "COMPLETED" && (
        <Fact label="Status">
          <ToneBadge status={booking.status} />
        </Fact>
      )}
    </dl>
  );
}

export function RewardFacts({ title, reward, skip }: { title: string; reward: AdminRewardView | null; skip?: RewardSkip | null }) {
  return (
    <section aria-label={title} className="min-w-0 rounded-xl border border-border p-3">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
        {reward && <ToneBadge status={reward.status}>{REWARD_STATUS_LABELS[reward.status]}</ToneBadge>}
      </div>
      {!reward ? (
        <p className="text-sm text-muted-foreground">{skip ? SKIP_LABELS[skip] : "Not issued yet."}</p>
      ) : (
        <dl className="divide-y divide-border">
          <Fact label="Kind">{KIND_LABELS[reward.kind]}</Fact>
          <Fact label="Terms">{termsText(reward.percent, reward.maxDiscountMinor)}</Fact>
          <Fact label="Where">{SCOPE_LABELS[reward.scope]}</Fact>
          <Fact label="Expires">{formatDhaka(reward.expiresAt)}</Fact>
          {reward.booking && <Fact label="Booking">{bookingRefText(reward.booking)}</Fact>}
          {reward.discountMinor > 0 && <Fact label="Discount">−{formatBDT(reward.discountMinor)}</Fact>}
          {reward.revokeReason && <Fact label="Revoked because">{reward.revokeReason}</Fact>}
          {reward.expiredReason && <Fact label="Expired because">{reward.expiredReason.replace(/_/g, " ").toLowerCase()}</Fact>}
          {reward.grantReason && <Fact label="Granted because">{reward.grantReason}</Fact>}
        </dl>
      )}
    </section>
  );
}
