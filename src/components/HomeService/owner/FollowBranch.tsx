"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setSelectedBranch } from "@/lib/branch-cookie";

/**
 * An email link names its branch with `?salonId=`. The page already shows that
 * branch; this moves the switcher there too, so the tabs stay on it.
 */
export function FollowBranch({ salonId }: { salonId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    void setSelectedBranch(salonId).then(() => router.replace(pathname));
  }, [salonId, pathname, router]);

  return null;
}
