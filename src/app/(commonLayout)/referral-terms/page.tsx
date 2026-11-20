import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CirclePause, Gift, Sparkles, type LucideIcon } from "lucide-react";

import { IconTile } from "@/components/Shared/FeatureCard";
import { PublicPageHero } from "@/components/Shared/PublicPageHero";
import { Section } from "@/components/Shared/Section";
import { formatBDT } from "@/lib/money";
import { scopeText } from "@/lib/referral";
import { daysLabel, percentLabel, referralTermsOf, rewardFinePrint } from "@/lib/referral-terms";
import { SITE } from "@/lib/site";
import type { ReferralSideTerms } from "@/services/referral/types";
import { getPublicSettings, referralSettingsOf } from "@/services/settings/getPublicSettings";

/**
 * The referral program's terms. Statically rendered and refreshed every 60 s,
 * like the public settings it is built from: every number here is a setting
 * (contract 9). `referral.restoreOnNoShow`, `qualifyWindowDays`,
 * `maxRewardsLifetime` and `holdFlagged` are not public, so the page words
 * those rules without a value.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Referral terms",
  description: `How inviting friends to ${SITE.name} works: what your friend gets, what you get, and the rules.`,
};

const capText = (t: ReferralSideTerms) =>
  t.maxDiscountMinor > 0 ? `, up to ${formatBDT(t.maxDiscountMinor)}` : ", with no upper limit";

export default async function ReferralTermsPage() {
  const settings = await getPublicSettings();
  const s = referralSettingsOf(settings.success ? settings.data : null);
  const { friend, you, maxPerMonth, attributionDays } = referralTermsOf(s);
  const programOn = s["referral.enabled"];
  const redemptionsOn = s["referral.redemptionsEnabled"];
  const restoreOnCancel = s["referral.restoreOnCancel"];
  const onVerify = you.trigger === "REFEREE_VERIFIED";

  const sections: { id: string; title: string; items: ReactNode[] }[] = [
    {
      id: "who",
      title: "Who can take part",
      items: [
        `Anyone with an active ${SITE.name} customer account and a verified email address can invite friends with their own code or link.`,
        `Your friend must be new to ${SITE.name}. A code only counts when the account is created, with email or with Google, and each person can be invited once.`,
        "You can't invite yourself, including with another email address or your own phone number.",
        "Salon owner, staff and team accounts aren't part of the program.",
        `An invite link remembers its code on that device for ${daysLabel(attributionDays)}. The last link opened counts, and a code typed at sign-up wins over a link.`,
      ],
    },
    {
      id: "friend",
      title: "What your friend gets",
      items: [
        `${percentLabel(friend.percent)} off their first booking${capText(friend)}.`,
        `It works on ${scopeText(friend.scope)}${
          friend.minOrderMinor > 0 ? `, on bookings of ${formatBDT(friend.minOrderMinor)} or more` : ""
        }.`,
        `It's ready once their email address is verified, and lasts ${daysLabel(friend.validDays)}.`,
        "It's for the first booking only: if they complete a booking without it, it lapses.",
      ],
    },
    {
      id: "you",
      title: "What you get",
      items: [
        onVerify
          ? `As soon as your friend verifies their email address, you get ${percentLabel(you.percent)} off a booking of your own${capText(you)}.`
          : `When your friend completes their first booking made on ${SITE.name}, you get ${percentLabel(you.percent)} off a booking of your own${capText(you)}.`,
        onVerify
          ? null
          : `That booking has to be completed within a set time after your friend joins${
              you.minOrderMinor > 0 ? `, and come to ${formatBDT(you.minOrderMinor)} or more` : ""
            }. Walk-in bookings made at the salon don't count.`,
        `It works on ${scopeText(you.scope)} and lasts ${daysLabel(you.validDays)} from the day you earn it.`,
        maxPerMonth > 0
          ? `You can earn up to ${maxPerMonth} ${maxPerMonth === 1 ? "reward" : "rewards"} a month (from the 1st), and a lifetime limit may also apply.`
          : "There's no monthly limit on rewards, but a lifetime limit may apply.",
        "If you've reached a limit, your friend still gets their reward; you just don't get another one.",
      ].filter((item): item is string => !!item),
    },
    {
      id: "one-per-booking",
      title: "One reward per booking",
      items: [
        "Only one reward can be used on a booking, and rewards can't be combined with each other. A reward can be used together with a salon's own discount.",
        "When you have more than one, the one that saves you the most is picked for you (the one that expires first, if they save the same). You can switch it off or pick another before you book.",
        "The discount is taken off the price of the services. On Home Service it never applies to the travel fee.",
        "Rewards have no cash value and can't be transferred, sold or exchanged for money or wallet balance.",
      ],
    },
    {
      id: "cancellations",
      title: "Cancellations and no-shows",
      items: [
        restoreOnCancel
          ? "If a booking that holds a reward is cancelled, by you or by the salon, or a Home Service visit is never paid for, the reward comes back to you, as long as it hasn't expired."
          : "If a booking that holds a reward is cancelled, by you or by the salon, or a Home Service visit is never paid for, the reward ends with it.",
        "Moving a booking to another time keeps its reward.",
        "If you don't turn up for a booking (a no-show), the reward on it may be used up. If the no-show is reversed on appeal, the reward comes back, as long as it hasn't expired.",
      ],
    },
    {
      id: "fair-use",
      title: "Fair use and fraud",
      items: [
        "We check invites for signs that they aren't genuine, such as several accounts on one device or network, many sign-ups on one code in a short time, throwaway email addresses, or a phone number that has been used before.",
        "A reward from an invite like that may be held for review before it can be used. We'll let you know when it's released or refused.",
        `${SITE.name} may refuse, hold or cancel a reward, close a referral, or block a code when these terms are broken or the program is misused, including rewards already issued.`,
      ],
    },
    {
      id: "who-pays",
      title: `${SITE.name} pays the discount`,
      items: [
        `Every referral discount is paid by ${SITE.name}. Salons and Home Service experts are paid in full, as if no reward was used.`,
      ],
    },
    {
      id: "changes",
      title: "Changes to the program",
      items: [
        "We may change these terms, or pause or end the program, at any time. Changes apply from then on.",
        "A reward already issued keeps the terms it was issued with: its percent, cap, minimum order, where it can be used and its expiry date.",
        "While the program is paused, invite codes aren't accepted at sign-up, but rewards you already have can still be used unless using rewards is paused too.",
        <>
          Questions about a reward?{" "}
          <Link
            href="/contact"
            className="font-semibold text-primary underline-offset-4 transition-colors hover:text-primary-hover hover:underline"
          >
            Contact us
          </Link>
          .
        </>,
      ],
    },
  ];

  return (
    <>
      <PublicPageHero
        overline="Refer & earn"
        title="Refer & earn: terms"
        description={`How inviting friends to ${SITE.name} works. The numbers on this page are the ones in force today.`}
      />

      <Section size="compact">
        <div className="mx-auto max-w-3xl">
          {(!programOn || !redemptionsOn) && (
            <div
              role="status"
              className="mb-8 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4 text-sm text-foreground"
            >
              <CirclePause aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
              <p>
                {!programOn
                  ? "The program is paused right now: invite codes aren't accepted at sign-up and no new rewards are issued, except ones already earned. "
                  : ""}
                {redemptionsOn
                  ? "Rewards you already have can still be used."
                  : "Using rewards is paused right now. Bookings that already hold a reward keep their discount."}
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryCard
              icon={Gift}
              title="Your friend gets"
              headline={`${percentLabel(friend.percent)} off their first booking`}
              terms={friend}
              validFrom="joining"
            />
            <SummaryCard
              icon={Sparkles}
              title="You get"
              headline={`${percentLabel(you.percent)} off a booking, ${
                onVerify ? "once they verify their email" : "after their first booking"
              }`}
              terms={you}
              validFrom="earning"
            />
          </div>

          <ol className="mt-10 space-y-10">
            {sections.map((section, i) => (
              <li key={section.id}>
                <h2
                  id={`terms-${section.id}`}
                  className="flex items-baseline gap-3 font-display text-xl font-semibold text-foreground sm:text-2xl"
                >
                  <span aria-hidden="true" className="text-base font-semibold text-primary tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground marker:text-primary/60">
                  {section.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </Section>
    </>
  );
}

function SummaryCard({
  icon,
  title,
  headline,
  terms,
  validFrom,
}: {
  icon: LucideIcon;
  title: string;
  headline: string;
  terms: ReferralSideTerms;
  validFrom: "joining" | "earning";
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <IconTile icon={icon} />
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      </div>
      <p className="mt-4 font-display text-lg font-semibold text-foreground">{headline}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {rewardFinePrint(terms, validFrom).join(" · ")}
      </p>
    </div>
  );
}
