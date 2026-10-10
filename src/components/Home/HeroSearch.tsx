"use client";

import { track } from "@/lib/track";
import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "../ui/button";
import { SERVICE_CATEGORIES } from "@/constants/service-categories";

const POPULAR = ["HAIRCUT", "FACIAL", "MAKEUP", "MANICURE", "MASSAGE"];
const popular = SERVICE_CATEGORIES.filter((c) => POPULAR.includes(c.value));

const CHIP =
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft pointer-coarse:h-11";

// Home hero search. Free text goes to /salons?searchTerm= (the API matches
// salon and service names); the chips filter by service category.
export default function HeroSearch() {
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
        className="flex items-center gap-2 rounded-full border border-border bg-surface p-1.5 shadow-card focus-within:border-primary/50 focus-within:ring-[3px] focus-within:ring-ring"
      >
        <Search
          className="ml-2.5 size-5 shrink-0 text-muted-foreground"
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
          className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
        <Button type="submit" size="lg" loading={pending}>
          {!pending && (
            <Search className="min-[380px]:hidden" aria-hidden />
          )}
          <span className="max-[380px]:sr-only">Search</span>
        </Button>
      </form>

      <div className="-mx-4 mt-4 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 lg:justify-start">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          Popular:
        </span>
        {popular.map(({ value, label, icon: Icon }) => (
          <Link key={value} href={`/salons?category=${value}`} className={CHIP}>
            <Icon className="size-4 text-primary-hover" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
