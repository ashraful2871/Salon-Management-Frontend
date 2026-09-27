import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** The soft gold square an icon sits in on feature and step cards. */
export function IconTile({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-hover",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-5" />
    </span>
  );
}

/** An icon, a title and a line of text. With `href` the whole card is one link. */
export function FeatureCard({
  icon,
  title,
  description,
  href,
  cta,
}: {
  icon: LucideIcon;
  title: ReactNode;
  description: ReactNode;
  href?: string;
  cta?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6",
        href &&
          "relative transition-[box-shadow,border-color] duration-200 hover:border-primary/30 hover:shadow-card focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2 focus-within:ring-offset-background",
      )}
    >
      <IconTile icon={icon} />
      <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
        {href ? (
          <Link
            href={href}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {href && cta && (
        <p className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primary">
          {cta}
          <ArrowRight aria-hidden="true" className="size-4" />
        </p>
      )}
    </div>
  );
}
