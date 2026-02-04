/* eslint-disable react-hooks/set-state-in-effect */
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

import { Users, Mail, Scissors, Briefcase, FileText } from "lucide-react";
import { addStaff } from "@/services/staff/addStaff";
import { toast } from "sonner";

// ✅ your server action (create staff)

export type AddStaffPayload = {
  salonId: string;
  email: string;
  speciality: string;
  experience: number;
  bio: string;
};

export default function AddStaffModal({
  open,
  setOpen,
  salonId,
  onCreate,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  salonId: string;
  onCreate: (payload: AddStaffPayload) => Promise<void> | void;
}) {
  // ✅ Hook Server Action (same as AddSalonModal)
  const [state, formAction, isPending] = useActionState(addStaff, null);
  // ✅ Local state for UI
  const [form, setForm] = React.useState<AddStaffPayload>({
    salonId,
    email: "",
    speciality: "",
    experience: 1,
    bio: "",
  });

  // ✅ Keep salonId in sync if parent changes selected salon
  useEffect(() => {
    setForm((prev) => ({ ...prev, salonId }));
  }, [salonId]);

  // ✅ Watch for Success
  useEffect(() => {
    if (!state) return;

    if (state?.success) {
      toast.success(state?.message || "Staff Added Successfully");
      onCreate(state.data); // Pass data back if you want
      setOpen(false);

      // Reset (same pattern you used)
      setTimeout(() => {
        setForm({
          salonId,
          email: "",
          speciality: "",
          experience: 1,
          bio: "",
        });
      }, 0);
    } else if (state?.success === false) {
      toast.error(state?.message || "Failed to add staff.");
    }
  }, [state, setOpen, onCreate, salonId]);

  const update = (key: keyof AddStaffPayload, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isValid =
    form.salonId &&
    form.email.trim() &&
    form.speciality.trim() &&
    form.bio.trim() &&
    Number(form.experience) >= 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[100vw] sm:w-[95vw] md:w-[92vw] lg:w-[1100px] xl:w-[1200px] max-w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-[1200px] p-0 overflow-hidden rounded-none sm:rounded-2xl flex flex-col">
        {/* ✅ WRAPPER FORM (same as AddSalonModal) */}
        <form
          action={formAction}
          className="flex flex-col h-full overflow-hidden"
        >
          {/* ✅ Hidden inputs (backend needs salonId) */}
          <input type="hidden" name="salonId" value={form.salonId} />

          {/* Header */}
          <div className="p-6 pb-4 border-b bg-gradient-card shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-primary" />
                Add Staff Member
                <Badge className="ml-2 bg-sage text-white">New</Badge>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a staff member to this salon. Please fill details carefully.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Staff Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SectionTitle title="Staff Information" />

              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  icon={<Mail className="h-4 w-4 text-primary" />}
                  label="Email *"
                >
                  <Input
                    name="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="staff@gmail.com"
                  />
                </Field>

                <Field
                  icon={<Briefcase className="h-4 w-4 text-primary" />}
                  label="Experience (years) *"
                >
                  <Input
                    name="experience"
                    type="number"
                    min={0}
                    value={form.experience}
                    onChange={(e) =>
                      update("experience", Number(e.target.value))
                    }
                    placeholder="5"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field
                    icon={<Scissors className="h-4 w-4 text-primary" />}
                    label="Speciality *"
                  >
                    <Input
                      name="speciality"
                      value={form.speciality}
                      onChange={(e) => update("speciality", e.target.value)}
                      placeholder="Hair Styling & Coloring"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field
                    icon={<FileText className="h-4 w-4 text-primary" />}
                    label="Bio *"
                  >
                    <Textarea
                      name="bio"
                      value={form.bio}
                      onChange={(e) => update("bio", e.target.value)}
                      placeholder="Expert hair stylist with 5 years of experience"
                      className="min-h-[110px]"
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-5 rounded-xl border bg-muted/30 p-4">
                <p className="text-sm font-medium mb-2">Preview</p>

                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold leading-none">
                        {form.email?.trim() ? form.email : "staff@gmail.com"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {form.speciality?.trim()
                          ? form.speciality
                          : "Hair Styling & Coloring"}
                      </p>
                    </div>

                    <Badge className="bg-gold text-primary-foreground text-xs">
                      Invite
                    </Badge>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-xs text-muted-foreground">
                        Experience
                      </p>
                      <p className="font-medium">
                        {Number(form.experience) || 0} years
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-xs text-muted-foreground">Salon ID</p>
                      <p className="font-medium break-all">
                        {form.salonId ? `${form.salonId.slice(0, 10)}...` : "—"}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {form.bio?.trim()
                      ? form.bio
                      : "Expert hair stylist with 5 years of experience"}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  Tip: Staff will be created based on this payload.
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

              {/* ✅ Error Message (same pattern) */}
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
                  type="submit"
                  disabled={!isValid || isPending}
                  className="bg-sage hover:opacity-90 text-white"
                >
                  {isPending ? "Adding..." : "Add Staff"}
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
