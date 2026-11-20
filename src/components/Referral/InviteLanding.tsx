import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgePercent,
  CalendarCheck,
  CirclePause,
  Gift,
  Link2Off,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import GoogleButton from "@/components/Auth/GoogleButton";
import { FeatureCard, IconTile } from "@/components/Shared/FeatureCard";
import { Section, SectionHeader } from "@/components/Shared/Section";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/money";
import { daysLabel, percentLabel, rewardFinePrint } from "@/lib/referral-terms";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { RewardScope, ReferralSideTerms } from "@/services/referral/types";
import { InviteTrack } from "./InviteTrack";

/**
 * What `/join/[code]` shows. `valid` carries the friend's terms from the
 * lookup; the others come from the lookup's flags, the session and the public
 * settings. `invalid` with `retryCode` means the lookup itself failed, so the
 * register link keeps the code for the API to check there.
 */
export type InviteView =
  | { state: "valid"; code: string; firstName: string | null; terms: ReferralSideTerms }
  | { state: "signed_in"; customer: boolean; programOn: boolean; earnPercent: number }
  | { state: "invalid"; retryCode?: string }
  | { state: "paused" };

const BOOK_STEP: Record<RewardScope, { title: string; description: string }> = {
  ALL: {
    title: "Book any salon or Home Service",
    description: "Pick a salon near you or a beauty expert who comes to your door, and choose a time that suits you.",
  },
  SALON: {
    title: "Book any salon",
    description: "Pick a salon near you, compare prices and open slots, and choose a time that suits you.",
  },
  HOME: {
    title: "Book Home Service",
    description: "Pick a beauty expert who comes to your door and choose a time that suits you.",
  },
};

export function InviteLanding({ view, googleEnabled }: { view: InviteView; googleEnabled: boolean }) {
  return (
    <>
      <InviteTrack dim={`state:${view.state}`} />
      {view.state === "valid" ? (
        <ValidInvite {...view} googleEnabled={googleEnabled} />
      ) : view.state === "signed_in" ? (
        view.customer && view.programOn ? (
          <InviteNotice
            icon={UserCheck}
            title="Invite links are for new accounts"
            action={{ href: "/dashboard/referrals", label: "Get my invite link" }}
          >
            You&apos;re already a member: share your own link and earn {percentLabel(view.earnPercent)} off.
          </InviteNotice>
        ) : (
          <InviteNotice
            icon={UserCheck}
            title="Invite links are for new accounts"
            action={{ href: "/dashboard", label: "Go to my dashboard" }}
          >
            You&apos;re already signed in to {SITE.name}.
          </InviteNotice>
        )
      ) : view.state === "paused" ? (
        <InviteNotice
          icon={CirclePause}
          title="Referral rewards are paused right now"
          action={{ href: "/register", label: "Create an account" }}
        >
          You can still create an account and book trusted salons in minutes.
        </InviteNotice>
      ) : view.retryCode ? (
        <InviteNotice
          icon={Link2Off}
          title="We couldn't check this invite"
          action={{ href: `/register?ref=${encodeURIComponent(view.retryCode)}`, label: "Create an account" }}
        >
          Try the link again in a moment, or create your account now: the code is checked when you sign up.
        </InviteNotice>
      ) : (
        <InviteNotice
          icon={Link2Off}
          title="This invite link isn't active anymore"
          action={{ href: "/register", label: "Create an account" }}
        >
          You can still join {SITE.name} and book in minutes.
        </InviteNotice>
      )}
    </>
  );
}

