"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Search,
  Settings2,
  Star,
  Store as StoreIcon,
  TriangleAlert,
  Users,
} from "lucide-react";
import SafeImage from "@/components/Shared/SafeImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { LocationAccuracy } from "@/lib/api-types";
import { formatRating } from "@/lib/rating";
import { PageHeader } from "@/components/Shared/PageHeader";
import { StatCard } from "@/components/Shared/StatCard";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import AddSalonModal from "./AddSalonModal";

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
  user: {
    name: string;
    email: string;
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
  images: string[];
  operatingHours: OperatingHours;
  status: string;
  rating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: LocationAccuracy | null;
  staff: StaffItem[];
  _count: {
    services: number;
    staff: number;
    reviews: number;
    appointments: number;
  };
};

type SalonResponse = {
  success: boolean;
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  data: Salon[];
};

/* ---------------- Helpers ---------------- */

const formatTimeTo12Hr = (time: string) => {
  // time = "09:00"
  const [hh, mm] = time.split(":").map(Number);
  const suffix = hh >= 12 ? "PM" : "AM";
  const hour12 = ((hh + 11) % 12) + 1;
  return `${hour12}:${String(mm).padStart(2, "0")} ${suffix}`;
};

// Dhaka's weekday, so the server render and the browser agree.
const todayKey = () =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Dhaka" })
    .format(new Date())
    .toLowerCase() as keyof OperatingHours;

type StatusFilter = "all" | "active" | "pending" | "other";

const statusGroup = (status: string): Exclude<StatusFilter, "all"> =>
  status === "ACTIVE" || status === "APPROVED"
    ? "active"
    : status === "PENDING_APPROVAL"
      ? "pending"
      : "other";

/* ---------------- Component ---------------- */

export default function Store({
  salonResponse,
}: {
  salonResponse: SalonResponse;
}) {
  const salons = Array.isArray(salonResponse?.data) ? salonResponse.data : [];

  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [openAddSalon, setOpenAddSalon] = React.useState(false);

  const counts = {
    all: salons.length,
    active: salons.filter((s) => statusGroup(s.status) === "active").length,
    pending: salons.filter((s) => statusGroup(s.status) === "pending").length,
    other: salons.filter((s) => statusGroup(s.status) === "other").length,
  };

  const filteredSalons = salons.filter((salon) => {
    if (statusFilter !== "all" && statusGroup(salon.status) !== statusFilter) {
      return false;
    }
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return [salon.name, salon.city, salon.address, salon.email, salon.status]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q));
  });

  // No pin, or only an area-centroid pin: nearby search can't place them.
  const needsExactLocation = salons.filter(
    (s) => s.latitude == null || s.locationAccuracy === "APPROXIMATE",
  );

  const totalStaff = salons.reduce((acc, s) => acc + (s._count?.staff || 0), 0);

  const filters: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    ...(counts.other > 0 ? [{ value: "other" as const, label: "Other" }] : []),
  ];

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="My salons"
          description="Your salons at a glance. Open one to edit its details, staff, counters and location."
          actions={
            <Button onClick={() => setOpenAddSalon(true)}>
              <Plus />
              Add salon
            </Button>
          }
        />

        {/* One notice for every salon that nearby search can't place */}
        {needsExactLocation.length > 0 && (
          <Alert className="border-warning/30 bg-warning-soft">
            <TriangleAlert className="text-warning" />
            <AlertTitle>
              {needsExactLocation.length === 1
                ? "1 salon needs an exact map pin"
                : `${needsExactLocation.length} salons need an exact map pin`}
            </AlertTitle>
            <AlertDescription className="text-foreground/80">
              <p>Nearby customers may not find them until the pin is set.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {needsExactLocation.map((salon) => (
                  <Button
                    key={salon.id}
                    asChild
                    size="sm"
                    variant="outline"
                    className="bg-surface"
                  >
                    <Link href={`/dashboard/store/${salon.id}?tab=location`}>
                      <MapPin />
                      {salon.name}
                    </Link>
                  </Button>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard label="Total salons" value={counts.all} icon={StoreIcon} />
          <StatCard
            label="Active"
            value={counts.active}
            icon={CheckCircle2}
            tone="success"
          />
          <StatCard
            label="Pending approval"
            value={counts.pending}
            icon={Clock}
            tone="warning"
          />
          <StatCard label="Total staff" value={totalStaff} icon={Users} tone="info" />
        </div>

        {/* Search and status filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search salons"
              placeholder="Search by name, area or status"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by status"
          >
            {filters.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={statusFilter === f.value ? "default" : "outline"}
                aria-pressed={statusFilter === f.value}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
                <span className="tabular-nums opacity-70">{counts[f.value]}</span>
              </Button>
            ))}
          </div>
        </div>

        {filteredSalons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface">
            <EmptyState
              icon={StoreIcon}
              title={salons.length === 0 ? "No salons yet" : "No salons match"}
              description={
                salons.length === 0
                  ? "Add your first salon to start taking bookings."
                  : "Try another search or status."
              }
              action={
                salons.length === 0 ? (
                  <Button onClick={() => setOpenAddSalon(true)}>
                    <Plus />
                    Add salon
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredSalons.map((salon) => (
              <SalonTile key={salon.id} salon={salon} />
            ))}
          </div>
        )}
      </div>
      <AddSalonModal open={openAddSalon} setOpen={setOpenAddSalon} />
    </>
  );
}

/* ---------------- UI Helpers ---------------- */

function SalonTile({ salon }: { salon: Salon }) {
  const hours = salon.operatingHours?.[todayKey()];
  const place = [salon.city, salon.state].filter(Boolean).join(", ");
  const isLive = statusGroup(salon.status) === "active";

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-primary/40">
      <div className="relative aspect-[16/9] bg-muted">
        <SafeImage
          src={salon.images?.[0]}
          alt=""
          fill
          sizes="(min-width: 1536px) 22vw, (min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="object-cover"
        />
        <div className="absolute left-3 top-3">
          <ToneBadge status={salon.status} className="shadow-sm">
            {salon.status === "PENDING_APPROVAL" ? "Pending approval" : undefined}
          </ToneBadge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground" title={salon.name}>
            {salon.name}
          </h3>
          <p
            className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground"
            title={salon.address}
          >
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {salon.address || place || "No address yet"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1 font-medium">
            <Star className="size-4 fill-gold text-gold" aria-hidden="true" />
            {formatRating(salon.rating)}
            <span className="font-normal text-muted-foreground">
              ({salon.totalReviews || 0})
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="size-3.5" aria-hidden="true" />
            {hours
              ? `Today ${formatTimeTo12Hr(hours.open)} – ${formatTimeTo12Hr(hours.close)}`
              : "Closed today"}
          </span>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-border rounded-xl bg-surface-subtle py-2.5 text-center">
          <div>
            <dt className="text-xs text-muted-foreground">Services</dt>
            <dd className="font-semibold tabular-nums">
              {salon._count?.services || 0}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Staff</dt>
            <dd className="font-semibold tabular-nums">{salon._count?.staff || 0}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Bookings</dt>
            <dd className="font-semibold tabular-nums">
              {(salon._count?.appointments || 0).toLocaleString()}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex gap-2 pt-1">
          <Button asChild className="flex-1">
            <Link href={`/dashboard/store/${salon.id}`}>
              <Settings2 />
              Manage
            </Link>
          </Button>
          {isLive && (
            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label={`Open the public page for ${salon.name}`}
              title="Public page"
            >
              <Link href={`/salons/${salon.id}`}>
                <ArrowUpRight />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
