/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useActionState, useEffect } from "react";
import { motion } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import {
  Plus,
  X,
  Globe,
  MapPin,
  Phone,
  Mail,
  ImageIcon,
  Clock,
  Building2,
} from "lucide-react";
import { createSalon } from "@/services/salon/createSalon";
import { toast } from "sonner";
import { BANGLADESH_LOCATIONS } from "@/constants/bangladesh-locations";

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

export default function AddSalonModal({
  open,
  setOpen,
  onCreate,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onCreate: (payload: AddSalonPayload) => Promise<void> | void;
}) {
  // ✅ Hook Server Action
  const [state, formAction, isPending] = useActionState(createSalon, null);

  console.log(state);
  // ✅ Client State (Kept for UI logic: Validations, Image List, Hours Toggling)
  const [form, setForm] = React.useState<AddSalonPayload>({
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

  const [imageUrl, setImageUrl] = React.useState("");

  const processedStateRef = React.useRef(state);

  // ✅ Watch for Server Action Success
  useEffect(() => {
    if (!state || state === processedStateRef.current) return;
    processedStateRef.current = state;

    if (state.success) {
      toast.success(state.message || "Salon Created Successfully");
      onCreate(state.data); // Pass data back to parent if needed
      setOpen(false);
      // Reset form (defer to avoid cascading renders)
      setTimeout(() => {
        setForm({
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
        setImageUrl("");
      }, 0);
    } else {
      toast.error(state.message || "Failed to create Salon");
    }
  }, [state, setOpen, onCreate]);

  const update = (key: keyof AddSalonPayload, value: any) => {
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

  const toggleClosed = (day: keyof OperatingHours) => {
    setForm((prev) => {
      const current = prev.operatingHours?.[day];
      if (current) {
        const clone = { ...(prev.operatingHours || {}) };
        delete clone[day];
        return { ...prev, operatingHours: clone };
      }
      return {
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [day]: { open: "09:00", close: "21:00" },
        },
      };
    });
  };

  const addImage = () => {
    if (!imageUrl.trim()) return;
    if (form.images.includes(imageUrl.trim())) return;
    update("images", [...form.images, imageUrl.trim()]);
    setImageUrl("");
  };

  const removeImage = (url: string) => {
    update(
      "images",
      form.images.filter((u) => u !== url),
    );
  };

  const isValid =
    form.name.trim() &&
    form.phone.trim() &&
    form.email.trim() &&
    form.address.trim() &&
    form.division.trim() &&
    form.district.trim() &&
    form.area.trim() &&
    form.country.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[100vw] sm:w-[95vw] md:w-[92vw] lg:w-[1100px] xl:w-[1200px] max-w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-[1200px] p-0 overflow-hidden rounded-none sm:rounded-2xl flex flex-col ">
        {/* ✅ WRAPPER FORM */}
        <form
          action={formAction}
          className="flex flex-col h-full overflow-hidden"
        >
          {/* ✅ HIDDEN INPUTS for Complex Data */}
          <input
            type="hidden"
            name="images"
            value={JSON.stringify(form.images)}
          />
          <input
            type="hidden"
            name="operatingHours"
            value={JSON.stringify(form.operatingHours)}
          />

          {/* Header */}
          <div className="p-6 pb-4 border-b bg-gradient-card shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-primary" />
                Add New Salon
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Fill in salon information carefully. This will be reviewed by
                admin.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SectionTitle title="Basic Information" />
              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  icon={<Building2 className="h-4 w-4 text-primary" />}
                  label="Salon Name *"
                >
                  <Input
                    name="name" // ✅ Added name
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="e.g. Glamour Salon & Spa"
                  />
                </Field>

                <Field
                  icon={<Globe className="h-4 w-4 text-primary" />}
                  label="Website"
                >
                  <Input
                    name="website" // ✅ Added name
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                    placeholder="https://your-salon.com"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Description">
                    <Textarea
                      name="description" // ✅ Added name
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      placeholder="Short description about your salon..."
                      className="min-h-[90px]"
                    />
                  </Field>
                </div>
              </div>
            </motion.div>

            <Separator />

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SectionTitle title="Contact Details" />
              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  icon={<Phone className="h-4 w-4 text-primary" />}
                  label="Phone *"
                >
                  <Input
                    name="phone" // ✅ Added name
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
                    name="email" // ✅ Added name
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="info@salon.com"
                  />
                </Field>
              </div>
            </motion.div>

            <Separator />

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SectionTitle title="Location" />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Field
                    icon={<MapPin className="h-4 w-4 text-primary" />}
                    label="Address *"
                  >
                    <Input
                      name="address" // ✅ Added name
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                      placeholder="House, Road, Area"
                    />
                  </Field>
                </div>

                <Field label="Division *">
                  <select
                    name="division"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.district}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        district: e.target.value,
                        area: "", // reset area when district changes
                      }));
                    }}
                  >
                    <option value="">Select District</option>
                    {BANGLADESH_LOCATIONS.find(
                      (l) => l.division === form.division,
                    )?.districts.map((d) => (
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.area}
                    onChange={(e) => update("area", e.target.value)}
                  >
                    <option value="">Select Area</option>
                    {BANGLADESH_LOCATIONS.find(
                      (l) => l.division === form.division,
                    )
                      ?.districts.find((d) => d.district === form.district)
                      ?.areas.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                  </select>
                </Field>

                {/* Hidden fields to satisfy schema if needed */}
                <input type="hidden" name="city" value={form.city} />
                <input type="hidden" name="state" value={form.division} />
                <input type="hidden" name="country" value={form.country} />
                <input type="hidden" name="zipCode" value="0000" />
              </div>
            </motion.div>

            <Separator />

            {/* Images */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SectionTitle title="Salon Images" />

              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      // Note: No 'name' here, this input is purely for adding to the array
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); // Prevent form submission on Enter
                          addImage();
                        }
                      }}
                      placeholder="Paste image url and click Add"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addImage}
                    variant="outline"
                    className="md:w-32"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>

                {form.images.length === 0 ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    No images added yet. You can still submit salon without
                    images.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.images.map((url) => (
                      <div
                        key={url}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2"
                      >
                        <p className="text-xs text-muted-foreground break-all">
                          {url}
                        </p>
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button" // Important: prevents submit
                          className="text-destructive"
                          onClick={() => removeImage(url)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            <Separator />

            {/* Operating Hours */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SectionTitle title="Operating Hours" />
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                {daysOrder.map((day) => {
                  const isOpen = !!form.operatingHours?.[day];
                  const openTime = form.operatingHours?.[day]?.open || "09:00";
                  const closeTime =
                    form.operatingHours?.[day]?.close || "21:00";

                  return (
                    <div
                      key={day}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border bg-card p-4"
                    >
                      <div className="flex items-center justify-between md:justify-start gap-3">
                        <p className="font-medium">{dayLabel[String(day)]}</p>
                        {isOpen ? (
                          <Badge className="bg-sage text-white">Open</Badge>
                        ) : (
                          <Badge variant="secondary">Closed</Badge>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row gap-2 md:items-center">
                        <div className="flex gap-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <Input
                              type="time"
                              disabled={!isOpen}
                              value={openTime}
                              onChange={(e) =>
                                updateHours(day, "open", e.target.value)
                              }
                              className="w-[140px]"
                            />
                          </div>

                          <Input
                            type="time"
                            disabled={!isOpen}
                            value={closeTime}
                            onChange={(e) =>
                              updateHours(day, "close", e.target.value)
                            }
                            className="w-[140px]"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => toggleClosed(day)}
                          className="md:w-[110px]"
                        >
                          {isOpen ? "Set Closed" : "Set Open"}
                        </Button>
                      </div>
                    </div>
                  );
                })}

                <p className="text-xs text-muted-foreground mt-2">
                  Tip: If salon is closed on a day, click <b>Set Closed</b> so
                  backend will store it correctly.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-background shrink-0">
            <DialogFooter className="flex flex-col md:flex-row gap-3 md:justify-between">
              <p className="text-xs text-muted-foreground">
                Fields marked with <b>*</b> are required.
              </p>
              {/* Error Message Display if Server Action Fails */}
              {!state?.success && state?.message && (
                <p className="text-xs text-red-500">{state.message}</p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit" // ✅ Changed to submit
                  disabled={!isValid || isPending} // ✅ Use isPending from useActionState
                  className="bg-sage hover:opacity-90 text-white"
                >
                  {isPending ? "Saving..." : "Save Salon"}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Small UI Helpers ---------------- */

function SectionTitle({ title }: { title: string }) {
  return (
    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-primary" />
      {title}
    </p>
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
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-2">
        {icon}
        {label}
      </p>
      {children}
    </div>
  );
}
