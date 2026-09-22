"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSavedLocation } from "@/hooks/useSavedLocation";
import LocationDialog from "./LocationDialog";

type LocationChipProps = {
  // default: navbar pill · compact: mobile top bar · block: mobile drawer row
  variant?: "default" | "compact" | "block";
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
            ? "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 hover:bg-slate-100"
            : "h-10 rounded-full border border-slate-200 bg-white px-3 text-slate-700 hover:border-slate-300 hover:shadow-sm",
          saved ? "" : "text-slate-600",
          className,
        )}
      >
        <MapPin
          className={cn("h-4 w-4 shrink-0", saved ? "text-primary" : "text-slate-400")}
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
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </button>

      <LocationDialog open={open} onOpenChange={setOpen} onDone={onDone} />
    </>
  );
};

export default LocationChip;
