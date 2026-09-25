"use client";

import { Copy, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { LeafletMap, PinMarker } from "../Map/MapClient";
import { directionsUrl, formatDistance, haversineMeters } from "@/lib/geo";
import { useSavedLocation } from "@/hooks/useSavedLocation";
import type { Salon } from "@/lib/api-types";

type SalonLocation = Pick<
  Salon,
  | "name"
  | "address"
  | "area"
  | "district"
  | "city"
  | "latitude"
  | "longitude"
  | "locationAccuracy"
>;

// "House 12, Road 27" + "Dhanmondi" + "Dhaka", skipping parts the street
// address already mentions.
function formatAddress(salon: SalonLocation) {
  const parts: string[] = [];
  for (const raw of [salon.address, salon.area, salon.district || salon.city]) {
    const part = raw?.trim();
    if (!part) continue;
    const lower = part.toLowerCase();
    if (parts.some((p) => p.toLowerCase().includes(lower))) continue;
    parts.push(part);
  }
  return parts.join(", ");
}

const SalonLocationCard = ({ salon }: { salon: SalonLocation }) => {
  const { latitude: lat, longitude: lng } = salon;
  const hasPin =
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);
  const approximate = salon.locationAccuracy === "APPROXIMATE";
  const address = formatAddress(salon);

  // One display value, so a client-side distance from the saved location is
  // fine here (lists are sorted by the backend).
  const saved = useSavedLocation();
  const fromYou =
    hasPin && saved
      ? formatDistance(
          haversineMeters([saved.lat, saved.lng], [lat, lng]),
          approximate,
        )
      : "";

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied");
    } catch {
      toast.error("Could not copy the address");
    }
  };

  return (
    <Card className="gap-4 overflow-hidden py-4 shadow-sm border-primary/20">
      <CardContent className="space-y-4 px-4">
        {hasPin && (
          <div className="h-[200px]">
            <LeafletMap
              center={[lat, lng]}
              zoom={approximate ? 14 : 16}
              interactive={false}
              className="h-full"
            >
              <PinMarker
                position={[lat, lng]}
                approximate={approximate}
                title={salon.name}
              />
            </LeafletMap>
          </div>
        )}

        <div className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <div className="space-y-1">
            <p className="leading-relaxed">
              {address || "Address not available"}
            </p>
            {!hasPin && (
              <p className="text-xs text-muted-foreground">
                Address only. The salon hasn&apos;t pinned its map location
                yet.
              </p>
            )}
            {hasPin && approximate && (
              <p className="text-xs text-muted-foreground">
                Approximate location. The salon hasn&apos;t pinned its exact
                spot yet.
              </p>
            )}
            {fromYou && (
              <p className="text-xs font-medium text-foreground">
                {fromYou} from you
              </p>
            )}
          </div>
        </div>

        {(hasPin || address) && (
          <div className="flex gap-2">
            {hasPin && (
              <Button asChild variant="gold" size="sm" className="flex-1">
                <a
                  href={directionsUrl(lat, lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation />
                  Get directions
                </a>
              </Button>
            )}
            {address && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyAddress}
                aria-label="Copy address"
                className={hasPin ? undefined : "flex-1"}
              >
                <Copy />
                Copy
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalonLocationCard;
