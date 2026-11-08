import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CalendarX2,
  Check,
  Clock,
  House,
  KeyRound,
  LifeBuoy,
  ListChecks,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Store,
  UserX,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Section, SectionHeader } from "@/components/Shared/Section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { advanceOf } from "@/lib/home-policy";
import { formatBDT } from "@/lib/money";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  getPublicSettings,
  homeSettingsOf,
  type HomeServiceSettings,
} from "@/services/settings/getPublicSettings";
import { FAQS, SAFETY, policyLineOf, sideEnabled } from "./content";
import { HomeTrack, SideLink } from "./HomeTrack";

/** Home visits are booked only from a parlour's page ("Book now" → "At home"). */
const FIND_PARLOUR = "/ladies-parlour";

type Item = { icon: LucideIcon; title: string; text: string };

/**
 * /home-service: how Home Service works and its policies. There is no expert
 * list here: a home visit is booked from a salon's own page, so every call to
 * action leads to the parlour list. Ladies-led; Gents follows
 * `homeService.gentsEnabled` (on since 2026-11-05; the men's FAQ answer). Reads only the public settings
 * (60 s cache), so the page stays static and every number is the live one.
 */
export default async function HomeLanding() {
  const res = await getPublicSettings();
  const s = homeSettingsOf(res.success ? res.data : null);
  const open = sideEnabled(s, "LADIES");

  return (
    <>
      <HomeTrack event="home_view" dim="audience:all" />
      <Hero s={s} open={open} />

      {open ? (
        <>
          <KeyFacts s={s} />
          <HowItWorks s={s} />
          <Safety />
          <Policies s={s} />
        </>
      ) : (
        <ComingSoon />
      )}

      <Faq gents={sideEnabled(s, "GENTS")} />
      {open && <FinalCta />}
    </>
  );
}

// ------------------------------------------------------------------ hero

