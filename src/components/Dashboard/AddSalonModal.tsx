"use client";

import React, { useActionState, useId } from "react";

import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  Plus,
  X,
  Globe,
  MapPin,
  Phone,
  Mail,
  ImageIcon,
  Building2,
} from "lucide-react";
import { createSalon } from "@/services/salon/createSalon";
import { searchPlaces } from "@/services/geo/searchPlaces";
import { toast } from "sonner";
import { BANGLADESH_LOCATIONS } from "@/constants/bangladesh-locations";
import LocationPicker from "@/components/Map/LocationPicker";
import type { ApiResponse, GeoPlace, Salon } from "@/lib/api-types";

/* ---------------- Types ---------------- */

type DayHours = {
  open: string;
  close: string;
};

type OperatingHours = Partial<
  Record<
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday",
    DayHours
  >
>;

export type AddSalonPayload = {
  name: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  division: string;
  district: string;
  area: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  images: string[];
  operatingHours: OperatingHours;
};

const daysOrder: (keyof OperatingHours)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const dayLabel: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const defaultHours: OperatingHours = {
  monday: { open: "09:00", close: "21:00" },
  tuesday: { open: "09:00", close: "21:00" },
  wednesday: { open: "09:00", close: "21:00" },
  thursday: { open: "09:00", close: "21:00" },
  friday: { open: "09:00", close: "21:00" },
  saturday: { open: "10:00", close: "20:00" },
  sunday: { open: "10:00", close: "18:00" },
};

