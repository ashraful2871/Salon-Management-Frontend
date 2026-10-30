"use client";

import { useId, useState, useTransition } from "react";

import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createHomeExpert } from "@/services/home-service/createHomeExpert";
import { setHomeExpertOfferings } from "@/services/home-service/setHomeExpertOfferings";
import type {
  ExpertGender,
  HomeAudience,
  HomeExpertCandidate,
  HomeOffering,
} from "@/services/home-service/types";
import { SIDE_LABEL } from "./format";
import { OfferingChecklist } from "./OfferingChecklist";

const GENDERS: { value: ExpertGender; label: string; audience: HomeAudience }[] = [
  { value: "FEMALE", label: "Female", audience: "LADIES" },
  { value: "MALE", label: "Male", audience: "GENTS" },
];

/** Staff member → gender → side (which it decides) → the side's services. Opens the expert for documents after. */
export function AddExpertDialog({
  salonId,
  candidates,
  offerings,
  sides,
  open,
  onOpenChange,
  onCreated,
}: {
  salonId: string;
  candidates: HomeExpertCandidate[];
  offerings: HomeOffering[];
  sides: HomeAudience[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (expertId: string) => void;
}) {
  const id = useId();
  const allowed = GENDERS.filter((g) => sides.includes(g.audience));
  const [staffId, setStaffId] = useState("");
  const [gender, setGender] = useState<ExpertGender | null>(allowed.length === 1 ? allowed[0].value : null);
  const [links, setLinks] = useState<string[]>([]);
  const [pending, start] = useTransition();

  const audience = GENDERS.find((g) => g.value === gender)?.audience;
  const sideOfferings = offerings.filter((o) => o.audience === audience);

  const pickStaff = (value: string) => {
    setStaffId(value);
    const known = allowed.find((g) => g.value === candidates.find((c) => c.staffId === value)?.gender);
    if (known) pickGender(known.value);
  };

  const pickGender = (value: ExpertGender) => {
    if (value !== gender) setLinks([]);
    setGender(value);
  };

  const submit = () => {
    if (!staffId || !gender) return;
    start(async () => {
      const res = await createHomeExpert({ salonId, staffId, gender });
      if (!res.success || !res.data) {
        showResultToast(res);
        return;
      }
      if (links.length > 0) {
        const linked = await setHomeExpertOfferings(salonId, res.data.id, links);
        if (!linked.success) showResultToast(linked);
      }
      onCreated(res.data.id);
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add expert"
      description="Experts come from your staff. Next you'll upload their documents."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={pending} disabled={!staffId || !gender}>
            Add expert
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-staff`}>Staff member</Label>
          <Select value={staffId} onValueChange={pickStaff}>
            <SelectTrigger id={`${id}-staff`} className="w-full">
              <SelectValue placeholder="Choose a staff member" />
            </SelectTrigger>
            <SelectContent position="popper">
              {candidates.map((c) => (
                <SelectItem key={c.staffId} value={c.staffId}>
                  {c.name}
                  {c.speciality && <span className="text-muted-foreground"> · {c.speciality}</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">Gender</legend>
          <div className="flex gap-2">
            {allowed.map((g) => (
              <label
                key={g.value}
                className={cn(
                  "flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm",
                  gender === g.value ? "border-primary bg-primary-soft" : "border-border",
                )}
              >
                <input
                  type="radio"
                  name={`${id}-gender`}
                  className="size-4 accent-primary"
                  checked={gender === g.value}
                  onChange={() => pickGender(g.value)}
                />
                {g.label}
              </label>
            ))}
          </div>
          {audience && (
            <p className="text-sm text-muted-foreground">Will serve {SIDE_LABEL[audience]} at Home.</p>
          )}
        </fieldset>

        {audience && (
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Services</legend>
            <OfferingChecklist offerings={sideOfferings} selected={links} onChange={setLinks} />
          </fieldset>
        )}
      </div>
    </ResponsiveDialog>
  );
}
