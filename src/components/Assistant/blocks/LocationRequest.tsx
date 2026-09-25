"use client";

import { useState } from "react";
import { Crosshair, Loader2, Map } from "lucide-react";

import LocationDialog from "@/components/Location/LocationDialog";
import { useLocateAndSave } from "@/hooks/useLocateAndSave";
import {
  parseSavedLocation,
  readLocationCookie,
  type SavedLocation,
} from "@/lib/location-cookie";
import type { Block } from "@/lib/assistant-types";
import Chip from "../Chip";
import type { BlockProps } from "../block-props";

type LocationRequestBlock = Extract<Block, { type: "location_request" }>;

/**
 * Two doors to the same action. The browser refusing is not an error worth
 * showing raw - `LocationDialog` already explains it and offers search and a
 * list of areas instead, so a refusal simply opens that.
 */
const LocationRequest = ({
  block,
  disabled,
  onAction,
}: BlockProps<LocationRequestBlock>) => {
  const { locate, busy, canAsk } = useLocateAndSave();
  const [dialogOpen, setDialogOpen] = useState(false);

  const sendLocation = (saved: SavedLocation) =>
    onAction(
      {
        type: "set_location",
        lat: saved.lat,
        lng: saved.lng,
        label: saved.label,
      },
      saved.label,
    );

  const locateNow = async () => {
    const saved = canAsk ? await locate() : null;
    if (saved) sendLocation(saved);
    else setDialogOpen(true);
  };

  // The dialog only signals that it finished; the value it saved is the cookie.
  const handleDone = () => {
    const saved = parseSavedLocation(readLocationCookie());
    if (saved) sendLocation(saved);
  };

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3.5">
      <p className="text-sm leading-relaxed text-foreground">{block.reason}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Chip
          style="primary"
          disabled={disabled || busy}
          onClick={() => void locateNow()}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Crosshair className="h-4 w-4 shrink-0" aria-hidden />
          )}
          <span>Use my location</span>
        </Chip>

        <Chip disabled={disabled} onClick={() => setDialogOpen(true)}>
          <Map className="h-4 w-4 shrink-0" aria-hidden />
          <span>Pick an area</span>
        </Chip>

        {block.canSkip && (
          <Chip
            label="Not now"
            disabled={disabled}
            onClick={() => onAction({ type: "start" }, "Not now")}
            className="text-muted-foreground"
          />
        )}
      </div>

      <LocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDone={handleDone}
      />
    </div>
  );
};

export default LocationRequest;
