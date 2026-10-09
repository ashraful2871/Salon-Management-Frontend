"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import LocationPicker from "@/components/Map/LocationPicker";
import { showResultToast } from "@/components/Shared/showResultToast";
import { updateAdminSalonLocation } from "@/services/admin/salons/updateAdminSalonLocation";

type Point = { lat: number; lng: number };

/**
 * The owner's Leaflet pin picker, in a sheet: drag the pin onto the door and
 * save. Saving marks the location exact and re-indexes the salon.
 */
export function FixPinSheet({
  open,
  onOpenChange,
  salon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salon: { id: string; name: string; latitude: number | null; longitude: number | null };
}) {
  const saved: Point | null =
    salon.latitude != null && salon.longitude != null ? { lat: salon.latitude, lng: salon.longitude } : null;
  const [pin, setPin] = useState<Point | null>(saved);
  const [pending, startTransition] = useTransition();

  const save = () => {
    if (!pin) return;
    startTransition(async () => {
      const result = await updateAdminSalonLocation(salon.id, pin.lat, pin.lng);
      showResultToast(result);
      if (result.success) onOpenChange(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <SheetContent side="right" className="flex h-dvh w-full max-w-none flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle>Fix the pin for {salon.name}</SheetTitle>
          <SheetDescription>
            Drag the pin onto the salon&apos;s door. Saving marks the location exact.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <LocationPicker value={pin} onChange={(lat, lng) => setPin({ lat, lng })} />
        </div>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!pin || pending} onClick={save}>
            {pending && <Loader2 aria-hidden className="animate-spin" />}
            Save pin
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