const emptyForm = (): AddSalonPayload => ({
  name: "",
  description: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  division: "",
  district: "",
  area: "",
  city: "",
  state: "",
  country: "Bangladesh",
  zipCode: "",
  images: [],
  operatingHours: defaultHours,
});

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function AddSalonModal({
  open,
  setOpen,
  onCreate,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  /** The list refreshes itself: the create action sends the updated page back. */
  onCreate?: (payload: AddSalonPayload) => Promise<void> | void;
}) {
  const formId = useId();
  // Client state for validation, the image list and the hours toggles.
  const [form, setForm] = React.useState<AddSalonPayload>(emptyForm);

  const [imageUrl, setImageUrl] = React.useState("");

  // Map pin (required) and where to show the map before the pin is placed.
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [mapFocus, setMapFocus] = React.useState<
    { lat: number; lng: number; label: string } | undefined
  >();
  const mapFocusRequest = React.useRef(0);

  // Closes only once the API has answered; a failure keeps the form as typed.
  const [state, formAction, isPending] = useActionState(
    async (
      previous: ApiResponse<Salon> | null,
      formData: FormData,
    ): Promise<ApiResponse<Salon>> => {
      const result = await createSalon(previous, formData);
      showResultToast(result, "Salon created", "Failed to create the salon.");
      if (result.success) {
        await onCreate?.(form);
        setOpen(false);
        setForm(emptyForm());
        setImageUrl("");
        setCoords(null);
        setMapFocus(undefined);
      }
      return result;
    },
    null,
  );

  const update = <K extends keyof AddSalonPayload>(
    key: K,
    value: AddSalonPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateHours = (
    day: keyof OperatingHours,
    key: "open" | "close",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          open: prev.operatingHours?.[day]?.open ?? "09:00",
          close: prev.operatingHours?.[day]?.close ?? "21:00",
          [key]: value,
        },
      },
    }));
  };

  // A closed day is left out of operatingHours, which is how the API stores it.
  const setDayOpen = (day: keyof OperatingHours, isOpen: boolean) => {
    setForm((prev) => {
      const clone = { ...(prev.operatingHours || {}) };
      if (isOpen) clone[day] = defaultHours[day] ?? { open: "09:00", close: "21:00" };
      else delete clone[day];
      return { ...prev, operatingHours: clone };
    });
  };

  const addImage = () => {
    const url = imageUrl.trim();
    if (!url || form.images.includes(url)) return;
    update("images", [...form.images, url]);
    setImageUrl("");
  };

  const removeImage = (url: string) => {
    update(
      "images",
      form.images.filter((u) => u !== url),
    );
  };

  // Owner picked a district/area: show the map there so they only have to
  // nudge the pin. The picker ignores this once a pin is placed.
  const focusMapOn = async (district: string, area: string) => {
    const place = area || district;
    if (!place || coords) return;
    const request = ++mapFocusRequest.current;
    const res = await searchPlaces(area ? `${area}, ${district}` : district);
    const first = res.success ? res.data?.[0] : undefined;
    if (request !== mapFocusRequest.current || !first) return;
    setMapFocus({ lat: first.lat, lng: first.lng, label: place });
  };

  // [Use this address]: fill the address, and the selects where the names
  // match BANGLADESH_LOCATIONS. Selects that don't match are left alone.
  const applyAddressSuggestion = (place: GeoPlace) => {
    const same = (a?: string, b?: string) =>
      Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());

    const division =
      BANGLADESH_LOCATIONS.find((l) => same(l.division, place.division)) ??
      BANGLADESH_LOCATIONS.find((l) =>
        l.districts.some((d) => same(d.district, place.district)),
      );
    const district = division?.districts.find((d) =>
      same(d.district, place.district),
    );
    const area = district?.areas.find((a) => same(a, place.area));

    setForm((prev) => {
      const next = { ...prev, address: place.label };
      if (division && division.division !== prev.division) {
        next.division = division.division;
        next.city = division.division;
        next.district = "";
        next.area = "";
      }
      if (district && district.district !== next.district) {
        next.district = district.district;
        next.area = "";
      }
      if (area) next.area = area;
      return next;
    });

    toast.success("Address filled in from the map. Please check it.");
  };

  const isValid =
    form.name.trim() &&
    form.phone.trim() &&
    form.email.trim() &&
    form.address.trim() &&
    form.division.trim() &&
    form.district.trim() &&
    form.area.trim() &&
    form.country.trim() &&
    coords;

  const districts =
    BANGLADESH_LOCATIONS.find((l) => l.division === form.division)?.districts ??
    [];
  const areas = districts.find((d) => d.district === form.district)?.areas ?? [];

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !isPending && setOpen(next)}
      title="Add salon"
      description="An admin reviews it before it goes live. Fields marked * are required."
      className="sm:max-w-3xl"
      footer={
        <>
          {!coords && (
            <p className="text-center text-xs text-muted-foreground md:mr-auto md:self-center md:text-left">
              Set your salon&apos;s pin on the map to save.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={!isValid}
            loading={isPending}
          >
            Save salon
          </Button>
        </>
      }
    >
      <form id={formId} action={formAction} className="space-y-8">
        {/* Complex data travels as JSON */}
        <input type="hidden" name="images" value={JSON.stringify(form.images)} />
        <input
          type="hidden"
          name="operatingHours"
          value={JSON.stringify(form.operatingHours)}
        />

        {/* ---- Basics ---- */}
        <FormSection title="Basics">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              icon={<Building2 className="h-4 w-4 text-primary" />}
              label="Salon name *"
            >
              <Input
                name="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. SalonKhuji Salon & Spa"
              />
            </Field>

            <Field
              icon={<Globe className="h-4 w-4 text-primary" />}
              label="Website"
            >
              <Input
                name="website"
                inputMode="url"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://your-salon.com"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Description">
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Short description about your salon..."
                  className="min-h-[90px]"
                />
              </Field>
            </div>
          </div>
        </FormSection>

        {/* ---- Contact ---- */}
        <FormSection title="Contact">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              icon={<Phone className="h-4 w-4 text-primary" />}
              label="Phone *"
            >
              <Input
                name="phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+8801XXXXXXXXX"
              />
            </Field>

            <Field
              icon={<Mail className="h-4 w-4 text-primary" />}
              label="Email *"
            >
              <Input
                name="email"
                type="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="info@salon.com"
              />
            </Field>
          </div>
        </FormSection>

        {/* ---- Hours ---- */}
        <FormSection
          title="Hours"
          description="Switch a day off if the salon is closed that day."
        >
          <ul className="divide-y divide-border rounded-xl border border-border">
            {daysOrder.map((day) => {
              const hours = form.operatingHours?.[day];
              const label = dayLabel[String(day)];
              return (
                <li
                  key={day}
                  className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-6"
                >
                  <div className="flex items-center justify-between gap-3 sm:w-48 sm:shrink-0">
                    <span className="font-medium">{label}</span>
                    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-muted-foreground">
                      <span className="w-12 text-right">
                        {hours ? "Open" : "Closed"}
                      </span>
                      <Switch
                        checked={Boolean(hours)}
                        onCheckedChange={(isOpen) => setDayOpen(day, isOpen)}
                        aria-label={`Open on ${label}`}
                      />
                    </label>
                  </div>

                  {hours ? (
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:flex">
                      <Input
                        type="time"
                        aria-label={`${label} opens`}
                        value={hours.open}
                        onChange={(e) => updateHours(day, "open", e.target.value)}
                        className="sm:w-36"
                      />
                      <span className="text-muted-foreground" aria-hidden="true">
                        –
                      </span>
                      <Input
                        type="time"
                        aria-label={`${label} closes`}
                        value={hours.close}
                        onChange={(e) => updateHours(day, "close", e.target.value)}
                        className="sm:w-36"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Closed all day</p>
                  )}
                </li>
              );
            })}
          </ul>
        </FormSection>

        {/* ---- Photos ---- */}
        <FormSection
          title="Photos"
          description="Paste image links; the first is the cover. You can save without any."
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                // No `name`: this input only feeds the list below.
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // Enter adds, it doesn't submit
                    addImage();
                  }
                }}
                inputMode="url"
                placeholder="Paste an image URL"
                aria-label="Image URL"
              />
              <Button type="button" onClick={addImage} variant="outline">
                <Plus />
                Add
              </Button>
            </div>

            {form.images.length === 0 ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                No photos added yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {form.images.map((url) => (
                  <li
                    key={url}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <p
                      className="min-w-0 truncate text-xs text-muted-foreground"
                      title={url}
                    >
                      {url}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      type="button" // not a submit
                      className="text-danger"
                      aria-label="Remove photo"
                      onClick={() => removeImage(url)}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </FormSection>

        {/* ---- Location ---- */}
        <FormSection title="Location">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-3">
              <Field
                icon={<MapPin className="h-4 w-4 text-primary" />}
                label="Address *"
              >
                <Input
                  name="address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="House, Road, Area"
                />
              </Field>
            </div>

            <Field label="Division *">
              <select
                name="division"
                className={selectClass}
                value={form.division}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    division: e.target.value,
                    district: "", // reset district and area when division changes
                    area: "",
                    city: e.target.value, // keep city synced for backward compatibility
                  }));
                }}
              >
                <option value="">Select Division</option>
                {BANGLADESH_LOCATIONS.map((loc) => (
                  <option key={loc.division} value={loc.division}>
                    {loc.division}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="District *">
              <select
                name="district"
                disabled={!form.division}
                className={selectClass}
                value={form.district}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    district: e.target.value,
                    area: "", // reset area when district changes
                  }));
                  focusMapOn(e.target.value, "");
                }}
              >
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d.district} value={d.district}>
                    {d.district}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Area *">
              <select
                name="area"
                disabled={!form.district}
                className={selectClass}
                value={form.area}
                onChange={(e) => {
                  update("area", e.target.value);
                  focusMapOn(form.district, e.target.value);
                }}
              >
                <option value="">Select Area</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>

            {/* Panning the map must not drag the bottom sheet. */}
            <div className="space-y-2 md:col-span-3" data-vaul-no-drag>
              <p className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                Location on map *
              </p>
              {/* Also renders the latitude/longitude hidden inputs. */}
              <LocationPicker
                value={coords}
                fallbackCenter={mapFocus}
                onChange={(lat, lng) => setCoords({ lat, lng })}
                onAddressSuggestion={applyAddressSuggestion}
              />
              {!coords && (
                <p className="text-xs font-medium text-warning">
                  A map pin is required. Drag it, tap the map, search, or use
                  &quot;I&apos;m at the salon now&quot;.
                </p>
              )}
            </div>

            {/* Fields the API schema still expects */}
            <input type="hidden" name="city" value={form.city} />
            <input type="hidden" name="state" value={form.division} />
            <input type="hidden" name="country" value={form.country} />
            <input type="hidden" name="zipCode" value="0000" />
          </div>
        </FormSection>

        {state?.success === false && state.message && (
          <p className="text-sm text-danger" role="alert">
            {state.message}
          </p>
        )}
      </form>
    </ResponsiveDialog>
  );
}

/* ---------------- Small UI Helpers ---------------- */

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
