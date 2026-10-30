import Link from "next/link";
import { CircleCheck, CircleDashed, CircleX } from "lucide-react";

import { cn } from "@/lib/utils";
import type { HomeChecklistItem } from "@/services/home-service/types";
import { HOME_BASE } from "./format";

const linkOf = (key: string, salonId: string): { href: string; label: string } | null => {
  if (key === "salonActive") return { href: `/dashboard/store/${salonId}`, label: "Your salon" };
  if (key === "exactLocation") return { href: `/dashboard/store/${salonId}?tab=location`, label: "Location" };
  if (key === "ladiesOffering") return { href: `${HOME_BASE}/menu?side=LADIES`, label: "Menu" };
  if (key === "gentsOffering") return { href: `${HOME_BASE}/menu?side=GENTS`, label: "Menu" };
  if (key.endsWith("Expert")) return { href: `${HOME_BASE}/experts`, label: "Experts" };
  return null;
};

/** What has to be true before turn-on. `failing` comes from a refused turn-on and stands out. */
export function HomeChecklist({
  items,
  salonId,
  failing = [],
}: {
  items: HomeChecklistItem[];
  salonId: string;
  failing?: string[];
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const refused = failing.includes(item.key);
        const link = linkOf(item.key, salonId);
        const Icon = item.ok ? CircleCheck : refused ? CircleX : CircleDashed;
        return (
          <li
            key={item.key}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 text-sm",
              refused ? "border-danger/40 bg-danger-soft" : "border-border",
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn(
                "mt-0.5 size-4 shrink-0",
                item.ok ? "text-success" : refused ? "text-danger" : "text-muted-foreground",
              )}
            />
            <span className="min-w-0 flex-1">
              {item.hint}
              <span className="sr-only">{item.ok ? " Done." : " Not done yet."}</span>
            </span>
            {link && !item.ok && (
              <Link href={link.href} className="shrink-0 font-medium text-primary hover:underline">
                {link.label}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