function Hero({ s, open }: { s: HomeServiceSettings; open: boolean }) {
  const advance = s["homeService.advancePercent"];
  return (
    <section
      aria-labelledby="home-hero-title"
      className="overflow-hidden border-b border-border/60 bg-background bg-glow-hero"
    >
      <div className="container mx-auto grid items-center gap-12 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:px-8 lg:py-20">
        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-primary">
            <House className="size-3.5" aria-hidden />
            Home Service · Ladies
          </p>
          <h1
            id="home-hero-title"
            className="mt-5 font-display text-display-hero font-bold tracking-tight text-balance text-foreground lg:text-display-hero-lg"
          >
            Parlour-quality beauty, <span className="text-primary">at your home</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
            Facial, threading, waxing, mehedi and makeup by ID-verified female experts from parlours near you. Book
            from the parlour&apos;s page and choose <span className="font-semibold text-foreground">At home</span>.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
            {open ? (
              <FindParlourButton />
            ) : (
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href={FIND_PARLOUR}>Find a parlour</Link>
              </Button>
            )}
            {open && (
              <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            )}
          </div>

          {open && (
            <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
              {["Female experts only", "ID-verified", `Pay ${advance}% now, the rest at home`].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-success" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>

        {open && <BookingPreview advance={advance} />}
      </div>
    </section>
  );
}

/** Example prices, labelled as such: the real menu comes from each parlour. */
const PREVIEW_ITEMS = [
  { name: "Gold facial", min: 60, minor: 150_000, picked: true },
  { name: "Eyebrow threading", min: 15, minor: 15_000, picked: true },
  { name: "Bridal mehedi", min: 90, minor: 250_000, picked: false },
];

/**
 * What the parlour's booking flow looks like on "At home": an illustration
 * built from the page's own tokens, so it stays sharp and needs no image.
 */
function BookingPreview({ advance }: { advance: number }) {
  const total = PREVIEW_ITEMS.filter((i) => i.picked).reduce((sum, i) => sum + i.minor, 0);
  const now = advanceOf(total, advance);

  return (
    <figure className="mx-auto w-full max-w-md">
      <div className="relative">
        <div
          aria-hidden
          className="rounded-[2rem] border border-border bg-surface p-5 shadow-elevated sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary-hover">
                <Store className="size-5" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-foreground">Book an appointment</p>
                <p className="text-xs text-muted-foreground">A parlour near you</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-success">
              Home visits
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-sm font-semibold">
            <span className="rounded-full py-2 text-center text-muted-foreground">At the salon</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-surface py-2 text-foreground shadow-xs">
              <House className="size-4 text-primary" />
              At home
            </span>
          </div>

          <ul className="mt-4 space-y-2">
            {PREVIEW_ITEMS.map((item) => (
              <li
                key={item.name}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3",
                  item.picked ? "border-primary/40 bg-primary-soft/60" : "border-border",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-md border",
                    item.picked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface",
                  )}
                >
                  {item.picked && <Check className="size-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.min} min</span>
                </span>
                <span className="text-sm font-semibold text-foreground">{formatBDT(item.minor)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-dashed border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>Total</dt>
              <dd className="font-semibold text-foreground">{formatBDT(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Advance now ({advance}%)</dt>
              <dd className="font-semibold text-primary-hover">{formatBDT(now)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>At home, after the service</dt>
              <dd className="font-semibold text-foreground">{formatBDT(total - now)}</dd>
            </div>
          </dl>

          <span className="mt-4 flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            Choose date &amp; time
            <ArrowRight className="size-4" />
          </span>
        </div>

        <span
          aria-hidden
          className="absolute -top-4 -left-3 hidden items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground shadow-card sm:inline-flex"
        >
          <BadgeCheck className="size-4 text-primary" />
          Female, ID-verified expert
        </span>
        <span
          aria-hidden
          className="absolute -right-3 -bottom-4 hidden items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground shadow-card sm:inline-flex"
        >
          <KeyRound className="size-4 text-primary" />
          Starts with your code
        </span>
      </div>

      <figcaption className="mt-10 text-center text-xs text-muted-foreground">
        Example of a parlour&apos;s booking with At home chosen. Prices are set by each parlour.
      </figcaption>
    </figure>
  );
}

// ------------------------------------------------------------------ key facts

function KeyFacts({ s }: { s: HomeServiceSettings }) {
  const facts = [
    { icon: Wallet, value: `${s["homeService.advancePercent"]}% advance`, label: "The rest after the service" },
    { icon: CalendarX2, value: policyLineOf(s), label: "Full terms before you pay" },
    {
      icon: CalendarClock,
      value: `Up to ${plural(s["homeService.bookingWindowDays"], "day")} ahead`,
      label: `At least ${minutesText(s["homeService.minLeadMinutes"])} notice`,
    },
    {
      icon: Clock,
      value: `Until ${clockText(s["homeService.ladiesLastStart"])}`,
      label: "Latest visit start",
    },
  ];

  return (
    <section aria-label="Home Service at a glance" className="border-b border-border/60 bg-surface">
      <ul className="container mx-auto grid grid-cols-2 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {facts.map(({ icon: Icon, value, label }, i) => (
          <li
            key={label}
            className={cn(
              "flex min-w-0 flex-col gap-2 border-border/70 py-5 sm:flex-row sm:items-start sm:gap-3 sm:py-6",
              // Two by two below lg (rules between the columns and the rows), one row of four from lg.
              i % 2 === 1 && "border-l pl-4 sm:pl-6",
              i >= 2 && "border-t lg:border-t-0",
              i === 2 && "lg:border-l lg:pl-6",
              i < 3 && "pr-4 sm:pr-6",
            )}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-hover">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-base font-semibold leading-snug text-foreground">{value}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{label}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------------ how it works

function HowItWorks({ s }: { s: HomeServiceSettings }) {
  const steps = stepsOf(s);
  return (
    <Section id="how-it-works" labelledBy="home-how">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-overline font-semibold uppercase tracking-[0.06em] text-primary">How it works</p>
          <h2
            id="home-how"
            className="mt-2 font-display text-2xl font-bold tracking-tight text-balance text-foreground sm:text-3xl lg:text-4xl"
          >
            Booked on the parlour&apos;s page, done in your home
          </h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
            There is no separate app or form. Any parlour that comes to your home has an At home option right in its
            booking.
          </p>
          <div className="mt-6 hidden lg:block">
            <FindParlourButton />
          </div>
        </div>

        <ol className="relative">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative flex gap-5 pb-8 last:pb-0">
              {i < steps.length - 1 && (
                <span aria-hidden className="absolute top-12 bottom-0 left-6 w-px -translate-x-1/2 bg-border" />
              )}
              <span className="relative grid size-12 shrink-0 place-items-center rounded-full border border-gold/30 bg-primary-soft text-primary-hover">
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 rounded-3xl border border-border bg-surface p-5 shadow-soft">
                <p className="text-xs font-semibold text-primary">Step {i + 1}</p>
                <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

// ------------------------------------------------------------------ safety

function Safety() {
  return (
    // The glow is its own layer: tailwind-merge treats `bg-glow-*` as a
    // background colour and would drop the band's `bg-charcoal`.
    <Section tone="dark" labelledBy="home-safety" className="relative isolate overflow-hidden">
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-glow-dark" />
      <SectionHeader
        overline="Your safety"
        title="Safe at your door, every visit"
        titleId="home-safety"
        tone="dark"
        description="Four promises that come with every home booking."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {SAFETY.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <span className="grid size-11 place-items-center rounded-full border border-gold-light/30 bg-gold-light/10 text-gold-light">
              <Icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/75">{text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ------------------------------------------------------------------ policies

function Policies({ s }: { s: HomeServiceSettings }) {
  const advance = s["homeService.advancePercent"];
  const exampleTotal = 200_000;
  const exampleNow = advanceOf(exampleTotal, advance);

  return (
    <Section tone="subtle" labelledBy="home-policies">
      <SectionHeader
        overline="Policies"
        title="Clear terms, before you pay"
        titleId="home-policies"
        description="The terms for your booking are shown again on the review step, and you agree to them there."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <div className="rounded-[2rem] border border-gold/25 bg-surface p-6 shadow-soft sm:p-8 lg:sticky lg:top-28">
          <h3 className="font-display text-xl font-semibold text-foreground">How you pay</h3>
          <div
            className="mt-5 flex h-3 overflow-hidden rounded-full bg-primary-soft"
            role="img"
            aria-label={`${advance}% now, ${100 - advance}% at home`}
          >
            <span className="h-full rounded-full bg-primary" style={{ width: `${advance}%` }} />
          </div>
          <dl className="mt-5 space-y-4">
            <div className="flex gap-3">
              <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <div>
                <dt className="font-semibold text-foreground">{advance}% when you book</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">
                  Online with bKash, card or mobile banking. {SITE.name} holds it; the parlour gets it only after the
                  visit.
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-1.5 size-2.5 shrink-0 rounded-full border-2 border-primary bg-primary-soft" aria-hidden />
              <div>
                <dt className="font-semibold text-foreground">{100 - advance}% after the service</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">Paid at home, to the expert.</dd>
              </div>
            </div>
          </dl>
          <p className="mt-6 rounded-2xl bg-surface-subtle p-4 text-sm text-muted-foreground">
            For example, on a {formatBDT(exampleTotal)} booking you pay{" "}
            <span className="font-semibold text-foreground">{formatBDT(exampleNow)}</span> now and{" "}
            <span className="font-semibold text-foreground">{formatBDT(exampleTotal - exampleNow)}</span> at home.
          </p>
        </div>

        <ul className="divide-y divide-border/70 rounded-[2rem] border border-border bg-surface px-6 shadow-soft sm:px-8">
          {policiesOf(s).map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4 py-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-hover">
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

// ------------------------------------------------------------------ faq and cta

/** The men's answer follows `homeService.gentsEnabled`. */
const pageFaqs = (gents: boolean): { q: string; a: string }[] => [
  {
    q: "How do I book a home visit?",
    a: "Open a parlour near you that comes to your home, tap Book now and choose At home. Pick your services, then a date and time, add your address and pay the advance.",
  },
  {
    q: "Is Home Service available for men?",
    a: gents
      ? "Yes. Open a salon from the Gents page, tap Book now and choose At home. Gents visits are done by male experts only."
      : "Not yet. Home Service is open for ladies for now, with female experts only. For men, book a visit at a salon from the Gents page.",
  },
  ...FAQS,
];

function Faq({ gents }: { gents: boolean }) {
  return (
    <Section labelledBy="home-faq">
      {/* The heading sits level with the middle of the questions; the wrapper drops its bottom margin so the grid gap spaces it on phones. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-20">
        <div className="[&>div]:mb-0">
          <SectionHeader
            overline="Questions"
            title="Good to know"
            titleId="home-faq"
            description={
              <>
                Still unsure?{" "}
                <Link href="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Contact our support team
                </Link>
                .
              </>
            }
          />
        </div>
        <Accordion
          type="single"
          collapsible
          className="rounded-3xl border border-border bg-surface px-5 shadow-soft sm:px-8"
        >
          {pageFaqs(gents).map((faq) => (
            <AccordionItem key={faq.q} value={faq.q} className="border-border/70">
              <AccordionTrigger className="min-h-16 items-center font-display text-base font-semibold hover:text-primary-hover hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

function FinalCta() {
  return (
    <Section size="compact" labelledBy="home-start" className="pt-0 md:pt-0">
      <div className="flex flex-col items-center gap-6 rounded-[2rem] border border-gold/25 bg-primary-soft bg-glow-gold px-6 py-10 text-center sm:px-10 md:flex-row md:justify-between md:text-left">
        <div className="max-w-xl">
          <h2 id="home-start" className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ready for your home visit?
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Find a parlour near you, tap Book now and choose At home.
          </p>
        </div>
        <FindParlourButton />
      </div>
    </Section>
  );
}

function FindParlourButton() {
  return (
    <Button size="lg" asChild className="w-full shrink-0 shadow-gold sm:w-auto">
      <SideLink audience="LADIES" href={FIND_PARLOUR}>
        Find a parlour
        <ArrowRight aria-hidden />
      </SideLink>
    </Button>
  );
}

function ComingSoon() {
  return (
    <Section size="compact" labelledBy="home-soon">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-gold/25 bg-primary-soft px-6 py-10 text-center sm:px-10">
        <p className="text-overline font-semibold uppercase tracking-[0.06em] text-primary">Coming soon</p>
        <h2 id="home-soon" className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
          Home Service is on its way
        </h2>
        <p className="mt-2 text-muted-foreground">
          We are getting our experts ready. Until then, book a visit at a parlour near you.
        </p>
      </div>
    </Section>
  );
}

// ------------------------------------------------------------------ copy

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** 120 → "2 hours", 90 → "90 minutes". */
const minutesText = (m: number) => (m >= 60 && m % 60 === 0 ? plural(m / 60, "hour") : plural(m, "minute"));

/** "19:30" → "7:30 pm"; anything unexpected is shown as stored. */
const clockText = (hhmm: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return hhmm;
  const h = Number(m[1]);
  return `${h % 12 || 12}${m[2] === "00" ? "" : `:${m[2]}`} ${h < 12 ? "am" : "pm"}`;
};

const stepsOf = (s: HomeServiceSettings): Item[] => {
  const advance = s["homeService.advancePercent"];
  return [
    {
      icon: Store,
      title: "Open a parlour near you",
      text: "Parlours that come to your home say so on their page, along with the area they cover.",
    },
    {
      icon: House,
      title: "Tap Book now, choose At home",
      text: "You see that parlour's home menu: each service, its price and how long it takes.",
    },
    {
      icon: ListChecks,
      title: "Pick your services",
      text: `The total and your ${advance}% advance are shown before you go on.`,
    },
    {
      icon: CalendarClock,
      title: "Choose a date and time",
      text: `Any open time in the next ${plural(s["homeService.bookingWindowDays"], "day")}, at least ${minutesText(
        s["homeService.minLeadMinutes"],
      )} from now.`,
    },
    {
      icon: Wallet,
      title: "Add your address, pay the advance",
      text: "Pay with bKash, card or mobile banking. Your time is held while you pay.",
    },
    {
      icon: KeyRound,
      title: "Your expert arrives",
      text: `Give her your 4-digit start code to begin. Pay the other ${100 - advance}% after the service.`,
    },
  ];
};

/** The cancellation terms in words, with no amounts (there is no cart here). */
const cancelText = (s: HomeServiceSettings): string => {
  const policy = s["homeService.customerCancelPolicy"];
  // The admin's own wording for the active policy wins, as on the booking page.
  const override =
    policy === "FREE"
      ? s["homeService.disclaimer.free"]
      : policy === "WINDOW"
        ? s["homeService.disclaimer.window"]
        : s["homeService.disclaimer.nonRefundable"];
  if (override.trim()) return override;

  if (policy === "FREE") return "Cancel any time before the visit and the whole advance is refunded to the bKash account or card you paid with.";
  if (policy === "WINDOW") {
    return `Cancel free until ${plural(s["homeService.freeCancelHours"], "hour")} before the visit. After that, ${
      s["homeService.lateCancelPercent"]
    }% of the advance is kept.`;
  }
  const g = s["homeService.nonRefundableGraceMinutes"];
  return (
    "The advance is not refunded if you cancel." +
    (g > 0
      ? ` Changed your mind within ${plural(g, "minute")} of paying, with the visit at least ${plural(
          s["homeService.freeCancelHours"],
          "hour",
        )} away? You can still cancel for free.`
      : "")
  );
};

const policiesOf = (s: HomeServiceSettings): Item[] => {
  const policy = s["homeService.customerCancelPolicy"];
  const reschedules = s["homeService.maxRescheduleCount"];
  const noShow = s["homeService.noShowPercent"];
  const credit = s["homeService.salonCancelCreditMinor"];

  return [
    { icon: CalendarX2, title: "If you cancel", text: cancelText(s) },
    {
      icon: RefreshCw,
      title: "Rescheduling",
      text:
        reschedules > 0
          ? `You can move a visit ${reschedules === 1 ? "once" : `up to ${reschedules} times`}, until ${plural(
              s["homeService.rescheduleCutoffHours"],
              "hour",
            )} before it starts.`
          : "A booked visit can't be moved; cancel it and book a new time instead.",
    },
    {
      icon: UserX,
      title: "If you're not home",
      text:
        policy === "NON_REFUNDABLE"
          ? "If the expert arrives and you're not there, the advance is not refunded."
          : noShow > 0
            ? `If the expert arrives and you're not there, ${noShow}% of the advance is kept.`
            : "If the expert arrives and you're not there, the advance is still refunded to you.",
    },
    {
      icon: ShieldCheck,
      title: "If the parlour cancels",
      text: `You get the whole advance back${
        credit > 0 ? `, plus ${formatBDT(credit)} credit from the parlour` : ""
      }. The same applies if the expert doesn't come.`,
    },
    {
      icon: MapPin,
      ...(s["homeService.minOrderEnabled"]
        ? {
            title: "Area, travel fee and minimum order",
            text: "Each parlour sets how far it travels, its travel fee and a minimum order. You see all three before you pay.",
          }
        : {
            title: "Area and travel fee",
            text: "Each parlour sets how far it travels and its travel fee, shown before you pay. There is no minimum order: book even a single service.",
          }),
    },
    {
      icon: LifeBuoy,
      title: "Disagree with a fee?",
      text: `Appeal from your booking within ${plural(
        s["homeService.appealWindowHours"],
        "hour",
      )} of a cancel or no-show fee. Our team reviews every appeal.`,
    },
  ];
};
