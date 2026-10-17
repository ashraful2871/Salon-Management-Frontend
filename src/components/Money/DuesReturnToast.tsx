"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * The gateway sends a dues payment back to `/dashboard/money?dues=…`. Says how
 * it went once, then drops the param so a reload does not say it again.
 */
export function DuesReturnToast({ outcome }: { outcome?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);

  useEffect(() => {
    if (!outcome || shown.current) return;
    shown.current = true;
    if (outcome === "success") {
      toast.success("Dues paid - thank you. Online bookings resume if they were paused.");
    } else if (outcome === "cancelled") {
      toast.info("Payment cancelled. Nothing was charged.");
    } else {
      toast.error("The payment didn't go through. Nothing was charged - please try again.");
    }
    router.replace(pathname, { scroll: false });
  }, [outcome, pathname, router]);

  return null;
}
