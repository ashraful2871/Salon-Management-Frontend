"use client";

import React, { useActionState, useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageIcon, X, Plus, Clock, DollarSign, List, Info, Building2 } from "lucide-react";
import { createService } from "@/services/service/createService";
import { toast } from "sonner";

export type AddServicePayload = {
  name: string;
  description: string;
  category: string;
  price: string;
  duration: string;
  salonId: string;
  images: string[];
};

export default function AddServiceModal({
  open,
  setOpen,
  salons,
  onCreate,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  salons: { id: string; name: string }[];
  onCreate: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createService, null);

  const [form, setForm] = useState<AddServicePayload>({
    name: "",
    description: "",
    category: "HAIRCUT",
    price: "",
    duration: "",
    salonId: salons[0]?.id || "",
    images: [],
  });
  
  const [imageUrl, setImageUrl] = useState("");

  const lastProcessedState = React.useRef(state);

  useEffect(() => {
    if (!state || lastProcessedState.current === state) return;
    lastProcessedState.current = state;
    
    if (state?.success) {
      toast.success(state?.message || "Service Created Successfully");
      onCreate();
      setOpen(false);
      setTimeout(() => {
        setForm({
          name: "",
          description: "",
          category: "HAIRCUT",
          price: "",
          duration: "",
          salonId: salons[0]?.id || "",
          images: [],
        });
        setImageUrl("");
      }, 0);
    } else if (!state.success) {
      toast.error(state.message || "Failed to create Service");
    }
  }, [state, setOpen, onCreate, salons]);

  const update = (key: keyof AddServicePayload, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addImage = () => {
    if (!imageUrl.trim()) return;
    if (form.images.includes(imageUrl.trim())) return;
    update("images", [...form.images, imageUrl.trim()]);
    setImageUrl("");
  };

  const removeImage = (url: string) => {
    update("images", form.images.filter((u) => u !== url));
  };

  const isValid =
    form.name.trim() &&
    form.category.trim() &&
    form.price &&
    form.duration &&
    form.salonId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[100vw] sm:w-[95vw] md:w-[700px] max-w-full h-auto p-0 overflow-hidden rounded-none sm:rounded-2xl flex flex-col">
        <form action={formAction} className="flex flex-col h-full overflow-hidden">
          <input type="hidden" name="images" value={JSON.stringify(form.images)} />
          <input type="hidden" name="salonId" value={form.salonId} />
          <input type="hidden" name="category" value={form.category} />

          <div className="p-6 pb-4 border-b bg-gradient-card shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Plus className="h-5 w-5 text-primary" />
                Add New Service
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a new service offering for your salon.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {salons.length > 0 && (
                <Field icon={<Building2 className="h-4 w-4 text-primary" />} label="Select Salon *">
                  <Select value={form.salonId} onValueChange={(val) => update("salonId", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a salon" />
                    </SelectTrigger>
                    <SelectContent>
                      {salons.map((salon) => (
                        <SelectItem key={salon.id} value={salon.id}>
                          {salon.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <Field icon={<Info className="h-4 w-4 text-primary" />} label="Service Name *">
                  <Input name="name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Haircut & Styling" />
                </Field>
                
                <Field icon={<List className="h-4 w-4 text-primary" />} label="Category *">
                  <Select value={form.category} onValueChange={(val) => update("category", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {["HAIRCUT", "STYLING", "COLORING", "TREATMENT", "SPA", "FACIAL", "MANICURE", "PEDICURE", "MAKEUP", "WAXING", "MASSAGE", "OTHER"].map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Field icon={<DollarSign className="h-4 w-4 text-primary" />} label="Price *">
                  <Input name="price" type="number" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="e.g. 50" />
                </Field>

                <Field icon={<Clock className="h-4 w-4 text-primary" />} label="Duration (Minutes) *">
                  <Input name="duration" type="number" min="1" value={form.duration} onChange={(e) => update("duration", e.target.value)} placeholder="e.g. 45" />
                </Field>
              </div>

              <Field label="Description">
                <Textarea name="description" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Short description about the service..." className="min-h-[90px]" />
              </Field>

              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">Service Images</p>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }} placeholder="Paste image url and click Add" />
                  </div>
                  <Button type="button" onClick={addImage} variant="outline" className="md:w-32"><Plus className="mr-2 h-4 w-4" /> Add</Button>
                </div>
                {form.images.length === 0 ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-2"><ImageIcon className="h-4 w-4" /> No images added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {form.images.map((url) => (
                      <div key={url} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
                        <p className="text-xs text-muted-foreground break-all">{url}</p>
                        <Button size="icon" variant="ghost" type="button" className="text-destructive" onClick={() => removeImage(url)}><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </motion.div>
          </div>

          <div className="p-6 border-t bg-background shrink-0">
            <DialogFooter className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!isValid || isPending} className="bg-sage hover:opacity-90 text-white">
                {isPending ? "Saving..." : "Save Service"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode; }) {
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
