"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSavedLocation } from "@/hooks/useSavedLocation";
import LocationDialog from "./LocationDialog";

type LocationChipProps = {
  // default: navbar pill · compact: tablet top bar · icon: phone top bar ·
  // block: mobile drawer row
  variant?: "default" | "compact" | "icon" | "block";
  // Called after a location is saved or cleared (e.g. to close the drawer).
  onDone?: () => void;
  className?: string;
};

const LocationChip = ({
  variant = "default",
  onDone,
  className,
}: LocationChipProps) => {
  const [open, setOpen] = useState(false);
  const saved = useSavedLocation();

  const label = saved?.label ?? "Set location";
  // "Dhanmondi, Dhaka" -> "Dhanmondi" where space is tight.
  const shortLabel = saved ? saved.label.split(",")[0].trim() : "Set location";

  if (variant === "icon") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={
            saved ? `Location: ${saved.label}. Change location` : "Set location"
          }
          title={saved?.label}
          className={cn(
            "relative grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-white text-foreground transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            className,
          )}
        >
          <MapPin
            className={cn("h-[18px] w-[18px]", saved ? "text-primary" : "text-muted-foreground")}
          />
          {!saved && (
            // Nothing set yet: a small dot nudges toward setting one.
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose ring-2 ring-white" />
          )}
        </button>
        <LocationDialog open={open} onOpenChange={setOpen} onDone={onDone} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={
          saved ? `Location: ${saved.label}. Change location` : "Set location"
        }
        title={saved?.label}
        className={cn(
          "inline-flex min-w-0 cursor-pointer items-center gap-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          variant === "block"
            ? "w-full rounded-xl border border-border bg-surface-subtle px-4 py-3 text-foreground hover:bg-muted"
            : "h-10 rounded-full border border-border bg-white px-3 text-foreground hover:border-gold/50 hover:shadow-sm",
          saved ? "" : "text-muted-foreground",
          className,
        )}
      >
        <MapPin
          className={cn("h-4 w-4 shrink-0", saved ? "text-primary" : "text-muted-foreground/60")}
        />
        {variant === "compact" ? (
          <span className="max-w-24 truncate max-[380px]:sr-only">{shortLabel}</span>
        ) : (
          <span
            className={cn(
              "truncate",
              variant === "default" ? "max-w-40 xl:max-w-52" : "flex-1 text-left",
            )}
          >
            {label}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
      </button>

      <LocationDialog open={open} onOpenChange={setOpen} onDone={onDone} />
    </>
  );
};

export default LocationChip;