function ValidInvite({
  code,
  firstName,
  terms,
  googleEnabled,
}: Extract<InviteView, { state: "valid" }> & { googleEnabled: boolean }) {
  const percent = percentLabel(terms.percent);
  const inviter = firstName || "A friend";
  const book = BOOK_STEP[terms.scope] ?? BOOK_STEP.ALL;

  return (
    <>
      <section aria-labelledby="invite-title" className="border-b border-border/60 bg-cream">
        <div className="container mx-auto px-4 py-10 sm:px-6 md:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:gap-x-14 lg:gap-y-8">
            <div className="text-center lg:col-start-1 lg:row-start-1 lg:self-end lg:text-left">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-primary">
                <Gift aria-hidden="true" className="size-3.5" />
                You&apos;re invited
              </p>
              <h1
                id="invite-title"
                className="mt-4 font-display text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl"
              >
                <span className="text-primary">{inviter}</span> invited you to {SITE.name}
              </h1>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Book trusted salons and beauty at home. Your first booking is {percent} off.
              </p>
            </div>

            <RewardCard terms={terms} className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center" />

            <div className="mx-auto flex w-full max-w-sm flex-col gap-3 lg:col-start-1 lg:row-start-2 lg:mx-0 lg:self-start">
              <Button asChild size="lg" className="w-full">
                <Link href={`/register?ref=${encodeURIComponent(code)}`}>Create my free account</Link>
              </Button>
              {googleEnabled && <GoogleButton referralCode={code} referralFromLink signup />}
              <p className="text-center text-sm text-muted-foreground lg:text-left">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Section size="compact" labelledBy="invite-steps">
        <SectionHeader overline="How it works" title="Three steps to your discount" titleId="invite-steps" align="center" />
        <ol className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3 md:gap-6">
          <li>
            <FeatureCard
              icon={UserPlus}
              title="Sign up with this invite"
              description={`Create your free account here, with email or Google. ${firstName ? `${firstName}'s` : "The"} code is added for you.`}
            />
          </li>
          <li>
            <FeatureCard icon={CalendarCheck} title={book.title} description={book.description} />
          </li>
          <li>
            <FeatureCard
              icon={BadgePercent}
              title="Your discount is applied at checkout"
              description={`${percent} off is picked for you on your first booking${
                terms.maxDiscountMinor > 0 ? `, up to ${formatBDT(terms.maxDiscountMinor)}` : ""
              }. Use it within ${daysLabel(terms.validDays)} of joining.`}
            />
          </li>
        </ol>
        <p className="mt-6 text-center text-sm">
          <Link
            href="/referral-terms"
            className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 transition-colors hover:text-primary-hover hover:underline"
          >
            Referral terms
          </Link>
        </p>
      </Section>
    </>
  );
}

/** The welcome reward: charcoal with a gold edge, every number from `terms`. */
function RewardCard({ terms, className }: { terms: ReferralSideTerms; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl bg-charcoal p-6 text-white shadow-card sm:p-8", className)}>
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gold" />
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold-light ring-1 ring-gold/30">
          <Gift aria-hidden="true" className="size-6" />
        </span>
        <p className="text-sm font-semibold text-gold-light">Your welcome reward</p>
      </div>
      <p className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
        <span className="text-gold-light">{percentLabel(terms.percent)}</span> off
        <span className="mt-1 block text-2xl font-semibold sm:text-3xl">your first booking</span>
      </p>
      <p className="mt-6 border-t border-white/15 pt-4 text-sm leading-relaxed text-white/80">
        {rewardFinePrint(terms, "joining").join(" · ")}
      </p>
    </div>
  );
}

/** The signed-in, paused and invalid states: one card, one way forward. */
function InviteNotice({
  icon,
  title,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  action: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section aria-labelledby="invite-title" className="border-b border-border/60 bg-cream">
      <div className="container mx-auto px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-lg rounded-3xl border border-border bg-surface p-6 text-center shadow-card sm:p-8">
          <IconTile icon={icon} className="mx-auto" />
          <h1
            id="invite-title"
            className="mt-4 font-display text-2xl font-bold tracking-tight text-balance text-foreground sm:text-3xl"
          >
            {title}
          </h1>
          <p className="mt-3 text-muted-foreground">{children}</p>
          <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
