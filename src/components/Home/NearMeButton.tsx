"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LocateFixed } from "lucide-react";

import { Button } from "../ui/button";
import LocationDialog from "../Location/LocationDialog";
import { useLocateAndSave } from "@/hooks/useLocateAndSave";
import {
  parseSavedLocation,
  readLocationCookie,
  type SavedLocation,
} from "@/lib/location-cookie";
import { cn } from "@/lib/utils";

const nearbyUrl = ({ lat, lng }: Pick<SavedLocation, "lat" | "lng">) =>
  `/salons?lat=${lat}&lng=${lng}&r=5&sort=distance`;

// Hero CTA. Asks for the location only when tapped, then goes straight to the
// nearby list. If GPS is refused, fails or lands outside Bangladesh, the
// location dialog takes over with search and areas.
export default function NearMeButton({ className }: { className?: string }) {
  const router = useRouter();
  const { locate, busy, canAsk } = useLocateAndSave();
  const [dialogOpen, setDialogOpen] = useState(false);

  const findNearMe = async () => {
    const saved = canAsk ? await locate() : null;
    if (saved) router.push(nearbyUrl(saved));
    else setDialogOpen(true);
  };

  // The dialog saved (or cleared) a location; follow through to the list.
  const onDialogDone = () => {
    const saved = parseSavedLocation(readLocationCookie());
    if (saved) router.push(nearbyUrl(saved));
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="xl"
        onClick={findNearMe}
        disabled={busy}
        aria-busy={busy}
        className={cn(className)}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <LocateFixed className="h-5 w-5 text-gold" />
        )}
        Find salons near me
      </Button>
      <LocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDone={onDialogDone}
      />
    </>
  );
}
