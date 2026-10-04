import { Clock, ImageUp, Scissors, ShieldCheck, Sparkles, Wallet } from "lucide-react";

import { Section, SectionHeader } from "../Shared/Section";
import { HairTryOnDemo } from "../HairTryOn/HairTryOnDemo";
import { TryOnLauncher } from "../HairTryOn/TryOnLauncher";
import { getHairstyles } from "@/services/hairstyle/getHairstyles";

const STEPS = [
  {
    icon: ImageUp,
    title: "Upload a selfie",
    text: "A clear, front-facing photo in good light works best.",
  },
  {
    icon: Scissors,
    title: "Pick a style and colour",
    text: "Fades, crops, bobs, curls and more, in six colours.",
  },
  {
    icon: Sparkles,
    title: "See your new look",
    text: "Slide between before and after, then show it to your stylist.",
  },
];

const PROMISES = [
  { icon: Wallet, text: "Free" },
  { icon: Clock, text: "Ready in 10–20 s" },
  { icon: ShieldCheck, text: "Photo deleted within 24 h" },
];

// The catalog is cached for an hour (revalidate 3600), so this keeps the home
// page static/ISR. The panel itself only loads when the button is clicked.
export default async function HairTryOnSection() {
  const result = await getHairstyles();
  const catalog = result.success && result.data ? result.data : null;
  const enabled = Boolean(catalog?.enabled);

  return (
    <Section id="hair-try-on" tone="subtle" labelledBy="hair-try-on-heading">
      {/* Phones read heading → demo → steps; from lg the demo sits on the right. */}
      <div className="grid gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-x-16 xl:gap-x-24">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:self-end [&>div]:mb-0">
          <SectionHeader
            overline="AI hairstyle try-on"
            title="See yourself with a new hairstyle"
            titleId="hair-try-on-heading"
            description="Not sure about the cut? Upload a selfie and preview it on you before you sit in the chair."
          />
        </div>

        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
          <HairTryOnDemo />
        </div>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2 lg:self-start">
          <ol className="space-y-1">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative flex gap-4 pb-5 last:pb-0">
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute top-12 bottom-0 left-[1.375rem] w-px bg-border"
                  />
                )}
                <span className="relative grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface text-primary-hover shadow-xs">
                  <step.icon className="size-5" aria-hidden />
                  <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground tabular-nums">
                    {i + 1}
                  </span>
                </span>
                <div className="min-w-0 pt-0.5">
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8">
            <TryOnLauncher catalog={catalog} enabled={enabled} />
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {PROMISES.map((p) => (
                <li key={p.text} className="inline-flex items-center gap-1.5">
                  <p.icon className="size-4 text-success" aria-hidden />
                  {p.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
