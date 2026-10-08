"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

/**
 * The top of a 360 page (user, salon, booking): avatar or cover, title, a
 * status `ToneBadge`, one line of facts joined with "·", and the actions.
 */
export function EntityHeader({
  title,
  imageUrl,
  shape = "avatar",
  status,
  statusLabel,
  facts = [],
  actions,
}: {
  title: string;
  imageUrl?: string | null;
  /** `cover` draws a wide rounded thumbnail (salons) instead of a circle. */
  shape?: "avatar" | "cover";
  status?: string | null;
  statusLabel?: string;
  facts?: ReactNode[];
  actions?: ReactNode;
}) {
  const shown = facts.filter((f) => f !== null && f !== undefined && f !== false && f !== "");

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {shape === "cover" ? (
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-subtle">
          {imageUrl && (
            // A thumbnail from any host; next/image would need it allow-listed.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="size-full object-cover" />
          )}
        </div>
      ) : (
        <Avatar className="size-14 shrink-0">
          {imageUrl && <AvatarImage src={imageUrl} alt="" />}
          <AvatarFallback className="bg-primary-soft font-semibold text-primary-hover">
            {initials(title)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 font-display text-heading font-semibold break-words">{title}</h1>
          {status && <ToneBadge status={status}>{statusLabel}</ToneBadge>}
        </div>
        {shown.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
            {shown.map((fact, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true">·</span>}
                {fact}
              </span>
            ))}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export type EntityTab = { key: string; label: string; content: ReactNode; count?: number };

/**
 * Tabs under an `EntityHeader`. The open tab lives in `?tab=` (the first tab
 * is the bare URL), written with `history.replaceState` - Next keeps
 * `useSearchParams` in step - so a link or reload reopens it without a server
 * round trip on every switch.
 */
export function EntityTabs({ tabs, className }: { tabs: EntityTab[]; className?: string }) {
  const params = useSearchParams();
  const requested = params.get("tab");
  const value = tabs.find((t) => t.key === requested)?.key ?? tabs[0]?.key;

  const onValueChange = (key: string) => {
    const next = new URLSearchParams(params.toString());
    if (key === tabs[0]?.key) next.delete("tab");
    else next.set("tab", key);
    const query = next.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  };

  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn("gap-4", className)}>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
              {typeof tab.count === "number" && (
                <span className="ml-1 text-xs text-muted-foreground tabular-nums">{tab.count}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.key} value={tab.key}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
