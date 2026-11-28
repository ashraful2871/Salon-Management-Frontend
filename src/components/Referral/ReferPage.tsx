import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarCheck,
  CircleAlert,
  CirclePause,
  Clock,
  Gift,
  House,
  Info,
  PiggyBank,
  Scissors,
  Send,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/Shared/PageHeader";
import { StatCard } from "@/components/Shared/StatCard";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatBDT } from "@/lib/money";
import { scopeText } from "@/lib/referral";
import { daysLabel, percentLabel } from "@/lib/referral-terms";
import { expiryText, fullDate, shortDate, worksForHome, worksForSalon } from "@/lib/referral-view";
import { SITE } from "@/lib/site";
import { TONE_CLASSES, toneOf, type Tone } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import type {
  FriendStep,
  MyReferral,
  ReferralFriend,
  ReferralReward,
  ReferralTerms,
  RewardKind,
  RewardScope,
} from "@/services/referral/types";
import { CodeBox } from "./CodeBox";
import { ShareButtons, ShareLink } from "./ShareButtons";

export type ReferList<T> = {
  items: T[];
  total: number;
  /** Pages loaded so far (20 a page); "Show more" asks for one more. */
  pages: number;
  error: string | null;
};

export type ReferPageProps = {
  /** `GET /referrals/me`; null when it failed (`meError` says why). */
  me: MyReferral | null;
  meError: string | null;
  /** From `me`, else from the public settings. */
  terms: ReferralTerms;
  shareMessage: string | null;
  programOn: boolean;
  redemptionsOn: boolean;
  restoreOnCancel: boolean;
  /** Back from an invite link while signed in (`/r/<code>` → `?invite=own`). */
  inviteOwn: boolean;
  rewards: ReferList<ReferralReward>;
  friends: ReferList<ReferralFriend>;
  now: Date;
};

const PATH = "/dashboard/referrals";

