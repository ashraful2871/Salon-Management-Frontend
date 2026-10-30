"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { Check, Home, Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import LocationPicker from "@/components/Map/LocationPicker";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiResponse } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { createHomeAddress } from "@/services/home-service/createHomeAddress";
import { deleteHomeAddress } from "@/services/home-service/deleteHomeAddress";
import { updateHomeAddress } from "@/services/home-service/updateHomeAddress";
import type { HomeAddress } from "@/services/home-service/types";
import { homeErrorMessage } from "../booking/errors";

/** The server's limit, and the booking form's. */
const MAX_ADDRESSES = 10;

type Change = { kind: "remove"; id: string } | { kind: "default"; id: string };

const applyChange = (list: HomeAddress[], change: Change) =>
  change.kind === "remove"
    ? list.filter((a) => a.id !== change.id)
    : list.map((a) => ({ ...a, isDefault: a.id === change.id }));

/** Saved addresses. Delete and set default land at once; the response brings the server's list. */
export default function AddressesPanel({ addresses }: { addresses: HomeAddress[] }) {
  const [list, apply] = useOptimistic(addresses, applyChange);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const inFlight = useRef(new Set<string>());
  const [editing, setEditing] = useState<HomeAddress | "new" | null>(null);
  const [formOpening, setFormOpening] = useState(0);
  const [removing, setRemoving] = useState<HomeAddress | null>(null);

  const run = (change: Change, action: () => Promise<ApiResponse<unknown>>, done: string) => {
    if (inFlight.current.has(change.id)) return;
    inFlight.current.add(change.id);
    setPendingIds((ids) => [...ids, change.id]);
    startTransition(async () => {
      apply(change);
      const res = await action();
      if (res.success) toast.success(done);
      else toast.error(homeErrorMessage(res));
      inFlight.current.delete(change.id);
      setPendingIds((ids) => ids.filter((id) => id !== change.id));
    });
  };

  const openForm = (target: HomeAddress | "new") => {
    setFormOpening((n) => n + 1);
    setEditing(target);
  };

  const full = addresses.length >= MAX_ADDRESSES;
  const addButton = (
    <Button disabled={full} onClick={() => openForm("new")}>
      <Plus aria-hidden /> Add an address
    </Button>
  );

  return (
    <div className="space-y-4">
      {list.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No saved addresses"
          description="Save your home here and booking takes one tap."
          action={addButton}
        />
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {list.map((a) => {
              const busy = pendingIds.includes(a.id);
              return (
                <li key={a.id} aria-busy={busy} className={cn("rounded-2xl border border-border bg-surface p-4", busy && "opacity-70")}>
                  <div className="flex items-start gap-3">
                    <Home className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                        {a.label}
                        {a.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary-hover">
                            <Check className="size-3" aria-hidden /> Default
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{[a.addressLine, a.area].filter(Boolean).join(", ")}</p>
                      {a.landmark && <p className="text-sm text-muted-foreground">Near {a.landmark}</p>}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!a.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          run({ kind: "default", id: a.id }, () => updateHomeAddress(a.id, { isDefault: true }), `${a.label} is your default`)
                        }
                      >
                        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Star aria-hidden />} Set default
                      </Button>
                    )}
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => openForm(a)}>
                      <Pencil aria-hidden /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      className="text-danger hover:text-danger"
                      onClick={() => setRemoving(a)}
                    >
                      <Trash2 aria-hidden /> Remove
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            {addButton}
            {full && <p className="text-sm text-muted-foreground">That&apos;s the most you can save. Remove one to add another.</p>}
          </div>
        </>
      )}

      <AddressForm key={formOpening} target={editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Remove ${removing?.label ?? "this address"}?`}
        description="Visits you've already booked keep their own copy."
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (!removing) return;
          const { id, label } = removing;
          setRemoving(null);
          run({ kind: "remove", id }, () => deleteHomeAddress(id), `${label} removed`);
        }}
      />
    </div>
  );
}

function AddressForm({ target, onClose }: { target: HomeAddress | "new" | null; onClose: () => void }) {
  const saved = target && target !== "new" ? target : null;
  const [label, setLabel] = useState(saved?.label ?? "");
  const [addressLine, setAddressLine] = useState(saved?.addressLine ?? "");
  const [area, setArea] = useState(saved?.area ?? "");
  const [landmark, setLandmark] = useState(saved?.landmark ?? "");
  const [pin, setPin] = useState(saved ? { lat: saved.latitude, lng: saved.longitude } : null);
  const [pending, setPending] = useState(false);

  const problem = !pin
    ? "Place the pin on your home."
    : !label.trim()
      ? "Name this address, e.g. Home."
      : addressLine.trim().length < 5
        ? "Add your house, flat and floor."
        : null;

  const save = async () => {
    if (!pin) return;
    setPending(true);
    const input = {
      label: label.trim(),
      addressLine: addressLine.trim(),
      area: area.trim() || null,
      landmark: landmark.trim() || null,
      latitude: pin.lat,
      longitude: pin.lng,
    };
    const res = saved ? await updateHomeAddress(saved.id, input) : await createHomeAddress(input);
    setPending(false);
    if (!res.success) return void toast.error(homeErrorMessage(res));
    toast.success(saved ? "Address updated" : "Address saved");
    onClose();
  };

  return (
    <ResponsiveDialog
      open={target !== null}
      onOpenChange={(o) => !o && onClose()}
      title={saved ? `Edit ${saved.label}` : "Add an address"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button disabled={!!problem || pending} onClick={save}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Save address
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* On a phone this is a bottom sheet: dragging the map must move the pin, not the sheet. */}
        <div data-vaul-no-drag>
          <LocationPicker
            place="home"
            value={pin}
            onChange={(lat, lng) => setPin({ lat, lng })}
            onAddressSuggestion={(place) => setArea(place.area ?? place.city ?? area)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hs-addr-label">Name</Label>
            <Input id="hs-addr-label" value={label} maxLength={30} placeholder="Home" onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hs-addr-area">Area</Label>
            <Input id="hs-addr-area" value={area} maxLength={80} placeholder="Dhanmondi" onChange={(e) => setArea(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="hs-addr-line">House, flat, floor &amp; road</Label>
            <Input
              id="hs-addr-line"
              value={addressLine}
              maxLength={200}
              autoComplete="street-address"
              placeholder="House 12, Flat 4B, 4th floor, Road 7"
              onChange={(e) => setAddressLine(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="hs-addr-landmark">Landmark (optional)</Label>
            <Input
              id="hs-addr-landmark"
              value={landmark}
              maxLength={120}
              placeholder="Opposite the mosque"
              onChange={(e) => setLandmark(e.target.value)}
            />
          </div>
        </div>
        {problem && <p className="text-sm text-muted-foreground">{problem}</p>}
      </div>
    </ResponsiveDialog>
  );
}
