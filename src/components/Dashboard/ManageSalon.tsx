/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Users,
  Clock,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
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

type StaffItem = {
  id: string;
  speciality: string;
  experience: number;
  status: string;
  bio?: string;
  user: {
    name: string;
    email?: string;
    profilePhoto: string | null;
  };
};

type Salon = {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  country?: string;
  images: string[];
  operatingHours: OperatingHours;
  status: string;
  rating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
  staff: StaffItem[];
};

type SalonResponse = {
  success: boolean;
  message: string;
  data: Salon;
};

export default function ManageSalon({
  salonResponse,
}: {
  salonResponse: SalonResponse;
}) {
  const salon = salonResponse?.data;

  const dummyImage =
    "https://i.ibb.co/jZWzbYnM/lindsay-cash-Md-Dha-Fsn-CQ-unsplash.jpg";

  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [newImageUrl, setNewImageUrl] = React.useState("");

  const [form, setForm] = React.useState<Salon | null>(salon ?? null);

  React.useEffect(() => {
    setForm(salon ?? null);
  }, [salon?.id]);

  if (!form) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-10 text-center text-muted-foreground">
          No salon found.
        </CardContent>
      </Card>
    );
  }

  /* ---------------- Helpers ---------------- */

  const update = (key: keyof Salon, value: any) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const getSalonStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "ACTIVE":
        return <Badge className="bg-sage text-white">✅ Active</Badge>;
      case "PENDING_APPROVAL":
        return (
          <Badge className="bg-gold text-primary-foreground">
            ⏳ Pending Approval
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">❌ Rejected</Badge>;
      case "SUSPENDED":
        return <Badge variant="destructive">🚫 Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  const toggleClosed = (day: keyof OperatingHours) => {
    setForm((prev) => {
      if (!prev) return prev;

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

  const updateHours = (
    day: keyof OperatingHours,
    key: "open" | "close",
    value: string,
  ) => {
    setForm((prev) => {
      if (!prev) return prev;

      const existing = prev.operatingHours?.[day] || {
        open: "09:00",
        close: "21:00",
      };

      return {
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [day]: {
            ...existing,
            [key]: value,
          },
        },
      };
    });
  };

  const addImage = () => {
    if (!newImageUrl.trim()) return;

    const url = newImageUrl.trim();
    if (form.images?.includes(url)) return;

    update("images", [...(form.images || []), url]);
    setNewImageUrl("");
  };

  const removeImage = (url: string) => {
    update(
      "images",
      (form.images || []).filter((u) => u !== url),
    );
  };

  const handleCancel = () => {
    setForm(salon);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // ✅ HERE: call your update salon API
      // Example:
      // await updateSalon(form.id, {
      //   name: form.name,
      //   description: form.description,
      //   phone: form.phone,
      //   email: form.email,
      //   website: form.website,
      //   address: form.address,
      //   city: form.city,
      //   state: form.state,
      //   zipCode: form.zipCode,
      //   images: form.images,
      //   operatingHours: form.operatingHours,
      // });

      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-8">
      {/* ✅ Header */}
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">Manage Salon</h1>
          <p className="text-muted-foreground mt-1">
            Update your salon details, working hours, and images
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {getSalonStatusBadge(form.status)}
          <Badge variant="secondary" className="text-xs">
            ID: {form.id.slice(0, 10)}...
          </Badge>

          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-sage hover:opacity-90 text-white"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Salon
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-sage hover:opacity-90 text-white"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ✅ Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Rating"
          value={`${form.rating || 0}`}
          icon={<Star className="h-5 w-5 text-gold" />}
          sub={`${form.totalReviews || 0} reviews`}
        />
        <StatCard
          label="Staff"
          value={`${form.staff?.length || 0}`}
          icon={<Users className="h-5 w-5 text-primary" />}
          sub="Total members"
        />
        <StatCard
          label="Status"
          value={form.status === "PENDING_APPROVAL" ? "Pending" : "Active"}
          icon={<Clock className="h-5 w-5 text-primary" />}
          sub="Salon approval"
        />
        <StatCard
          label="Images"
          value={`${form.images?.length || 0}`}
          icon={<Building2 className="h-5 w-5 text-primary" />}
          sub="Gallery count"
        />
      </div>

      {/* ✅ Main Layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* LEFT: Editable Form */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3"
        >
          <Card className="shadow-card">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Salon Information
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="p-5 space-y-6">
                  {/* Basic */}
                  <div className="space-y-3">
                    <SectionTitle title="Basic Details" />
                    <div className="grid md:grid-cols-2 gap-4">
                      <Field
                        icon={<Building2 className="h-4 w-4 text-primary" />}
                        label="Salon Name"
                      >
                        <Input
                          value={form.name}
                          disabled={!isEditing}
                          onChange={(e) => update("name", e.target.value)}
                          placeholder="Salon name"
                        />
                      </Field>

                      <Field
                        icon={<Globe className="h-4 w-4 text-primary" />}
                        label="Website"
                      >
                        <Input
                          value={form.website || ""}
                          disabled={!isEditing}
                          onChange={(e) => update("website", e.target.value)}
                          placeholder="https://your-salon.com"
                        />
                      </Field>

                      <div className="md:col-span-2">
                        <Field label="Description">
                          <Textarea
                            value={form.description || ""}
                            disabled={!isEditing}
                            onChange={(e) =>
                              update("description", e.target.value)
                            }
                            placeholder="Short description..."
                            className="min-h-[100px]"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact */}
                  <div className="space-y-3">
                    <SectionTitle title="Contact Details" />
                    <div className="grid md:grid-cols-2 gap-4">
                      <Field
                        icon={<Phone className="h-4 w-4 text-primary" />}
                        label="Phone"
                      >
                        <Input
                          value={form.phone}
                          disabled={!isEditing}
                          onChange={(e) => update("phone", e.target.value)}
                          placeholder="+8801XXXXXXXXX"
                        />
                      </Field>

                      <Field
                        icon={<Mail className="h-4 w-4 text-primary" />}
                        label="Email"
                      >
                        <Input
                          value={form.email}
                          disabled={!isEditing}
                          onChange={(e) => update("email", e.target.value)}
                          placeholder="info@salon.com"
                        />
                      </Field>
                    </div>
                  </div>

                  <Separator />

                  {/* Location */}
                  <div className="space-y-3">
                    <SectionTitle title="Location" />
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Field
                          icon={<MapPin className="h-4 w-4 text-primary" />}
                          label="Address"
                        >
                          <Input
                            value={form.address}
                            disabled={!isEditing}
                            onChange={(e) => update("address", e.target.value)}
                            placeholder="House, Road, Area"
                          />
                        </Field>
                      </div>

                      <Field label="City">
                        <Input
                          value={form.city}
                          disabled={!isEditing}
                          onChange={(e) => update("city", e.target.value)}
                          placeholder="Dhaka"
                        />
                      </Field>

                      <Field label="State/Division">
                        <Input
                          value={form.state}
                          disabled={!isEditing}
                          onChange={(e) => update("state", e.target.value)}
                          placeholder="Dhaka Division"
                        />
                      </Field>

                      <Field label="Zip Code">
                        <Input
                          value={form.zipCode}
                          disabled={!isEditing}
                          onChange={(e) => update("zipCode", e.target.value)}
                          placeholder="1212"
                        />
                      </Field>
                    </div>
                  </div>

                  <Separator />

                  {/* Hours */}
                  <div className="space-y-3">
                    <SectionTitle title="Operating Hours" />
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                      {daysOrder.map((day) => {
                        const isOpen = !!form.operatingHours?.[day];
                        const openTime =
                          form.operatingHours?.[day]?.open || "09:00";
                        const closeTime =
                          form.operatingHours?.[day]?.close || "21:00";

                        return (
                          <div
                            key={day}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border bg-card p-4"
                          >
                            <div className="flex items-center justify-between md:justify-start gap-3">
                              <p className="font-medium">
                                {dayLabel[String(day)]}
                              </p>
                              {isOpen ? (
                                <Badge className="bg-sage text-white">
                                  Open
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Closed</Badge>
                              )}
                            </div>

                            <div className="flex flex-col md:flex-row gap-2 md:items-center">
                              <div className="flex gap-2">
                                <Input
                                  type="time"
                                  disabled={!isEditing || !isOpen}
                                  value={openTime}
                                  onChange={(e) =>
                                    updateHours(day, "open", e.target.value)
                                  }
                                  className="w-[140px]"
                                />
                                <Input
                                  type="time"
                                  disabled={!isEditing || !isOpen}
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
                                disabled={!isEditing}
                                onClick={() => toggleClosed(day)}
                                className="md:w-[110px]"
                              >
                                {isOpen ? "Set Closed" : "Set Open"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* RIGHT: Preview + Images + Staff */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <div className="lg:sticky lg:top-6 h-auto lg:h-[calc(100vh-120px)]">
            <Card className="shadow-card h-full flex flex-col">
              <CardHeader className="shrink-0 border-b">
                <CardTitle className="flex items-center justify-between">
                  Salon Overview
                  {getSalonStatusBadge(form.status)}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="px-5 py-4 space-y-6">
                    {/* Image Preview */}
                    <div className="rounded-2xl overflow-hidden border">
                      <Image
                        src={form.images?.[0] || dummyImage}
                        alt={form.name}
                        width={600}
                        height={340}
                        className="h-[200px] w-full object-cover"
                      />
                    </div>

                    {/* Quick Info */}
                    <div className="space-y-3">
                      <MiniInfo
                        icon={<Building2 className="h-4 w-4 text-primary" />}
                        title="Salon Name"
                        value={form.name}
                      />
                      <MiniInfo
                        icon={<MapPin className="h-4 w-4 text-primary" />}
                        title="Address"
                        value={`${form.address}, ${form.city}, ${form.state} - ${form.zipCode}`}
                      />
                      <MiniInfo
                        icon={<Phone className="h-4 w-4 text-primary" />}
                        title="Phone"
                        value={form.phone}
                      />
                      <MiniInfo
                        icon={<Mail className="h-4 w-4 text-primary" />}
                        title="Email"
                        value={form.email}
                      />
                    </div>

                    <Separator />

                    {/* Images Manager */}
                    <div className="space-y-3">
                      <p className="font-semibold">Salon Images</p>

                      <div className="flex gap-2">
                        <Input
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="Paste image url..."
                          disabled={!isEditing}
                        />
                        <Button
                          type="button"
                          onClick={addImage}
                          disabled={!isEditing}
                          className="bg-sage hover:opacity-90 text-white"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {form.images?.length ? (
                        <div className="space-y-2">
                          {form.images.map((url) => (
                            <div
                              key={url}
                              className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2"
                            >
                              <p className="text-xs text-muted-foreground break-all">
                                {url}
                              </p>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={!isEditing}
                                className="text-destructive"
                                onClick={() => removeImage(url)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No images added.
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Staff Members */}
                    <div className="space-y-3">
                      <p className="font-semibold">Staff Members</p>

                      {form.staff?.length ? (
                        <div className="space-y-3">
                          {form.staff.map((st) => (
                            <div
                              key={st.id}
                              className="rounded-xl border bg-card p-3 shadow-soft"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <Image
                                    width={40}
                                    height={40}
                                    src={st.user.profilePhoto || dummyImage}
                                    alt={st.user.name}
                                    className="h-10 w-10 rounded-full object-cover border"
                                  />
                                  <div>
                                    <p className="font-semibold leading-none">
                                      {st.user.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {st.speciality || "No speciality"}
                                    </p>
                                  </div>
                                </div>

                                <Badge variant="secondary" className="text-xs">
                                  {st.status}
                                </Badge>
                              </div>

                              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                <div className="rounded-lg bg-muted/40 p-2">
                                  <p className="text-xs text-muted-foreground">
                                    Experience
                                  </p>
                                  <p className="font-medium">
                                    {st.experience} years
                                  </p>
                                </div>

                                <div className="rounded-lg bg-muted/40 p-2">
                                  <p className="text-xs text-muted-foreground">
                                    Bio
                                  </p>
                                  <p className="font-medium line-clamp-2">
                                    {st.bio || "No bio added"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No staff added yet.
                        </p>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ---------------- UI Helpers ---------------- */

function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card className="shadow-soft">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub ? (
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          ) : null}
        </div>
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

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

function MiniInfo({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}
