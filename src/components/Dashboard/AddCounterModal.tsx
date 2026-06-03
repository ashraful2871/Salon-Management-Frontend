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

import { MonitorSmartphone, Type, Hash } from "lucide-react";
import { createCounter, AddCounterPayload } from "@/services/counter/createCounter";
import { toast } from "sonner";

export default function AddCounterModal({
  open,
  setOpen,
  salonId,
  onCreate,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  salonId: string;
  onCreate: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createCounter, null);
  const [form, setForm] = React.useState<AddCounterPayload>({
    salonId,
    name: "",
    code: "",
  });

  const lastProcessedState = React.useRef(state);

  useEffect(() => {
    setForm((prev) => ({ ...prev, salonId }));
  }, [salonId]);

  useEffect(() => {
    if (!state || lastProcessedState.current === state) return;
    lastProcessedState.current = state;

    if (state?.success) {
      toast.success(state?.message || "Counter Added Successfully");
      onCreate();
      setOpen(false);

      setTimeout(() => {
        setForm({
          salonId,
          name: "",
          code: "",
        });
      }, 0);
    } else if (state?.success === false) {
      toast.error(state?.message || "Failed to add counter.");
    }
  }, [state, setOpen, onCreate, salonId]);

  const update = (key: keyof AddCounterPayload, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isValid = form.salonId && form.name.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[100vw] sm:w-[95vw] md:w-[600px] max-w-full p-0 overflow-hidden rounded-none sm:rounded-2xl flex flex-col">
        <form
          action={formAction}
          className="flex flex-col h-full overflow-hidden"
        >
          <input type="hidden" name="salonId" value={form.salonId} />

          {/* Header */}
          <div className="p-6 pb-4 border-b bg-gradient-card shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <MonitorSmartphone className="h-5 w-5 text-primary" />
                Add New Counter
                <Badge className="ml-2 bg-sage text-white">New</Badge>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a counter or workstation for this salon.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Field
                icon={<Type className="h-4 w-4 text-primary" />}
                label="Counter Name *"
              >
                <Input
                  name="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Counter 1, Chair A, VIP Room"
                />
              </Field>

              <Field
                icon={<Hash className="h-4 w-4 text-primary" />}
                label="Counter Code (Optional)"
              >
                <Input
                  name="code"
                  value={form.code}
                  onChange={(e) => update("code", e.target.value)}
                  placeholder="e.g. C-01"
                />
              </Field>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-background shrink-0">
            <DialogFooter className="flex flex-col md:flex-row gap-3 md:justify-between">
              <p className="text-xs text-muted-foreground">
                Fields marked with <b>*</b> are required.
              </p>

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
                  {isPending ? "Adding..." : "Add Counter"}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
