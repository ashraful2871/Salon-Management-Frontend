"use client";

import React, { useId, useOptimistic, useState, useTransition } from "react";
import {
  MapPin,
  MonitorSmartphone,
  Scissors,
  Star,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import SafeImage from "@/components/Shared/SafeImage";
import { StatCard } from "@/components/Shared/StatCard";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { SaveBar } from "@/components/Shared/SaveBar";
import { showResultToast } from "@/components/Shared/showResultToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OperatingHours, Salon, StaffMember } from "@/lib/api-types";
import { formatRating } from "@/lib/rating";
import { updateSalon } from "@/services/salon/updateSalon";
import { deleteStaff } from "@/services/staff/deleteStaff";
import AddStaffModal from "./AddStaffModal";
import AddCounterModal from "./AddCounterModal";
import SalonLocationTab from "./SalonLocationTab";

/* ---------------- Types ---------------- */

type SalonCounter = {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: string;
};

type ManagedSalon = Salon & { counters?: SalonCounter[] };

type Day = keyof OperatingHours;

const DAYS: Day[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABEL: Record<Day, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const TABS = ["details", "hours", "staff", "counters", "location"] as const;
type Tab = (typeof TABS)[number];

// `?tab=location` comes from the "needs an exact map pin" notice; `overview`
// and `edit` are the tabs this page had before Details and Hours split.
const toTab = (value?: string): Tab =>
  TABS.includes(value as Tab) ? (value as Tab) : "details";

/* ---------------- Form sections ---------------- */

// What PATCH /salons/:id takes besides the hours. `updateSalon` resends every
// one of them, so a section's save sends the other section's saved values.
const DETAIL_KEYS = [
  "name",
  "website",
  "description",
  "phone",
  "email",
  "address",
  "city",
  "state",
  "zipCode",
] as const;
type Details = Record<(typeof DETAIL_KEYS)[number], string>;

const pickDetails = (salon: Partial<ManagedSalon>): Details =>
  Object.fromEntries(
    DETAIL_KEYS.map((key) => [key, String(salon[key] ?? "")]),
  ) as Details;

// Days in week order and nothing but open/close, so two copies compare equal.
const pickHours = (hours?: OperatingHours | null): OperatingHours => {
  const out: OperatingHours = {};
  for (const day of DAYS) {
    const h = hours?.[day];
    if (h) out[day] = { open: h.open, close: h.close };
  }
  return out;
};

const sameDetails = (a: Details, b: Details) =>
  DETAIL_KEYS.every((key) => a[key] === b[key]);
const sameHours = (a: OperatingHours, b: OperatingHours) =>
  JSON.stringify(pickHours(a)) === JSON.stringify(pickHours(b));

const DEFAULT_DAY = { open: "09:00", close: "21:00" };

/* ---------------- Main Component ---------------- */

export default function ManageSalon({
  initialData,
  initialTab,
}: {
  initialData: ManagedSalon;
  initialTab?: string;
}) {
  const salonId = initialData.id;
  const fieldId = useId();
  const field = (name: string) => `${fieldId}-${name}`;

  const [tab, setTab] = useState<Tab>(() => toTab(initialTab));
  const [openAddStaff, setOpenAddStaff] = useState(false);
  const [openAddCounter, setOpenAddCounter] = useState(false);

  // What the server has, and what the owner has typed on top of it.
  const [saved, setSaved] = useState(() => ({
    details: pickDetails(initialData),
    hours: pickHours(initialData.operatingHours),
  }));
  const [details, setDetails] = useState(saved.details);
  const [hours, setHours] = useState(saved.hours);

  const detailsDirty = !sameDetails(details, saved.details);
  const hoursDirty = !sameHours(hours, saved.hours);

  // A save (or an add-staff/counter) sends a fresh page back. A section with
  // no unsaved edits takes the server's values; one being edited keeps them.
  const [synced, setSynced] = useState(initialData);
  if (synced !== initialData) {
    setSynced(initialData);
    const server = {
      details: pickDetails(initialData),
      hours: pickHours(initialData.operatingHours),
    };
    if (!detailsDirty) setDetails(server.details);
    if (!hoursDirty) setHours(server.hours);
    setSaved(server);
  }

  const [savingDetails, startSavingDetails] = useTransition();
  const [savingHours, startSavingHours] = useTransition();

  const save = (section: "details" | "hours") => {
    const sentDetails = section === "details" ? details : saved.details;
    const sentHours = section === "hours" ? hours : saved.hours;

    const formData = new FormData();
    formData.set("id", salonId);
    for (const key of DETAIL_KEYS) formData.set(key, sentDetails[key]);
    formData.set("operatingHours", JSON.stringify(sentHours));

    const start = section === "details" ? startSavingDetails : startSavingHours;
    start(async () => {
      const result = await updateSalon(null, formData);
      showResultToast(
        result,
        section === "details" ? "Details saved" : "Hours saved",
        "Could not save. Please check your input and try again.",
      );
      if (!result.success) return;
      // The inputs were locked while saving, so the sent values are current.
      start(() => {
        if (section === "details") {
          setSaved((prev) => ({ ...prev, details: sentDetails }));
        } else {
          setSaved((prev) => ({ ...prev, hours: sentHours }));
        }
      });
    });
  };

  const setDetail = (key: keyof Details, value: string) =>
    setDetails((prev) => ({ ...prev, [key]: value }));

  const setDayOpen = (day: Day, open: boolean) =>
    setHours((prev) => {
      const next = { ...prev };
      if (open) next[day] = saved.hours[day] ?? DEFAULT_DAY;
      else delete next[day];
      return next;
    });

  const setDayTime = (day: Day, key: "open" | "close", value: string) =>
    setHours((prev) => ({
      ...prev,
      [day]: { ...(prev[day] ?? DEFAULT_DAY), [key]: value },
    }));

  const badHours = DAYS.filter((day) => {
    const h = hours[day];
    return h && (!h.open || !h.close || h.open >= h.close);
  });

  /* ---- Staff: removed rows leave at once and come back if the API says no ---- */

  const [staff, removeStaffOptimistic] = useOptimistic(
    initialData.staff ?? [],
    (list: StaffMember[], id: string) => list.filter((m) => m.id !== id),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Kept apart from `confirmOpen`, so the dialog's text stays while it fades.
  const [toRemove, setToRemove] = useState<StaffMember | null>(null);
  const [, startRemoving] = useTransition();

  const askRemove = (member: StaffMember) => {
    setToRemove(member);
    setConfirmOpen(true);
  };

  const removeStaff = () => {
    const member = toRemove;
    if (!member) return;
    setConfirmOpen(false);
    startRemoving(async () => {
      removeStaffOptimistic(member.id);
      const result = await deleteStaff(member.id, salonId);
      showResultToast(
        result,
        `${member.user?.name ?? "Staff member"} removed`,
        "Failed to remove staff.",
      );
    });
  };

  const staffColumns: Column<StaffMember>[] = [
    {
      key: "name",
      header: "Staff member",
      mobile: "primary",
      cell: (m) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-sm font-semibold text-primary-hover">
            {/* No photo: initials, not the salon placeholder. */}
            {m.user?.profilePhoto ? (
              <SafeImage
                src={m.user.profilePhoto}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <span aria-hidden="true">
                {(m.user?.name || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {m.user?.name || "Unnamed staff"}
            </p>
            <p className="truncate text-sm font-normal text-muted-foreground">
              {m.speciality || "No speciality set"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "experience",
      header: "Experience",
      mobile: "hidden",
      cell: (m) =>
        m.experience != null ? (
          <span className="tabular-nums">
            {m.experience} {m.experience === 1 ? "year" : "years"}
          </span>
        ) : null,
    },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (m) => (m.status ? <ToneBadge status={m.status} /> : null),
    },
  ];

  /* ---- Header figures ---- */

  const counters = initialData.counters ?? [];
  const place = [initialData.city, initialData.state].filter(Boolean).join(", ");
  const openDays = DAYS.filter((day) => saved.hours[day]).length;

  return (
    <div className="space-y-6">
      {/* --- Cover --- */}
      <div className="relative h-40 overflow-hidden rounded-2xl bg-muted sm:h-56">
        <SafeImage
          src={initialData.images?.[0]}
          alt=""
          fill
          sizes="(min-width: 1024px) calc(100vw - 20rem), 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        {initialData.status && (
          <div className="absolute left-3 top-3">
            <ToneBadge status={initialData.status} className="shadow-sm" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <h1 className="truncate font-display text-title-lg text-white">
            {saved.details.name || initialData.name}
          </h1>
          {(initialData.address || place) && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{initialData.address || place}</span>
            </p>
          )}
        </div>
      </div>

      {/* --- Figures --- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Rating"
          value={formatRating(initialData.rating)}
          hint={`${(initialData.totalReviews ?? 0).toLocaleString()} reviews`}
          icon={Star}
          tone="warning"
        />
        <StatCard
          label="Services"
          value={initialData.services?.length ?? initialData._count?.services ?? 0}
          icon={Scissors}
          tone="primary"
        />
        <StatCard label="Staff" value={staff.length} icon={Users} tone="info" />
        <StatCard
          label="Counters"
          value={counters.length}
          hint={`Open ${openDays} ${openDays === 1 ? "day" : "days"} a week`}
          icon={MonitorSmartphone}
        />
      </div>

      {/* --- Sections --- */}
      <Tabs value={tab} onValueChange={(value) => setTab(toTab(value))}>
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
          <TabsList className="w-max rounded-full bg-muted p-1 group-data-[orientation=horizontal]/tabs:h-11">
            <PillTab value="details" unsaved={detailsDirty}>
              Details
            </PillTab>
            <PillTab value="hours" unsaved={hoursDirty}>
              Hours
            </PillTab>
            <PillTab value="staff" count={staff.length}>
              Staff
            </PillTab>
            <PillTab value="counters" count={counters.length}>
              Counters
            </PillTab>
            <PillTab value="location">Location</PillTab>
          </TabsList>
        </div>

        {/* ================= DETAILS ================= */}
        <TabsContent value="details" className="mt-4">
          <form
            id={field("details")}
            onSubmit={(e) => {
              e.preventDefault();
              if (detailsDirty) save("details");
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
                <CardDescription>
                  What customers see on your salon page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <fieldset disabled={savingDetails} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField id={field("name")} label="Salon name">
                      <Input
                        id={field("name")}
                        value={details.name}
                        onChange={(e) => setDetail("name", e.target.value)}
                        required
                      />
                    </FormField>
                    <FormField id={field("website")} label="Website">
                      <Input
                        id={field("website")}
                        type="url"
                        inputMode="url"
                        value={details.website}
                        onChange={(e) => setDetail("website", e.target.value)}
                        placeholder="https://..."
                      />
                    </FormField>
                    <FormField
                      id={field("description")}
                      label="Description"
                      className="md:col-span-2"
                    >
                      <Textarea
                        id={field("description")}
                        value={details.description}
                        onChange={(e) => setDetail("description", e.target.value)}
                        className="min-h-28"
                      />
                    </FormField>
                  </div>

                  <div className="grid gap-4 border-t border-border pt-6 md:grid-cols-2">
                    <FormField id={field("phone")} label="Phone">
                      <Input
                        id={field("phone")}
                        type="tel"
                        inputMode="tel"
                        value={details.phone}
                        onChange={(e) => setDetail("phone", e.target.value)}
                      />
                    </FormField>
                    <FormField id={field("email")} label="Email">
                      <Input
                        id={field("email")}
                        type="email"
                        inputMode="email"
                        value={details.email}
                        onChange={(e) => setDetail("email", e.target.value)}
                      />
                    </FormField>
                    <FormField
                      id={field("address")}
                      label="Address"
                      className="md:col-span-2"
                    >
                      <Input
                        id={field("address")}
                        value={details.address}
                        onChange={(e) => setDetail("address", e.target.value)}
                      />
                    </FormField>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:col-span-2">
                      <FormField id={field("city")} label="City">
                        <Input
                          id={field("city")}
                          value={details.city}
                          onChange={(e) => setDetail("city", e.target.value)}
                        />
                      </FormField>
                      <FormField id={field("state")} label="State">
                        <Input
                          id={field("state")}
                          value={details.state}
                          onChange={(e) => setDetail("state", e.target.value)}
                        />
                      </FormField>
                      <FormField id={field("zipCode")} label="Zip code">
                        <Input
                          id={field("zipCode")}
                          inputMode="numeric"
                          value={details.zipCode}
                          onChange={(e) => setDetail("zipCode", e.target.value)}
                        />
                      </FormField>
                    </div>
                  </div>
                </fieldset>

                <SaveBar
                  className="mt-6"
                  show={detailsDirty}
                  pending={savingDetails}
                  form={field("details")}
                  saveLabel="Save details"
                  onDiscard={() => setDetails(saved.details)}
                />
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* ================= HOURS ================= */}
        <TabsContent value="hours" className="mt-4">
          <form
            id={field("hours")}
            onSubmit={(e) => {
              e.preventDefault();
              if (hoursDirty && badHours.length === 0) save("hours");
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Opening hours</CardTitle>
                <CardDescription>
                  Your weekly hours, shown on your salon page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <fieldset disabled={savingHours}>
                  <ul className="divide-y divide-border">
                    {DAYS.map((day) => {
                      const h = hours[day];
                      const bad = badHours.includes(day);
                      return (
                        <li
                          key={day}
                          className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-6"
                        >
                          <div className="flex items-center justify-between gap-3 sm:w-52 sm:shrink-0">
                            <span className="font-medium">{DAY_LABEL[day]}</span>
                            <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-muted-foreground">
                              <span className="w-12 text-right">
                                {h ? "Open" : "Closed"}
                              </span>
                              <Switch
                                checked={Boolean(h)}
                                onCheckedChange={(open) => setDayOpen(day, open)}
                                aria-label={`Open on ${DAY_LABEL[day]}`}
                              />
                            </label>
                          </div>

                          {h ? (
                            <div className="min-w-0 space-y-1">
                              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:flex">
                                <Input
                                  type="time"
                                  aria-label={`${DAY_LABEL[day]} opens`}
                                  aria-invalid={bad || undefined}
                                  value={h.open}
                                  onChange={(e) =>
                                    setDayTime(day, "open", e.target.value)
                                  }
                                  className="sm:w-36"
                                />
                                <span className="text-muted-foreground" aria-hidden="true">
                                  –
                                </span>
                                <Input
                                  type="time"
                                  aria-label={`${DAY_LABEL[day]} closes`}
                                  aria-invalid={bad || undefined}
                                  value={h.close}
                                  onChange={(e) =>
                                    setDayTime(day, "close", e.target.value)
                                  }
                                  className="sm:w-36"
                                />
                              </div>
                              {bad && (
                                <p className="text-xs text-danger">
                                  Closing time must be after opening time.
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Closed all day
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>

                <SaveBar
                  className="mt-6"
                  show={hoursDirty}
                  pending={savingHours}
                  form={field("hours")}
                  saveLabel="Save hours"
                  disabled={badHours.length > 0}
                  message={
                    badHours.length > 0 ? "Fix the times to save" : undefined
                  }
                  onDiscard={() => setHours(saved.hours)}
                />
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* ================= STAFF ================= */}
        <TabsContent value="staff" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <CardTitle>Staff</CardTitle>
                <CardDescription>
                  The stylists customers can be assigned to.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setOpenAddStaff(true)}>
                <UserPlus />
                Add staff
              </Button>
            </CardHeader>
            <CardContent>
              <DataList
                items={staff}
                rowKey={(m) => m.id}
                columns={staffColumns}
                caption="Staff"
                rowActions={(m, layout) =>
                  layout === "table" ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-danger"
                      aria-label={`Remove ${m.user?.name ?? "staff member"}`}
                      title="Remove"
                      onClick={() => askRemove(m)}
                    >
                      <Trash2 />
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => askRemove(m)}>
                      <Trash2 />
                      Remove
                    </Button>
                  )
                }
                empty={
                  <div className="rounded-2xl border border-dashed border-border">
                    <EmptyState
                      icon={Users}
                      title="No staff yet"
                      description="Add the people who work here so bookings can be assigned to them."
                      action={
                        <Button onClick={() => setOpenAddStaff(true)}>
                          <UserPlus />
                          Add staff
                        </Button>
                      }
                    />
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= COUNTERS ================= */}
        <TabsContent value="counters" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <CardTitle>Counters</CardTitle>
                <CardDescription>
                  The chairs or stations bookings are made against.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setOpenAddCounter(true)}>
                <MonitorSmartphone />
                Add counter
              </Button>
            </CardHeader>
            <CardContent>
              {counters.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border">
                  <EmptyState
                    icon={MonitorSmartphone}
                    title="No counters yet"
                    description="Add at least one so customers can book slots."
                    action={
                      <Button onClick={() => setOpenAddCounter(true)}>
                        <MonitorSmartphone />
                        Add counter
                      </Button>
                    }
                  />
                </div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {counters.map((counter) => (
                    <li
                      key={counter.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-hover">
                        <MonitorSmartphone className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{counter.name}</p>
                        {counter.code && (
                          <p className="truncate text-sm text-muted-foreground">
                            Code {counter.code}
                          </p>
                        )}
                      </div>
                      <ToneBadge
                        status={counter.isActive ? "ACTIVE" : "INACTIVE"}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= LOCATION ================= */}
        <TabsContent value="location" className="mt-4">
          <SalonLocationTab salon={initialData} />
        </TabsContent>
      </Tabs>

      <AddStaffModal
        open={openAddStaff}
        setOpen={setOpenAddStaff}
        salonId={salonId}
      />
      <AddCounterModal
        open={openAddCounter}
        setOpen={setOpenAddCounter}
        salonId={salonId}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Remove ${toRemove?.user?.name ?? "this staff member"}?`}
        description="They leave this salon's staff list and can no longer be assigned bookings. Past bookings keep their name."
        confirmLabel="Remove"
        tone="danger"
        onConfirm={removeStaff}
      />
    </div>
  );
}

/* ---------------- Sub-Components ---------------- */

function PillTab({
  value,
  count,
  unsaved,
  children,
}: {
  value: Tab;
  count?: number;
  unsaved?: boolean;
  children: React.ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      className="h-9 flex-none rounded-full px-4 data-[state=active]:bg-surface"
    >
      {children}
      {count !== undefined && (
        <span className="tabular-nums text-muted-foreground">{count}</span>
      )}
      {unsaved && (
        <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
      )}
      {unsaved && <span className="sr-only">(unsaved changes)</span>}
    </TabsTrigger>
  );
}

function FormField({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
