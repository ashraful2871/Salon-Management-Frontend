"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <Tabs defaultValue="queue" className="space-y-6">
      <TabsList>
        <TabsTrigger value="queue">Today&apos;s queue</TabsTrigger>
        <TabsTrigger value="all">All bookings</TabsTrigger>
      </TabsList>
      <TabsContent value="queue">{queue}</TabsContent>
      <TabsContent value="all" className="space-y-8">
        {children}
      </TabsContent>
    </Tabs>
  );
};
