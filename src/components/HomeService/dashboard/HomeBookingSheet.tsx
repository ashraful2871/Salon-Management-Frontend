"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { getHomeBooking } from "@/services/home-service/getHomeBooking";
import type { HomeBooking } from "@/services/home-service/types";
import HomeBookingView from "../booking/HomeBookingView";
import { homeErrorMessage } from "../booking/errors";

/** Each opening is its own read, so reopening a row never shows an old status. */
export type SheetTarget = { id: string; opening: number };

/** One visit in full over the list: the booking page's content, read when it opens. */
export default function HomeBookingSheet({
  target,
  open,
  onOpenChange,
  walletMinor,
}: {
  target: SheetTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletMinor: number;
}) {
  const [loaded, setLoaded] = useState<{ target: SheetTarget; booking: HomeBooking | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!target) return;
    let live = true;
    getHomeBooking(target.id).then((res) => {
      if (!live) return;
      setLoaded(
        res.success && res.data
          ? { target, booking: res.data, error: null }
          : { target, booking: null, error: homeErrorMessage(res) },
      );
    });
    return () => {
      live = false;
    };
  }, [target]);

  const current = loaded?.target === target ? loaded : null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Home visit" className="sm:max-w-2xl">
      {current?.booking ? (
        <HomeBookingView
          key={target?.opening}
          initial={current.booking}
          walletMinor={walletMinor}
          methods={[]}
          via={null}
          retryMethod={null}
          embedded
        />
      ) : current?.error ? (
        <p className="text-sm text-danger">{current.error}</p>
      ) : (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Loading your visit…
        </p>
      )}
    </ResponsiveDialog>
  );
}
