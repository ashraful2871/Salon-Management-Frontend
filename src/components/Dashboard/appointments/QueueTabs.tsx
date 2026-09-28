"use client";

import type { ReactNode } from "react";
import { CalendarDays, ListOrdered } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// A pill switch: full width on a phone (two big targets), sized to fit above.
const TRIGGER =
  "h-9 flex-1 rounded-full px-4 text-sm text-muted-foreground hover:text-foreground data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:flex-none";

// Puts the salon desk's queue beside the full booking list. Everyone else gets
// the list exactly as before, with no wrapper element.
export const QueueTabs = ({
  enabled,
  queue,
  children,
}: {
  enabled: boolean;
  queue: ReactNode;
  children: ReactNode;
}) => {
  if (!enabled) return <>{children}</>;

  return (
    <Tabs defaultValue="queue" className="gap-5">
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
      <TabsContent value="queue">{queue}</TabsContent>
      <TabsContent value="all" className="space-y-6">
        {children}
      </TabsContent>
    </Tabs>
  );
};
