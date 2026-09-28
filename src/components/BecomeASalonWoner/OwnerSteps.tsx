import { BadgeCheck, ClipboardCheck, FileText, Store } from "lucide-react";

import { IconTile } from "../Shared/FeatureCard";
import { Section, SectionHeader } from "../Shared/Section";

const STEPS = [
  {
    icon: FileText,
    title: "Apply",
    body: "Fill in the form below with your business details.",
  },
  {
    icon: ClipboardCheck,
    title: "Get approved",
    body: "We review your application. Follow it in Application status.",
  },
  {
    icon: Store,
    title: "Add your salon",
    body: "Set up your services, staff, hours and location.",
  },
  {
    icon: BadgeCheck,
    title: "Go live",
    body: "After a quick check, your salon appears in search.",
  },
];

export default function OwnerSteps() {
  return (
    <Section id="how" labelledBy="owner-how-heading">
      <SectionHeader
        align="center"
        overline="How it works"
        title="From application to your first booking"
        titleId="owner-how-heading"
      />
      <ol className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground tabular-nums">
                {i + 1}
              </span>
              <IconTile icon={step.icon} />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-1 text-base leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
