"use client";

import { useEffect, useState, useTransition } from "react";
import { MapPin } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LocationPicker from "@/components/Map/LocationPicker";
import { LocationAccuracyBadge } from "@/components/Shared/LocationAccuracyBadge";
import { SaveBar } from "@/components/Shared/SaveBar";
import { showResultToast } from "@/components/Shared/showResultToast";
import type { LocationAccuracy } from "@/lib/api-types";
import { searchPlaces } from "@/services/geo/searchPlaces";
import { updateSalonLocation } from "@/services/salon/updateSalonLocation";

type Point = { lat: number; lng: number };

export type SalonLocationFields = {
  id: string;
  area?: string;
  district?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: LocationAccuracy | null;
};

// Saves only the pin, through PATCH /salons/:id/location. The Edit Details
// form (updateSalon) resends every field and must not be used for this.
// The save expires the salon's cache tag, so the saved pin comes back in
// `salon` and `moved` drops to false.
export default function SalonLocationTab({
  salon,
}: {
  salon: SalonLocationFields;
}) {
  const saved: Point | null =
    salon.latitude != null && salon.longitude != null
      ? { lat: salon.latitude, lng: salon.longitude }
      : null;
  const hasSaved = saved !== null;

  const [pin, setPin] = useState<Point | null>(saved);
  const [areaCenter, setAreaCenter] = useState<
    (Point & { label: string }) | undefined
  >();
  const [isSaving, startSaving] = useTransition();

  // No saved location: start the map on the salon's area rather than Dhaka.
  useEffect(() => {
    if (hasSaved) return;
    const label = salon.area || salon.district;
    if (!label) return;

    let cancelled = false;
    const q = [salon.area, salon.district].filter(Boolean).join(", ");
    searchPlaces(q).then((res) => {
      const first = res.success ? res.data?.[0] : undefined;
      if (!cancelled && first) {
        setAreaCenter({ lat: first.lat, lng: first.lng, label });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [hasSaved, salon.area, salon.district]);

  const moved =
    pin !== null &&
    (saved === null || pin.lat !== saved.lat || pin.lng !== saved.lng);
  // An approximate pin can be confirmed as-is: saving marks it EXACT.
  const canSave =
    pin !== null && (moved || salon.locationAccuracy !== "EXACT");

  const save = () => {
    if (!pin) return;
    startSaving(async () => {
      const res = await updateSalonLocation(salon.id, pin.lat, pin.lng);
      showResultToast(res, "Location saved.", "Failed to save the location.");
    });
  };

  return (
    <Card>
      <CardHeader className="space-y-1.5">
        <CardTitle className="flex flex-wrap items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
          Location on map
          <LocationAccuracyBadge
            latitude={salon.latitude}
            locationAccuracy={salon.locationAccuracy}
            emptyLabel="Not set"
          />
        </CardTitle>
        <CardDescription>
          Customers searching nearby find you by this pin, and &quot;Get
          directions&quot; leads here.
          {salon.locationAccuracy === "APPROXIMATE" &&
            " Right now it only points at your area, not your door."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <LocationPicker
          value={pin}
          fallbackCenter={areaCenter}
          onChange={(lat, lng) => setPin({ lat, lng })}
        />

        <SaveBar
          className="mt-4"
          show={canSave}
          pending={isSaving}
          onSave={save}
          saveLabel={moved ? "Save location" : "Confirm pin"}
          message={moved ? "Unsaved pin" : "Is the pin on your door?"}
          onDiscard={moved ? () => setPin(saved) : undefined}
        />
      </CardContent>
    </Card>
  );
}
