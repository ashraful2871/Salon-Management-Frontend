import Link from "next/link";
import { Store, type LucideIcon } from "lucide-react";

import { IconTile } from "../Shared/FeatureCard";
import { Section, SectionHeader } from "../Shared/Section";
import { SERVICE_CATEGORIES } from "@/constants/service-categories";

const TILES: { href: string; label: string; icon: LucideIcon }[] = [
  ...SERVICE_CATEGORIES.map((c) => ({
    href: `/salons?category=${c.value}`,
    label: c.label,
    icon: c.icon,
  })),
  { href: "/salons", label: "All salons", icon: Store },
];

// Home "Browse by service": one tap into /salons filtered by category.
export default function ServiceCategories() {
  return (
    <Section size="compact" labelledBy="categories-heading">
      <SectionHeader
        overline="Browse"
        title="What are you booking today?"
        titleId="categories-heading"
      />
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 lg:gap-4">
        {TILES.map((tile) => (
          <li key={tile.href}>
            <Link
              href={tile.href}
              className="flex h-full min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-3 text-center transition-[box-shadow,border-color] duration-200 hover:border-primary/30 hover:shadow-card"
            >
              <IconTile icon={tile.icon} />
              <span className="text-sm font-medium leading-tight text-balance text-foreground">
                {tile.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
