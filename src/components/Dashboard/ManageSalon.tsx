/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useActionState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Star,
  Clock,
  Save,
  Building2,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Loader2,
  MonitorSmartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner"; // Assuming you use sonner or similar for toasts
import { updateSalon } from "@/services/salon/updateSalon";
import AddStaffModal, { AddStaffPayload } from "./AddStaffModal";
import AddCounterModal from "./AddCounterModal";
import { useRouter } from "next/navigation";

/* ---------------- Types ---------------- */

type DayHours = { open: string; close: string };
type OperatingHours = Record<string, DayHours>;

type SalonData = {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string; // Added optional website
  images: string[];
  operatingHours: OperatingHours;
  status: string;
  rating: number;
  totalReviews: number;
  staff: Array<{
    id: string;
    speciality: string;
    experience: number;
    status: string;
    user: { name: string; profilePhoto: string | null };
  }>;
  counters?: Array<{
    id: string;
    name: string;
    code: string | null;
    isActive: boolean;
    createdAt: string;
  }>;
};

/* ---------------- Helpers ---------------- */

const daysOrder = [
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

const formatTime = (time: string) => {
  if (!time) return "Closed";
  const [hh, mm] = time.split(":").map(Number);
  const suffix = hh >= 12 ? "PM" : "AM";
  const hour12 = ((hh + 11) % 12) + 1;
  return `${hour12}:${String(mm).padStart(2, "0")} ${suffix}`;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "APPROVED":
      return (
        <Badge className="bg-sage text-white gap-1">
          <CheckCircle2 className="w-3 h-3" /> Active
        </Badge>
      );
    case "PENDING_APPROVAL":
      return (
        <Badge className="bg-gold text-white gap-1">
          <AlertCircle className="w-3 h-3" /> Pending Review
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

/* ---------------- Main Component ---------------- */

export default function ManageSalon({ initialData }: { initialData: any }) {
  // 1. Hook Server Action
  const [state, formAction, isPending] = useActionState(updateSalon, null);

  // 2. Local State for Inputs (Immediate UI Feedback)
  const [salon, setSalon] = useState<SalonData>(initialData);
  const [openAddStaff, setOpenAddStaff] = useState(false);
  const [openAddCounter, setOpenAddCounter] = useState(false);
  const router = useRouter();

  // 3. Handle Success/Error Toasts
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state]);

  const updateField = (field: keyof SalonData, value: any) => {
    setSalon((prev) => ({ ...prev, [field]: value }));
  };

  const updateHours = (day: string, type: "open" | "close", value: string) => {
    setSalon((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [type]: value,
        },
      },
    }));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* --- Header Section --- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-muted">
          {/* Cover Image Logic */}
          <Image
            src={
              salon.images[0] ||
              "https://i.ibb.co/jZWzbYnM/lindsay-cash-Md-Dha-Fsn-CQ-unsplash.jpg"
            }
            alt="Salon Cover"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-6 text-white">
            <h1 className="text-3xl font-bold font-serif">{salon.name}</h1>
            <p className="opacity-90 flex items-center gap-2 text-sm mt-1">
              <MapPin className="w-4 h-4 text-gold" /> {salon.city},{" "}
              {salon.state}
            </p>
          </div>
          <div className="absolute top-4 right-4">
            {getStatusBadge(salon.status)}
          </div>
        </div>
      </motion.div>

      {/* --- Tabs for Management --- */}
      <Tabs defaultValue="edit" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="edit">Edit Details</TabsTrigger>
            <TabsTrigger value="staff">
              Staff ({salon.staff.length})
            </TabsTrigger>
            <TabsTrigger value="counters">
              Counters ({salon.counters?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* ✅ SAVE BUTTON LINKED TO FORM VIA ID */}
          <Button
            type="submit"
            form="salon-update-form" // This links the button to the form inside the Tab
            disabled={isPending}
            className="bg-sage hover:bg-sage/90 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* ================= OVERVIEW TAB ================= */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Rating"
              value={salon.rating.toFixed(1)}
              icon={<Star className="w-4 h-4 text-gold fill-gold" />}
            />
            <StatCard
              label="Reviews"
              value={salon.totalReviews}
              icon={<Users className="w-4 h-4 text-primary" />}
            />
            <StatCard
              label="Staff Members"
              value={salon.staff.length}
              icon={<Users className="w-4 h-4 text-sage" />}
            />
            <StatCard
              label="Joined"
              value={new Date().getFullYear()}
              icon={<Calendar className="w-4 h-4 text-primary" />}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-card border-none">
                <CardHeader>
                  <CardTitle className="text-lg">About the Salon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {salon.description || "No description provided."}
                  </p>
                  <Separator />
                  <div className="grid md:grid-cols-2 gap-4">
                    <MiniInfo
                      icon={<Phone className="w-4 h-4" />}
                      title="Phone"
                      value={salon.phone}
                    />
                    <MiniInfo
                      icon={<Mail className="w-4 h-4" />}
                      title="Email"
                      value={salon.email}
                    />
                    <MiniInfo
                      icon={<Building2 className="w-4 h-4" />}
                      title="Address"
                      value={salon.address}
                    />
                    <MiniInfo
                      icon={<MapPin className="w-4 h-4" />}
                      title="Zip Code"
                      value={salon.zipCode}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Hours View */}
            <div className="space-y-6">
              <Card className="shadow-card border-none">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" /> Operating Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {daysOrder.map((day) => {
                      const hours = salon.operatingHours[day];
                      return (
                        <div
                          key={day}
                          className="flex justify-between items-center p-4 text-sm hover:bg-muted/30"
                        >
                          <span className="font-medium text-muted-foreground">
                            {dayLabel[day]}
                          </span>
                          <span
                            className={
                              hours
                                ? "font-semibold"
                                : "text-muted-foreground/50"
                            }
                          >
                            {hours
                              ? `${formatTime(hours.open)} - ${formatTime(hours.close)}`
                              : "Closed"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ================= EDIT TAB (FORM START) ================= */}
        <TabsContent value="edit">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* ✅ FORM WRAPPER */}
            <form id="salon-update-form" action={formAction}>
              {/* ✅ HIDDEN INPUTS TO PASS COMPLEX STATE */}
              <input type="hidden" name="id" value={salon.id} />
              <input
                type="hidden"
                name="operatingHours"
                value={JSON.stringify(salon.operatingHours)}
              />

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Inputs */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>General Information</CardTitle>
                      <CardDescription>
                        Update your salon is public profile
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Salon Name
                          </label>
                          <Input
                            name="name"
                            value={salon.name}
                            onChange={(e) =>
                              updateField("name", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Website</label>
                          <Input
                            name="website"
                            value={salon.website || ""}
                            onChange={(e) =>
                              updateField("website", e.target.value)
                            }
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Description
                        </label>
                        <Textarea
                          name="description"
                          value={salon.description}
                          onChange={(e) =>
                            updateField("description", e.target.value)
                          }
                          className="min-h-[120px]"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Contact & Location</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Phone</label>
                          <Input
                            name="phone"
                            value={salon.phone}
                            onChange={(e) =>
                              updateField("phone", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            name="email"
                            value={salon.email}
                            onChange={(e) =>
                              updateField("email", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Address</label>
                        <Input
                          name="address"
                          value={salon.address}
                          onChange={(e) =>
                            updateField("address", e.target.value)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">City</label>
                          <Input
                            name="city"
                            value={salon.city}
                            onChange={(e) =>
                              updateField("city", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">State</label>
                          <Input
                            name="state"
                            value={salon.state}
                            onChange={(e) =>
                              updateField("state", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Zip</label>
                          <Input
                            name="zipCode"
                            value={salon.zipCode}
                            onChange={(e) =>
                              updateField("zipCode", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Edit Sidebar (Hours) */}
                <div className="space-y-6">
                  <Card className="h-fit">
                    <CardHeader>
                      <CardTitle>Operating Hours</CardTitle>
                      <CardDescription>
                        Set your weekly availability
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {daysOrder.map((day) => {
                        const hours = salon.operatingHours[day];
                        return (
                          <div
                            key={day}
                            className="flex flex-col gap-1 p-3 border rounded-lg bg-muted/10"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium capitalize text-sm">
                                {day}
                              </span>
                              <Badge
                                variant={hours ? "outline" : "secondary"}
                                className="text-[10px]"
                              >
                                {hours ? "Open" : "Closed"}
                              </Badge>
                            </div>
                            {/* Note: We don't put 'name' on these inputs because they are complex.
                                  We update the state locally, and the state is JSON.stringified 
                                  into the hidden 'operatingHours' input at the top of the form.
                               */}
                            {hours && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="time"
                                  className="h-8 text-xs"
                                  value={hours.open}
                                  onChange={(e) =>
                                    updateHours(day, "open", e.target.value)
                                  }
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                  type="time"
                                  className="h-8 text-xs"
                                  value={hours.close}
                                  onChange={(e) =>
                                    updateHours(day, "close", e.target.value)
                                  }
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </motion.div>
        </TabsContent>

        {/* ================= STAFF TAB ================= */}
        <TabsContent value="staff">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>
                  Manage your stylists and their permissions.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpenAddStaff(true)}
              >
                <Users className="w-4 h-4 mr-2" /> Add Staff
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salon.staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.user.profilePhoto || ""} />
                        <AvatarFallback>
                          {member.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{member.user.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{member.speciality}</span>
                          <span>•</span>
                          <span>{member.experience} Years Exp.</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          member.status === "AVAILABLE"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {member.status}
                      </Badge>
                      <Button size="icon" variant="ghost">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= COUNTERS TAB ================= */}
        <TabsContent value="counters">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Counters</CardTitle>
                <CardDescription>
                  Manage the physical counters or workstations in your salon.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpenAddCounter(true)}
              >
                <MonitorSmartphone className="w-4 h-4 mr-2" /> Add Counter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salon.counters?.map((counter) => (
                  <div
                    key={counter.id}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <MonitorSmartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">{counter.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          {counter.code && <span>Code: {counter.code}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={counter.isActive ? "default" : "secondary"}
                      >
                        {counter.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button size="icon" variant="ghost">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
                {!salon.counters?.length && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No counters added yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <AddStaffModal
        open={openAddStaff}
        setOpen={setOpenAddStaff}
        salonId={salon.id}
        onCreate={async (payload: AddStaffPayload) => {
          console.log("payload", payload);
        }}
      />
      <AddCounterModal
        open={openAddCounter}
        setOpen={setOpenAddCounter}
        salonId={salon.id}
        onCreate={() => {
          router.refresh();
        }}
      />
    </div>
  );
}

/* ---------------- Sub-Components ---------------- */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: any;
}) {
  return (
    <Card className="shadow-sm border-none bg-card">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold mt-1 text-primary">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
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
  icon: any;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/10">
      <div className="mt-0.5 text-sage">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground mb-0.5">
          {title}
        </p>
        <p className="font-medium text-sm text-foreground break-all">{value}</p>
      </div>
    </div>
  );
}
