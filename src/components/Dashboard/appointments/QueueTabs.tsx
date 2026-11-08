"use client";

import { useState, type ReactNode } from "react";
import { CalendarDays, ListOrdered } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// A pill switch: full width on a phone (two big targets), sized to fit above.
const TRIGGER =
  "h-9 flex-1 rounded-full px-4 text-sm text-muted-foreground hover:text-foreground data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:flex-none";

const HINT = {
  queue: "Today's bookings in calling order, by service. Check customers in and finish them here.",
  all: "Search any booking by name, phone or token, on any day.",
} as const;

// Puts the salon desk's queue beside the full booking list, with `aside` (the
// token lookup) on the same row. Everyone else gets the list exactly as
// before, with no wrapper element.
export const QueueTabs = ({
  enabled,
  queue,
  aside,
  children,
}: {
  enabled: boolean;
  queue: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) => {
  const [tab, setTab] = useState<keyof typeof HINT>("queue");
  if (!enabled) return <>{children}</>;

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as keyof typeof HINT)} className="gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <TabsList className="w-full rounded-full border border-border bg-muted p-1 group-data-[orientation=horizontal]/tabs:h-11 sm:w-fit">
            <TabsTrigger value="queue" className={TRIGGER}>
              <ListOrdered aria-hidden="true" />
              Today&apos;s queue
            </TabsTrigger>
            <TabsTrigger value="all" className={TRIGGER}>
              <CalendarDays aria-hidden="true" />
              All bookings
            </TabsTrigger>
          </TabsList>
          <p className="px-1 text-xs text-muted-foreground">{HINT[tab]}</p>
        </div>
        {/* Check-in by token belongs to the desk's queue; the list has its own search. */}
        {aside && tab === "queue" && <div className="w-full lg:w-[26rem] lg:shrink-0">{aside}</div>}
      </div>
      <TabsContent value="queue">{queue}</TabsContent>
      <TabsContent value="all" className="space-y-6">
        {children}
      </TabsContent>
    </Tabs>
  );
};