/** The page with one more page of rewards or friends. */
const moreHref = (rewards: number, friends: number) => {
  const q = new URLSearchParams();
  if (rewards > 1) q.set("rewards", String(rewards));
  if (friends > 1) q.set("friends", String(friends));
  const s = q.toString();
  return s ? `${PATH}?${s}` : PATH;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * `/dashboard/referrals`: share the code, see what it has earned, what each
 * friend still has to do and when a reward runs out. Server-rendered; only
 * the code box and the share buttons are client islands. Every number comes
 * from `GET /referrals/me*` or the public settings.
 */
export function ReferPage(props: ReferPageProps) {
  const { me, meError, terms, shareMessage, programOn, redemptionsOn, inviteOwn, rewards, friends, now } = props;
  const { friend, you } = terms;
  const onVerify = you.trigger === "REFEREE_VERIFIED";
  const f = percentLabel(friend.percent);
  const y = percentLabel(you.percent);
  // Sharing needs a working, unblocked code while the program is on; rewards show regardless.
  const canShare = programOn && !!me && !me.blocked && !!shareMessage;
  // Nothing to list yet: the two empty rows sit side by side instead of stacking.
  const bothEmpty =
    !rewards.error && rewards.items.length === 0 && !friends.error && friends.items.length === 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Refer & earn"
        // The hero says the offer; without it (paused, blocked, failed) the header does.
        description={canShare ? undefined : `Give friends ${f} off. Get ${y} off when they ${onVerify ? "join" : "book"}.`}
      />

      {(meError || !programOn || me?.blocked || (inviteOwn && canShare)) && (
        <div className="space-y-3">
          {meError && (
            <Notice tone="danger" icon={CircleAlert}>
              <p className="font-semibold">We couldn&apos;t load your invite code</p>
              <p className="text-muted-foreground">{meError}</p>
              <Link
                href={PATH}
                className="mt-1 inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"
              >
                Try again
              </Link>
            </Notice>
          )}
          {!programOn && (
            <Notice tone="warning" icon={CirclePause}>
              Refer &amp; earn is paused. Your rewards still work until they expire.
            </Notice>
          )}
          {programOn && me?.blocked && (
            <Notice tone="neutral" icon={CircleAlert}>
              Your invite code has been switched off, so new friends can&apos;t join with it. Rewards you already
              have still work until they expire.{" "}
              <Link href="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">
                Contact us
              </Link>{" "}
              if you think this is a mistake.
            </Notice>
          )}
          {inviteOwn && canShare && (
            <Notice tone="info" icon={Info}>
              Invite links are for new accounts. Here&apos;s your own to share.
            </Notice>
          )}
        </div>
      )}

      {canShare && me && shareMessage && <Hero me={me} terms={terms} shareMessage={shareMessage} />}

      {me && <Stats me={me} />}

      <div className={bothEmpty ? "grid gap-6 sm:gap-8 lg:grid-cols-2" : "space-y-6 sm:space-y-8"}>
        <RewardsSection rewards={rewards} friendsPages={friends.pages} redemptionsOn={redemptionsOn} now={now} />

        <FriendsSection
          friends={friends}
          rewardsPages={rewards.pages}
          youPercent={you.percent}
          onVerify={onVerify}
          share={canShare && me && shareMessage ? { message: shareMessage, link: me.link } : null}
          now={now}
        />
      </div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-2">
          <HowItWorks terms={terms} code={me?.code ?? null} />
        </div>
        <div className="min-w-0 lg:col-span-3">
          <Faq {...props} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ notices */

const NOTICE_BORDER: Record<Tone, string> = {
  neutral: "border-border",
  primary: "border-primary/30",
  success: "border-success/30",
  warning: "border-warning/30",
  danger: "border-danger/30",
  info: "border-info/30",
};

function Notice({ tone, icon: Icon, children }: { tone: Tone; icon: LucideIcon; children: ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-sm text-foreground",
        tone === "neutral" ? "bg-surface-subtle" : TONE_CLASSES[tone].soft,
        NOTICE_BORDER[tone],
      )}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", TONE_CLASSES[tone].text)} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------ hero */

/**
 * The one dark band: the offer, and the code card beside it from `xl`; under
 * both, the share row and the message friends receive.
 */
function Hero({ me, terms, shareMessage }: { me: MyReferral; terms: ReferralTerms; shareMessage: string }) {
  const { friend, you } = terms;
  const onVerify = you.trigger === "REFEREE_VERIFIED";
  const cap = you.maxDiscountMinor > 0 ? `Up to ${formatBDT(you.maxDiscountMinor)} per booking` : "No upper limit";
  return (
    <section
      aria-labelledby="refer-hero-title"
      className="relative overflow-hidden rounded-3xl bg-charcoal bg-glow-dark p-5 text-cream shadow-card sm:p-8 lg:p-10"
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] xl:items-center xl:gap-12">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gold-light ring-1 ring-white/15">
            <Gift aria-hidden="true" className="size-3.5" />
            Invite friends, save together
          </p>
          <h2
            id="refer-hero-title"
            className="mt-4 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl"
          >
            Give <span className="text-gold-light">{percentLabel(friend.percent)}</span>, get{" "}
            <span className="text-gold-light">{percentLabel(you.percent)}</span>
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-cream/90 sm:text-lg">
            Friends get {percentLabel(friend.percent)} off their first booking. You get {percentLabel(you.percent)} off
            one of yours {onVerify ? "as soon as they verify their email" : "when they complete it"}.
          </p>
          <ul aria-label="Your reward" className="mt-4 flex flex-wrap gap-2">
            <li className="rounded-full px-3 py-1 text-xs font-medium text-cream/90 ring-1 ring-white/20">{cap}</li>
            <li className="rounded-full px-3 py-1 text-xs font-medium text-cream/90 ring-1 ring-white/20">
              {capitalize(scopeText(you.scope))}
            </li>
          </ul>
        </div>

        <CodeBox code={me.code} link={me.link} />
      </div>

      <div className="mt-8 border-t border-white/15 pt-6">
        <h3 className="text-sm font-semibold text-cream">Share in one tap</h3>
        <ShareButtons message={shareMessage} link={me.link} onDark className="mt-3" />
        <figure className="mt-4 max-w-3xl">
          <figcaption className="text-xs font-semibold tracking-wider text-cream/80 uppercase">
            Your friends get this message
          </figcaption>
          <blockquote className="mt-1.5 text-sm leading-relaxed text-cream/90 [overflow-wrap:anywhere]">
            {shareMessage}
          </blockquote>
        </figure>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ stats */

function Stats({ me }: { me: MyReferral }) {
  const { stats, terms } = me;
  return (
    <section aria-labelledby="refer-stats-title">
      <h2 id="refer-stats-title" className="sr-only">
        Your invites so far
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Friends joined" value={stats.joined.toLocaleString()} icon={UserPlus} tone="primary" />
        <StatCard
          label="First bookings completed"
          value={stats.qualified.toLocaleString()}
          icon={CalendarCheck}
          tone="info"
        />
        <StatCard label="Rewards earned" value={stats.rewardsEarned.toLocaleString()} icon={Gift} tone="success" />
        <StatCard label="Saved so far" value={formatBDT(stats.savedMinor)} icon={PiggyBank} tone="success" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {terms.maxPerMonth > 0
          ? `You can earn up to ${terms.maxPerMonth} ${terms.maxPerMonth === 1 ? "reward" : "rewards"} a month (${stats.thisMonth} so far)`
          : `There's no monthly limit on rewards (${stats.thisMonth} this month)`}
      </p>
    </section>
  );
}

/* ------------------------------------------------------------ rewards */

const KIND_LABEL: Record<RewardKind, string> = {
  REFEREE_WELCOME: "Welcome reward",
  REFERRER_BONUS: "Referral reward",
  // The source line under it already says "From the <site> team".
  MANUAL_GRANT: "Bonus reward",
};

const SCOPE_CHIP: Record<RewardScope, { label: string; icon: LucideIcon }> = {
  ALL: { label: "Salon & Home Service", icon: Sparkles },
  SALON: { label: "Salon bookings", icon: Scissors },
  HOME: { label: "Home Service", icon: House },
};

function SectionHead({ id, title, count, children }: { id: string; title: string; count?: number; children?: ReactNode }) {
  return (
    <div className="mb-4">
      <h2 id={id} className="flex items-baseline gap-2 font-display text-xl font-semibold text-foreground">
        {title}
        {count !== undefined && count > 0 && (
          <span className="text-sm font-medium text-muted-foreground tabular-nums">{count}</span>
        )}
      </h2>
      {children}
    </div>
  );
}

/** An empty list as one compact row: icon, what's missing, and an optional action. */
function EmptyRow({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-border bg-surface p-5 sm:flex-row sm:items-center sm:gap-5">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-hover">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function LoadError({ what, message }: { what: string; message: string }) {
  return (
    <Notice tone="danger" icon={CircleAlert}>
      <p className="font-semibold">We couldn&apos;t load your {what}</p>
      <p className="text-muted-foreground">{message}</p>
    </Notice>
  );
}

function ShowMore({ href, shown, total }: { href: string; shown: number; total: number }) {
  if (shown >= total) return null;
  return (
    <div className="mt-4 flex flex-col items-center gap-1">
      <Button asChild variant="outline" size="lg">
        <Link href={href} scroll={false} prefetch={false}>
          Show more
        </Link>
      </Button>
      <p className="text-xs text-muted-foreground tabular-nums">
        Showing {shown} of {total}
      </p>
    </div>
  );
}

function RewardsSection({
  rewards,
  friendsPages,
  redemptionsOn,
  now,
}: {
  rewards: ReferList<ReferralReward>;
  friendsPages: number;
  redemptionsOn: boolean;
  now: Date;
}) {
  return (
    <section aria-labelledby="refer-rewards-title">
      <SectionHead id="refer-rewards-title" title="Your rewards" count={rewards.total}>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {redemptionsOn
            ? "The best one is applied automatically at checkout. One reward per booking."
            : "Using rewards is paused right now. Bookings that already hold a reward keep their discount."}
        </p>
      </SectionHead>

      {rewards.error && rewards.items.length === 0 ? (
        <LoadError what="rewards" message={rewards.error} />
      ) : rewards.items.length === 0 ? (
        <EmptyRow icon={Gift} title="No rewards yet" description="Share your code to earn your first." />
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:gap-4 2xl:grid-cols-3">
            {rewards.items.map((r) => (
              <RewardCard key={r.id} reward={r} redemptionsOn={redemptionsOn} now={now} />
            ))}
          </ul>
          {rewards.error && <p className="mt-3 text-sm text-danger">{rewards.error}</p>}
          <ShowMore
            href={moreHref(rewards.pages + 1, friendsPages)}
            shown={rewards.items.length}
            total={rewards.total}
          />
        </>
      )}
    </section>
  );
}

/** The pill's text and tone. A reward past its expiry that the hourly job hasn't closed yet reads Expired. */
const rewardStatusOf = (r: ReferralReward, now: Date): { label: string; tone: Tone } => {
  const past = new Date(r.expiresAt).getTime() <= now.getTime();
  switch (r.status) {
    case "AVAILABLE":
      return past ? { label: "Expired", tone: "neutral" } : { label: "Available", tone: toneOf(r.status) };
    case "PENDING_REVIEW":
      return { label: "In review", tone: toneOf(r.status) };
    case "RESERVED":
      return {
        label: r.booking?.ref ? `Reserved for ${r.booking.ref}` : "Reserved for a booking",
        tone: toneOf(r.status),
      };
    case "REDEEMED":
      return { label: "Used", tone: toneOf(r.status) };
    case "EXPIRED":
      return { label: "Expired", tone: toneOf(r.status) };
    case "REVOKED":
      return { label: "Revoked", tone: toneOf(r.status) };
  }
};

/** What the clock line under a reward says. */
const rewardTimeOf = (r: ReferralReward, now: Date): string => {
  switch (r.status) {
    case "AVAILABLE":
      return expiryText(r.expiresAt, now);
    case "PENDING_REVIEW":
      return "Ready to use once our team has checked it";
    case "RESERVED":
      return r.discountMinor > 0
        ? `Takes ${formatBDT(r.discountMinor)} off that booking`
        : "Held on that booking";
    case "REDEEMED":
      return r.discountMinor > 0 ? `Saved you ${formatBDT(r.discountMinor)}` : "Used on a booking";
    case "EXPIRED":
      return `Expired ${shortDate(r.expiresAt, now)}`;
    case "REVOKED":
      return "Withdrawn";
  }
};

const bookingHref = (r: ReferralReward) =>
  !r.booking ? null : r.booking.kind === "HOME" ? `/home-service/booking/${r.booking.id}` : "/dashboard/appointments";

function RewardCard({ reward: r, redemptionsOn, now }: { reward: ReferralReward; redemptionsOn: boolean; now: Date }) {
  const status = rewardStatusOf(r, now);
  const usable = r.status === "AVAILABLE" && new Date(r.expiresAt).getTime() > now.getTime();
  const done = r.status === "EXPIRED" || r.status === "REVOKED" || (r.status === "AVAILABLE" && !usable);
  const scope = SCOPE_CHIP[r.scope];
  const showBook = usable && redemptionsOn;
  const held = bookingHref(r);

  return (
    <li
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border border-border p-4 sm:p-5",
        done ? "bg-surface-subtle" : "bg-surface",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-semibold text-muted-foreground">{KIND_LABEL[r.kind]}</p>
        <ToneBadge status={r.status} tone={status.tone} dot className="max-w-full whitespace-normal">
          {status.label}
        </ToneBadge>
      </div>

      <p
        className={cn(
          "mt-2 font-display text-2xl font-bold tracking-tight",
          done ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {percentLabel(r.percent)} off
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {r.maxDiscountMinor > 0 ? `up to ${formatBDT(r.maxDiscountMinor)}` : "no upper limit"}
        </span>
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip icon={scope.icon}>{scope.label}</Chip>
        {r.minOrderMinor > 0 && <Chip>On {formatBDT(r.minOrderMinor)} or more</Chip>}
        {r.firstBookingOnly && <Chip>First booking</Chip>}
      </div>

      <p className="mt-3 flex items-start gap-2 text-sm text-foreground">
        <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        {r.status === "AVAILABLE" ? (
          <time dateTime={r.expiresAt} title={fullDate(r.expiresAt)}>
            {rewardTimeOf(r, now)}
          </time>
        ) : (
          <span>{rewardTimeOf(r, now)}</span>
        )}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{r.source}</p>

      {(showBook || (r.status === "RESERVED" && held)) && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {showBook && worksForSalon(r.scope) && (
            <Button asChild>
              <Link href="/salons">
                <Scissors aria-hidden="true" />
                Book a salon
              </Link>
            </Button>
          )}
          {showBook && worksForHome(r.scope) && (
            <Button asChild variant={worksForSalon(r.scope) ? "secondary" : "default"}>
              <Link href="/ladies-parlour">
                <House aria-hidden="true" />
                Book Home Service
              </Link>
            </Button>
          )}
          {r.status === "RESERVED" && held && (
            <Button asChild variant="secondary">
              <Link href={held}>View booking</Link>
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

function Chip({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-foreground">
      {Icon && <Icon aria-hidden="true" className="size-3 text-muted-foreground" />}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------ friends */

/** How far along each step list a friend is (-1: none), per trigger. */
const REACHED: Record<FriendStep, number> = {
  JOINED: 0,
  BOOKED: 1,
  COMPLETED: 2,
  IN_REVIEW: 2,
  REWARDED: 3,
  NOT_ELIGIBLE: 0,
};
/** With the reward at verification there is no booking step: Joined → You earned. */
const REACHED_ON_VERIFY: Record<FriendStep, number> = {
  JOINED: 0,
  BOOKED: 0,
  COMPLETED: 0,
  IN_REVIEW: 0,
  REWARDED: 1,
  NOT_ELIGIBLE: 0,
};

const FRIEND_HINT: Partial<Record<FriendStep, { label: string; tone: Tone; hint: string }>> = {
  IN_REVIEW: {
    label: "In review",
    tone: "warning",
    hint: "Your reward for this friend is being checked. We'll let you know when it's ready to use.",
  },
  NOT_ELIGIBLE: {
    label: "Not eligible",
    tone: "neutral",
    hint: "This invite didn't meet the program's rules, so it can't earn a reward.",
  },
};

function FriendsSection({
  friends,
  rewardsPages,
  youPercent,
  onVerify,
  share,
  now,
}: {
  friends: ReferList<ReferralFriend>;
  rewardsPages: number;
  youPercent: number;
  onVerify: boolean;
  share: { message: string; link: string } | null;
  now: Date;
}) {
  const steps = onVerify
    ? ["Joined", `You earned ${percentLabel(youPercent)}`]
    : ["Joined", "Booked", "Completed", `You earned ${percentLabel(youPercent)}`];

  return (
    <section aria-labelledby="refer-friends-title">
      <SectionHead id="refer-friends-title" title="Your friends" count={friends.total}>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Everyone who joined with your code, and how far they&apos;ve got.
        </p>
      </SectionHead>

      {friends.error && friends.items.length === 0 ? (
        <LoadError what="friends" message={friends.error} />
      ) : friends.items.length === 0 ? (
        <EmptyRow
          icon={Users}
          title="No friends yet"
          description="When a friend signs up with your code, you'll see them here."
          action={share ? <ShareLink channel="whatsapp" message={share.message} link={share.link} /> : undefined}
        />
      ) : (
        <>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {friends.items.map((fr) => {
              const hint = FRIEND_HINT[fr.step];
              const reached = (onVerify ? REACHED_ON_VERIFY : REACHED)[fr.step];
              return (
                <li
                  key={fr.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:gap-6"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{fr.name}</span>
                      <span className="text-muted-foreground"> · joined {shortDate(fr.joinedAt, now)}</span>
                    </p>
                    {(hint || fr.status === "PENDING_VERIFICATION") && (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {hint && <HintChip {...hint} />}
                        {!hint && fr.status === "PENDING_VERIFICATION" && (
                          <HintChip
                            label="Email not verified"
                            tone="neutral"
                            hint="Their invite counts once they verify their email address."
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <FriendProgress
                    steps={steps}
                    reached={reached}
                    tone={fr.step === "NOT_ELIGIBLE" ? "neutral" : "success"}
                    pending={fr.step === "IN_REVIEW" ? steps.length - 1 : null}
                  />
                </li>
              );
            })}
          </ul>
          {friends.error && <p className="mt-3 text-sm text-danger">{friends.error}</p>}
          <ShowMore
            href={moreHref(rewardsPages, friends.pages + 1)}
            shown={friends.items.length}
            total={friends.total}
          />
        </>
      )}
    </section>
  );
}

/** The step bar: one segment and label per step; `pending` is the step waiting on review. */
function FriendProgress({
  steps,
  reached,
  tone,
  pending,
}: {
  steps: string[];
  reached: number;
  tone: Tone;
  pending: number | null;
}) {
  return (
    <ol
      aria-label="Progress"
      className={cn("grid w-full gap-1.5 md:w-[26rem] md:shrink-0", steps.length === 4 ? "grid-cols-4" : "grid-cols-2")}
    >
      {steps.map((label, i) => {
        const done = i <= reached;
        const waiting = i === pending;
        return (
          <li key={label} className="min-w-0">
            <span
              aria-hidden="true"
              className={cn(
                "block h-1.5 rounded-full",
                done ? TONE_CLASSES[tone].dot : waiting ? "bg-warning/50" : "bg-muted",
              )}
            />
            <span
              className={cn(
                "mt-1.5 block text-[0.6875rem] leading-tight sm:text-xs",
                done ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
              <span className="sr-only">{done ? ": done" : waiting ? ": in review" : ": not yet"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** A status chip that explains itself in one line: on hover-less phones too, so it opens on tap. */
function HintChip({ label, tone, hint }: { label: string; tone: Tone; hint: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group -my-2 inline-flex min-h-11 items-center rounded-full outline-none"
          aria-label={`${label}: what this means`}
        >
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold group-focus-visible:ring-[3px] group-focus-visible:ring-ring",
              TONE_CLASSES[tone].soft,
              TONE_CLASSES[tone].text,
            )}
          >
            {label}
            <Info aria-hidden="true" className="size-3" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 rounded-xl p-3 text-sm">
        {hint}
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------ how it works + FAQ */

function HowItWorks({ terms, code }: { terms: ReferralTerms; code: string | null }) {
  const { friend, you } = terms;
  const onVerify = you.trigger === "REFEREE_VERIFIED";
  const steps: { icon: LucideIcon; title: string; body: string }[] = [
    {
      icon: Send,
      title: "Share your code",
      body: `Send your link on WhatsApp, Messenger or SMS, or tell friends your code${code ? ` ${code}` : ""}.`,
    },
    {
      icon: UserPlus,
      title: onVerify ? "Your friend signs up" : "Your friend books",
      body: `They get ${percentLabel(friend.percent)} off their first booking${
        friend.maxDiscountMinor > 0 ? `, up to ${formatBDT(friend.maxDiscountMinor)}` : ""
      }, when they sign up with your code.`,
    },
    {
      icon: Gift,
      title: `You get ${percentLabel(you.percent)} off`,
      body: `${
        onVerify ? "As soon as they verify their email" : "When they complete their first booking"
      }, your reward lands here. It's applied automatically at checkout.`,
    },
  ];
  return (
    <section aria-labelledby="refer-how-title">
      <SectionHead id="refer-how-title" title="How it works" />
      <ol className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              // The line joining this step to the next.
              <span aria-hidden="true" className="absolute top-12 bottom-1 left-5 w-px -translate-x-1/2 bg-border" />
            )}
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-hover">
              <s.icon aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-xs font-semibold tracking-wider text-primary-hover uppercase tabular-nums">
                Step {i + 1}
              </p>
              <h3 className="mt-0.5 font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Faq({ terms, restoreOnCancel }: ReferPageProps) {
  const { you, maxPerMonth } = terms;
  const onVerify = you.trigger === "REFEREE_VERIFIED";
  const lasts = `It shows up under Your rewards and lasts ${daysLabel(you.validDays)}.`;
  const items: { q: string; a: string }[] = [
    {
      q: "When do I get my reward?",
      a: onVerify
        ? `As soon as your friend verifies their email address. ${lasts}`
        : `When your friend completes their first booking made on ${SITE.name}, within a set time of joining${
            you.minOrderMinor > 0 ? ` and on a booking of ${formatBDT(you.minOrderMinor)} or more` : ""
          }. A walk-in booked at the salon doesn't count. ${lasts}${
            maxPerMonth > 0 ? ` You can earn up to ${maxPerMonth} ${maxPerMonth === 1 ? "reward" : "rewards"} a month.` : ""
          }`,
    },
    {
      q: "Can I use two rewards on one booking?",
      a: "No. One reward per booking, and rewards can't be combined. When you have more than one, the one that saves you the most is picked for you at checkout, and you can switch it off or pick another. A reward can be used together with a salon's own discount.",
    },
    {
      q: "What if a booking is cancelled?",
      a: `${
        restoreOnCancel
          ? "The reward comes back to you, as long as it hasn't expired."
          : "The reward ends with the booking."
      } Moving a booking to another time keeps its reward. If you don't turn up for a booking, the reward on it may be used up.`,
    },
    {
      q: "Why is my reward in review?",
      a: "We check every invite for signs that it isn't genuine, such as several accounts on one device or network, or many sign-ups on one code at once. A reward from an invite like that may be held until our team has checked it. We'll let you know when it's released or refused.",
    },
    {
      q: "Do salons pay for this?",
      a: `No. ${SITE.name} pays for every referral discount. Salons and Home Service experts are paid in full, as if no reward was used.`,
    },
  ];
  return (
    <section aria-labelledby="refer-faq-title">
      <SectionHead id="refer-faq-title" title="Questions" />
      <div className="rounded-2xl border border-border bg-surface px-4 sm:px-6">
        <Accordion type="single" collapsible>
          {items.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="min-h-11 text-base font-semibold text-foreground">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <p className="mt-3 text-sm">
        <Link
          href="/referral-terms"
          className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline"
        >
          Read the full referral terms
        </Link>
      </p>
    </section>
  );
}
