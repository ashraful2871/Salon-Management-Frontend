"use client";

import { useId, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import {
  updateAdminSalonListing,
  type SalonListingInput,
} from "@/services/admin/salons/updateAdminSalonListing";

/**
 * Corrects a salon's name, description or phone on the owner's behalf. Only
 * the fields that changed are sent. Mount it only while open.
 */
export function EditListingDialog({
  open,
  onOpenChange,
  salon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salon: { id: string; name: string; description: string | null; phone: string };
}) {
  const ids = useId();
  const [name, setName] = useState(salon.name);
  const [description, setDescription] = useState(salon.description ?? "");
  const [phone, setPhone] = useState(salon.phone);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const changes: SalonListingInput = {};
  if (name.trim() !== salon.name) changes.name = name.trim();
  if (description.trim() !== (salon.description ?? "")) changes.description = description.trim();
  if (phone.trim() !== salon.phone) changes.phone = phone.trim();
  const dirty = Object.keys(changes).length > 0;
  const ready = dirty && reason.trim().length >= 3;

  const save = () => {
    if (!ready) return;
    setError(null);
    startTransition(async () => {
      const result = await updateAdminSalonListing(salon.id, { ...changes, reason: reason.trim() });
      if (!result.success) {
        setError(result.message);
        return;
      }
      showResultToast(result);
      onOpenChange(false);
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      title="Edit listing"
      description="The owner sees the change on their dashboard; the audit log keeps the old values."
      footer={
        <>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!ready || pending} onClick={save}>
            {pending && <Loader2 aria-hidden className="animate-spin" />}
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${ids}-name`}>Name</Label>
          <Input id={`${ids}-name`} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${ids}-phone`}>Phone</Label>
          <Input id={`${ids}-phone`} value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${ids}-description`}>Description</Label>
          <Textarea
            id={`${ids}-description`}
            rows={4}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${ids}-reason`}>Why</Label>
          <Input
            id={`${ids}-reason`}
            placeholder="e.g. Owner asked by phone"
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </ResponsiveDialog>
  );
}
