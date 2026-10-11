import Link from "next/link";
import { Store, type LucideIcon } from "lucide-react";

import { IconTile } from "../Shared/FeatureCard";
import { Section, SectionHeader } from "../Shared/Section";
import { SERVICE_CATEGORIES } from "@/constants/service-categories";
import { contentIcon } from "@/lib/content-icons";
import {
  getPublicSettings,
  type CategoryTile,
} from "@/services/settings/getPublicSettings";

type Tile = { href: string; label: string; icon: LucideIcon };

// Shown when `content.categoryTiles` is empty or unreachable (what shipped before it).
const FALLBACK: Tile[] = SERVICE_CATEGORIES.map((c) => ({
  href: `/salons?category=${c.value}`,
  label: c.label,
  icon: c.icon,
}));

const ALL_SALONS: Tile = { href: "/salons", label: "All salons", icon: Store };

const fromSettings = (tiles: CategoryTile[]): Tile[] =>
  tiles
    .filter((t) => t.visible)
    .sort((a, b) => a.order - b.order)
    .map((t) => ({
      href: `/salons?category=${encodeURIComponent(t.category)}`,
      label: t.labelEn,
      icon: contentIcon(t.icon),
    }));

// Home "Browse by service": one tap into /salons filtered by category. The
// tiles are `content.categoryTiles`, read without cookies so / stays static.
export default async function ServiceCategories() {
  const settings = await getPublicSettings();
  const saved = settings.success ? settings.data?.["content.categoryTiles"] : undefined;
  const tiles = [...(saved?.length ? fromSettings(saved) : FALLBACK), ALL_SALONS];

  return (
    <Section size="compact" labelledBy="categories-heading">
      <SectionHeader
        overline="Browse"
        title="What are you booking today?"
        titleId="categories-heading"
      />
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 lg:gap-4">
        {tiles.map((tile) => (
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
