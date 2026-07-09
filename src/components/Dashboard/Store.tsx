"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Search,
  Plus,
  Filter,
  Store as StoreIcon,
  MapPin,
  Phone,
  Mail,
  Star,
  Users,
  Scissors,
  Calendar,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import AddSalonModal, { AddSalonPayload } from "./AddSalonModal";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

const formatTimeTo12Hr = (time: string) => {
  // time = "09:00"
  const [hh, mm] = time.split(":").map(Number);
  const suffix = hh >= 12 ? "PM" : "AM";
  const hour12 = ((hh + 11) % 12) + 1;
  return `${hour12}:${String(mm).padStart(2, "0")} ${suffix}`;
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

/* ---------------- Component ---------------- */

export default function Store({
  salonResponse,
}: {
  salonResponse: SalonResponse;
}) {
  const salons = Array.isArray(salonResponse?.data) ? salonResponse.data : [];

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [openAddSalon, setOpenAddSalon] = React.useState(false);
  const router = useRouter();

  const dummyImage =
    "https://i.ibb.co/jZWzbYnM/lindsay-cash-Md-Dha-Fsn-CQ-unsplash.jpg";

  const getValidImage = (url?: string | null) => {
    if (!url) return dummyImage;
    const trimmed = url.trim();
    if (
      trimmed === "" || 
      trimmed === "null" || 
      trimmed === "undefined" ||
      !(trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/") || trimmed.startsWith("data:"))
    ) {
      return dummyImage;
    }
    return trimmed;
  };

  // ✅ default select first salon
  React.useEffect(() => {
    if (!selectedId && salons.length > 0) {
      setSelectedId(salons[0].id);
    }
  }, [salons, selectedId]);

  const filteredSalons = salons.filter((salon) => {
    const q = searchTerm.toLowerCase();
    return (
      salon.name.toLowerCase().includes(q) ||
      salon.city.toLowerCase().includes(q) ||
      salon.email.toLowerCase().includes(q) ||
      salon.status.toLowerCase().includes(q)
    );
  });

  const selectedSalon = salons.find((s) => s.id === selectedId) || salons[0];

  // ✅ Stats
  const totalSalons = salons.length;
  const pendingCount = salons.filter(
    (s) => s.status === "PENDING_APPROVAL",
  ).length;
  const activeCount = salons.filter(
    (s) => s.status === "ACTIVE" || s.status === "APPROVED",
  ).length;

  const totalStaff = salons.reduce((acc, s) => acc + (s._count?.staff || 0), 0);
  const totalServices = salons.reduce(
    (acc, s) => acc + (s._count?.services || 0),
    0,
  );

  return (
    <>
      <div className="space-y-8">
        {/* ✅ Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-serif text-3xl font-bold">My Salons</h1>
            <p className="text-muted-foreground mt-1">
              Manage your salons, status, staff, and operations
            </p>
          </div>

          <Button
            onClick={() => setOpenAddSalon(true)}
            className="bg-sage hover:opacity-90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Salon
          </Button>
        </motion.div>

        {/* ✅ Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Salons"
            value={totalSalons}
            icon={<StoreIcon className="h-5 w-5" />}
          />
          <StatCard
            label="Active"
            value={activeCount}
            icon={<Star className="h-5 w-5 text-sage" />}
          />
          <StatCard
            label="Pending Approval"
            value={pendingCount}
            icon={<Clock className="h-5 w-5 text-primary" />}
          />
          <StatCard
            label="Total Staff"
            value={totalStaff}
            icon={<Users className="h-5 w-5 text-primary" />}
          />
        </div>

        {/* ✅ Main Layout (Table + Details Panel) */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEFT: Salon Table */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3"
          >
            <Card className="shadow-card">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Salon List</CardTitle>

                <div className="flex gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search salon by name, city, status..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {filteredSalons.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">
                    No salons found.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Salon</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Staff</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredSalons.map((salon) => {
                        const isSelected = salon.id === selectedId;

                        // ✅ FIX 1: Safe Image Logic to prevent download bug
                        // If salon.images[0] is empty or undefined, use a generated avatar

                        return (
                          <TableRow
                            key={salon.id}
                            className={`cursor-pointer hover:bg-muted/50 ${
                              isSelected ? "bg-primary/5" : ""
                            }`}
                            onClick={() => setSelectedId(salon.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Image
                                  width={60}
                                  height={60}
                                  src={getValidImage(salon.images?.[0])}
                                  alt={salon.name}
                                  className="h-11 w-11 rounded-lg object-cover border"
                                />

                                <div>
                                  <p className="font-medium leading-none">
                                    {salon.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {salon.city}, {salon.state}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              {getSalonStatusBadge(salon.status)}
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="h-4 w-4 text-gold" />
                                <span className="font-medium">
                                  {salon.rating || 0}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  ({salon.totalReviews || 0})
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge variant="secondary">
                                {salon._count?.staff || 0}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <Badge variant="secondary">
                                {salon._count?.services || 0}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right">
                              <Button variant="outline" size="sm">
                                View <ArrowUpRight className="ml-2 h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* RIGHT: Details Panel */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            {/* ✅ Sticky + Fixed Height Container */}
            <div className="lg:sticky lg:top-6 h-auto lg:h-[calc(100vh-120px)]">
              <Card className="shadow-card h-full flex flex-col">
                {/* Fixed Header */}
                <CardHeader className="shrink-0 border-b">
                  <CardTitle className="flex items-center justify-between">
                    Salon Details
                    {selectedSalon
                      ? getSalonStatusBadge(selectedSalon.status)
                      : null}
                  </CardTitle>
                </CardHeader>

                {/* ✅ FIX 2: Scroll Logic
                  - CardContent: overflow-hidden + flex-1 to fill space
                  - ScrollArea: h-full to respect parent height
                  - Inner div: handles padding so scrollbar is at the edge
              */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="px-5 py-4 ">
                      {!selectedSalon ? (
                        <p className="text-muted-foreground">
                          Select a salon to view details.
                        </p>
                      ) : (
                        <div className="space-y-6">
                          {/* Basic Info */}
                          <div>
                            <p className="text-xl font-bold">
                              {selectedSalon.name}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedSalon.description ||
                                "No description added yet."}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {getSalonStatusBadge(selectedSalon.status)}

                              <Badge variant="secondary" className="text-xs">
                                ⭐ {selectedSalon.rating || 0} (
                                {selectedSalon.totalReviews || 0} reviews)
                              </Badge>

                              <Badge variant="secondary" className="text-xs">
                                ID: {selectedSalon.id.slice(0, 10)}...
                              </Badge>
                            </div>
                          </div>

                          <Separator />

                          {/* Contact */}
                          <div className="space-y-3">
                            <MiniInfo
                              icon={<MapPin className="h-4 w-4 text-primary" />}
                              title="Full Address"
                              value={`${selectedSalon.address}, ${selectedSalon.city}, ${selectedSalon.state} - ${selectedSalon.zipCode}`}
                            />
                            <MiniInfo
                              icon={<Phone className="h-4 w-4 text-primary" />}
                              title="Phone"
                              value={selectedSalon.phone}
                            />
                            <MiniInfo
                              icon={<Mail className="h-4 w-4 text-primary" />}
                              title="Email"
                              value={selectedSalon.email}
                            />
                          </div>

                          <Separator />

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-3">
                            <SmallStat
                              icon={
                                <Scissors className="h-4 w-4 text-primary" />
                              }
                              label="Services"
                              value={selectedSalon._count?.services || 0}
                            />
                            <SmallStat
                              icon={<Users className="h-4 w-4 text-primary" />}
                              label="Staff"
                              value={selectedSalon._count?.staff || 0}
                            />
                            <SmallStat
                              icon={
                                <Calendar className="h-4 w-4 text-primary" />
                              }
                              label="Appointments"
                              value={selectedSalon._count?.appointments || 0}
                            />
                            <SmallStat
                              icon={<Star className="h-4 w-4 text-gold" />}
                              label="Reviews"
                              value={selectedSalon._count?.reviews || 0}
                            />
                          </div>

                          <Separator />

                          {/* Operating Hours */}
                          <div>
                            <p className="font-semibold mb-2 flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              Operating Hours
                            </p>

                            <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
                              {daysOrder.map((day) => {
                                const hours =
                                  selectedSalon.operatingHours?.[day];
                                return (
                                  <div
                                    key={day}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <span className="text-muted-foreground">
                                      {dayLabel[String(day)]}
                                    </span>

                                    {hours ? (
                                      <span className="font-medium">
                                        {formatTimeTo12Hr(hours.open)} -{" "}
                                        {formatTimeTo12Hr(hours.close)}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        Closed
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <Separator />

                          {/* Staff */}
                          <div>
                            <p className="font-semibold mb-3">Staff Members</p>

                            {selectedSalon.staff?.length ? (
                              <div className="space-y-3">
                                {selectedSalon.staff.map((st) => (
                                  <div
                                    key={st.id}
                                    className="rounded-xl border bg-card p-3 shadow-soft"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                        <Image
                                          width={40}
                                          height={40}
                                          // Safe fallback for staff images too
                                          src={getValidImage(st?.user?.profilePhoto)}
                                          alt={st?.user?.name || ""}
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

                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
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
                                          Email
                                        </p>
                                        <p className="font-medium break-all">
                                          {st.user.email}
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

                          <Separator />

                          {/* CTA */}
                          <div className="flex gap-2">
                            <Link href={`/dashboard/store/${selectedSalon.id}`}>
                              <Button className="flex-1 bg-sage hover:opacity-90 text-white">
                                Manage Salon
                              </Button>
                            </Link>
                            <Button variant="outline" className="flex-1">
                              Edit Salon
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
      <AddSalonModal
        open={openAddSalon}
        setOpen={setOpenAddSalon}
        onCreate={async (payload: AddSalonPayload) => {
          // Salon is created via useActionState inside AddSalonModal.
          // This callback fires on success — we just need to refresh the data.
          router.refresh();
        }}
      />
    </>
  );
}

/* ---------------- UI Helpers ---------------- */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="shadow-soft">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
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

function SmallStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </div>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
