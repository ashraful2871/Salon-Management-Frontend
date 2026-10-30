"use client";

import { Check, Home, MapPin, Plus } from "lucide-react";

import LocationPicker from "@/components/Map/LocationPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { HomeAddress, HomeAudience } from "@/services/home-service/types";
import { BD_MOBILE, normalizePhone } from "./format";

export type AddressDraft = {
  /** A saved address, or null for a new one. */
  savedId: string | null;
  lat: number | null;
  lng: number | null;
  /** House, flat, floor and road. */
  addressLine: string;
  area: string;
  landmark: string;
  recipientName: string;
  contactPhone: string;
  notes: string;
  recipientIsWoman: boolean;
  save: boolean;
  label: string;
};

export const fromSaved = (a: HomeAddress, d: AddressDraft): AddressDraft => ({
  ...d,
  savedId: a.id,
  lat: a.latitude,
  lng: a.longitude,
  addressLine: a.addressLine,
  area: a.area ?? "",
  landmark: a.landmark ?? "",
  save: false,
});

/** What's missing before the quote can run; null when ready. */
export const addressProblem = (d: AddressDraft, audience: HomeAudience): string | null => {
  if (d.lat == null || d.lng == null) return "Place the pin on your home.";
  if (d.addressLine.trim().length < 5) return "Add your house, flat and floor.";
  if (d.recipientName.trim().length < 2) return "Add the name of the person getting the service.";
  if (!BD_MOBILE.test(normalizePhone(d.contactPhone))) return "Enter an 11-digit mobile number starting 01.";
  if (audience === "LADIES" && !d.recipientIsWoman) return "Tick that this service is for a woman.";
  if (d.save && !d.savedId && !d.label.trim()) return "Name the saved address, e.g. Home.";
  return null;
};

/**
 * Where the visit happens: a saved address or a new one placed on the map,
 * then who it's for and how to reach them. Ladies visits confirm they are for
 * a woman (`RECIPIENT_CONFIRMATION_REQUIRED`).
 */
export default function AddressStep({
  draft,
  onChange,
  saved,
  audience,
  profileHasPhone,
  fallbackCenter,
}: {
  draft: AddressDraft;
  onChange: (patch: Partial<AddressDraft>) => void;
  saved: HomeAddress[];
  audience: HomeAudience;
  profileHasPhone: boolean;
  fallbackCenter?: { lat: number; lng: number; label?: string };
}) {
  const isNew = draft.savedId === null;

  return (
    <div className="space-y-6">
      {saved.length > 0 && (
        <div role="radiogroup" aria-label="Address" className="grid gap-2 sm:grid-cols-2">
          {saved.map((a) => {
            const on = draft.savedId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange(fromSaved(a, draft))}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-primary/60",
                )}
              >
                <Home className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-foreground">{a.label}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {[a.addressLine, a.area].filter(Boolean).join(", ")}
                  </span>
                </span>
                {on && <Check className="size-5 shrink-0 text-primary" aria-hidden />}
              </button>
            );
          })}
          <button
            type="button"
            role="radio"
            aria-checked={isNew}
            onClick={() =>
              onChange({ savedId: null, lat: null, lng: null, addressLine: "", area: "", landmark: "", save: saved.length < 10 })
            }
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-3 text-left font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isNew ? "border-primary bg-primary-soft text-foreground" : "border-border text-muted-foreground hover:border-primary/60",
            )}
          >
            <Plus className="size-5 text-primary" aria-hidden /> A new address
          </button>
        </div>
      )}

      {isNew && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <MapPin className="size-4 text-primary" aria-hidden /> Put the pin on your home
          </p>
          <LocationPicker
            value={draft.lat != null && draft.lng != null ? { lat: draft.lat, lng: draft.lng } : null}
            fallbackCenter={fallbackCenter}
            onChange={(lat, lng) => onChange({ lat, lng })}
            onAddressSuggestion={(place) => onChange({ area: place.area ?? place.city ?? draft.area })}
          />
          <p className="text-xs text-muted-foreground">It has to be inside the salon&apos;s service area; we check on the next step.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="hs-line" label="House, flat, floor & road" className="sm:col-span-2">
          <Input
            id="hs-line"
            value={draft.addressLine}
            maxLength={200}
            autoComplete="street-address"
            placeholder="House 12, Flat 4B, 4th floor, Road 7"
            onChange={(e) => onChange({ addressLine: e.target.value })}
          />
        </Field>
        <Field id="hs-area" label="Area">
          <Input id="hs-area" value={draft.area} maxLength={80} placeholder="Dhanmondi" onChange={(e) => onChange({ area: e.target.value })} />
        </Field>
        <Field id="hs-landmark" label="Landmark (optional)">
          <Input
            id="hs-landmark"
            value={draft.landmark}
            maxLength={120}
            placeholder="Opposite the mosque"
            onChange={(e) => onChange({ landmark: e.target.value })}
          />
        </Field>
        <Field id="hs-name" label="Who is the service for?">
          <Input
            id="hs-name"
            value={draft.recipientName}
            maxLength={80}
            autoComplete="name"
            onChange={(e) => onChange({ recipientName: e.target.value })}
          />
        </Field>
        <Field
          id="hs-phone"
          label="Contact phone"
          hint={profileHasPhone ? undefined : "We'll also save it to your profile: home visits need a mobile number."}
        >
          <Input
            id="hs-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={draft.contactPhone}
            maxLength={16}
            placeholder="01XXXXXXXXX"
            onChange={(e) => onChange({ contactPhone: e.target.value })}
          />
        </Field>
        <Field id="hs-notes" label="Notes for the expert (optional)" className="sm:col-span-2">
          <Textarea
            id="hs-notes"
            rows={2}
            value={draft.notes}
            maxLength={300}
            placeholder="Gate code, parking, which bell to ring…"
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </Field>
      </div>

      <div className="space-y-3">
        {audience === "LADIES" && (
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface p-3 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={draft.recipientIsWoman}
              onChange={(e) => onChange({ recipientIsWoman: e.target.checked })}
              className="mt-0.5 size-5 shrink-0 accent-primary"
            />
            <span>
              This service is for a woman
              <span className="block text-xs font-normal text-muted-foreground">Ladies at Home experts visit women only.</span>
            </span>
          </label>
        )}
        {isNew && saved.length < 10 && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={draft.save}
                onChange={(e) => onChange({ save: e.target.checked })}
                className="size-5 accent-primary"
              />
              Save this address
            </label>
            {draft.save && (
              <Input
                aria-label="Name for this address"
                value={draft.label}
                maxLength={30}
                placeholder="Home"
                className="h-9 w-36"
                onChange={(e) => onChange({ label: e.target.value })}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
