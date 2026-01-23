/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [form, setForm] = React.useState<AddSalonPayload>({
    name: "",
    description: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "Bangladesh",
    zipCode: "",
    images: [],
    operatingHours: defaultHours,
  });

  const [imageUrl, setImageUrl] = React.useState("");

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

      // if exists -> remove = Closed
      if (current) {
        const clone = { ...(prev.operatingHours || {}) };
        delete clone[day];
        return { ...prev, operatingHours: clone };
      }

      // if removed -> default open/close
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

    // ✅ avoid duplicates
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
    form.city.trim() &&
    form.state.trim() &&
    form.country.trim() &&
    form.zipCode.trim();

  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      setIsSubmitting(true);

      // ✅ payload EXACT as backend expects
      const payload: AddSalonPayload = {
        name: form.name.trim(),
        description: form.description.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        zipCode: form.zipCode.trim(),
        images: form.images,
        operatingHours: form.operatingHours,
      };

      await onCreate(payload);

      // reset after success
      setOpen(false);
      setForm({
        name: "",
        description: "",
        phone: "",
        email: "",
        website: "",
        address: "",
        city: "",
        state: "",
        country: "Bangladesh",
        zipCode: "",
        images: [],
        operatingHours: defaultHours,
      });
      setImageUrl("");
    } finally {
      setIsSubmitting(false);
    }
  };
  //---------------- Render ---------------- //
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[100vw] sm:w-[95vw] md:w-[92vw] lg:w-[1100px] xl:w-[1200px] max-w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-[1200px] p-0 overflow-hidden rounded-none sm:rounded-2xl flex flex-col ">
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
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  placeholder="https://your-salon.com"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Description">
                  <Textarea
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
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="House, Road, Area"
                  />
                </Field>
              </div>

              <Field label="City *">
                <Input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Dhaka"
                />
              </Field>

              <Field label="State/Division *">
                <Input
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  placeholder="Dhaka Division"
                />
              </Field>

              <Field label="Country *">
                <Input
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  placeholder="Bangladesh"
                />
              </Field>

              <Field label="Zip Code *">
                <Input
                  value={form.zipCode}
                  onChange={(e) => update("zipCode", e.target.value)}
                  placeholder="1212"
                />
              </Field>
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
                const closeTime = form.operatingHours?.[day]?.close || "21:00";

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

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="bg-sage hover:opacity-90 text-white"
              >
                {isSubmitting ? "Saving..." : "Save Salon"}
              </Button>
            </div>
          </DialogFooter>
        </div>
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
