"use client";

import { track } from "@/lib/track";
import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "../ui/button";
import { SERVICE_CATEGORIES } from "@/constants/service-categories";
import type { HomeChip } from "@/services/settings/getPublicSettings";

// Shown when `content.homeChips` is empty or unreachable (what shipped before it).
const POPULAR = ["HAIRCUT", "FACIAL", "MAKEUP", "MANICURE", "MASSAGE"];
const FALLBACK_CHIPS: HomeChip[] = SERVICE_CATEGORIES.filter((c) =>
  POPULAR.includes(c.value),
).map((c) => ({ label: c.label, category: c.value }));

const chipLink = (chip: HomeChip) => ({
  href: chip.category
    ? `/salons?category=${encodeURIComponent(chip.category)}`
    : `/salons?searchTerm=${encodeURIComponent(chip.query ?? chip.label)}`,
  icon: SERVICE_CATEGORIES.find((c) => c.value === chip.category)?.icon ?? Search,
});

// Phones: light chips on the page. md+: the hero puts this on a dark photo,
// so light-on-dark chips (no backdrop blur).
const CHIP =
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-sm font-medium text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:border-white/25 md:bg-white/10 md:px-4 md:text-white md:shadow-none md:hover:border-white/50 md:hover:bg-white/20 md:focus-visible:ring-white/60";

// Home hero search. Free text goes to /salons?searchTerm= (the API matches
// salon and service names); the chips (`content.homeChips`) filter by service
// category or run a search.
export default function HeroSearch({ chips }: { chips?: HomeChip[] }) {
  const popular = chips?.length ? chips : FALLBACK_CHIPS;
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = term.trim();
    if (q) track("search_submitted", "source:hero");
    startTransition(() =>
      router.push(q ? `/salons?searchTerm=${encodeURIComponent(q)}` : "/salons"),
    );
  };

  return (
    <div className="w-full">
      <form
        role="search"
        onSubmit={onSubmit}
        className="flex h-14 max-w-xl items-center gap-2 rounded-full border border-border bg-surface p-1.5 shadow-soft transition-shadow focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-ring md:h-[52px] md:border-0 md:p-1 md:shadow-lg md:shadow-black/20 md:focus-within:ring-white/30"
      >
        <Search
          className="ml-3 size-[18px] shrink-0 text-muted-foreground md:ml-4"
          aria-hidden
        />
        <label htmlFor="hero-search" className="sr-only">
          Search salons or services
        </label>
        <input
          id="hero-search"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Haircut, facial, salon name…"
          className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground md:text-[15px]"
        />
        {/* Phones: a round icon button, so the placeholder has the room. */}
        <Button
          type="submit"
          loading={pending}
          aria-label="Search"
          className="aspect-square h-full rounded-full p-0 text-sm font-semibold md:aspect-auto md:px-6"
        >
          {!pending && <Search className="size-5 md:hidden" aria-hidden />}
          <span className="hidden md:inline">Search</span>
        </Button>
      </form>

      {/* Phones: one row that scrolls edge to edge; md+: wraps. */}
      <div className="-mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:mt-4 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
        <span className="hidden text-sm text-white/70 md:inline">
          Popular:
        </span>
        {popular.map((chip, i) => {
          const { href, icon: Icon } = chipLink(chip);
          return (
            <Link key={`${i}:${href}`} href={href} className={CHIP}>
              <Icon className="size-4 text-primary-hover md:text-gold-light" aria-hidden />
              {chip.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
