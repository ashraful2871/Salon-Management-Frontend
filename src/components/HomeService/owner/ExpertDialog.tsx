"use client";

import { useId, useState, useTransition } from "react";

import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SITE } from "@/lib/site";
import { setHomeExpertOfferings } from "@/services/home-service/setHomeExpertOfferings";
import { submitHomeExpert } from "@/services/home-service/submitHomeExpert";
import type { HomeOffering, OwnerHomeExpert } from "@/services/home-service/types";
import { updateHomeExpert } from "@/services/home-service/updateHomeExpert";
import { DocSlots } from "./DocSlots";
import { SIDE_LABEL, VERIFICATION_LABEL } from "./format";
import { OfferingChecklist } from "./OfferingChecklist";

const JOBS_MIN = 1;
const JOBS_MAX = 8;

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));

const parseLanguages = (text: string) =>
  text
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

/** One expert: details, services, documents and the way to verification. Keyed by expert, so it reads them once. */
export function ExpertDialog({
  salonId,
  expert,
  offerings,
  open,
  onOpenChange,
  onRemove,
}: {
  salonId: string;
  expert: OwnerHomeExpert;
  offerings: HomeOffering[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const [headline, setHeadline] = useState(expert.headline ?? "");
  const [languages, setLanguages] = useState(expert.languages.join(", "));
  const [maxJobs, setMaxJobs] = useState(String(expert.maxJobsPerDay));
  const [isActive, setIsActive] = useState(expert.isActive);
  const [links, setLinks] = useState(expert.offeringIds ?? []);
  const [pending, start] = useTransition();

  const editable = expert.verification === "DRAFT" || expert.verification === "REJECTED";
  const docsDone = expert.docs.idFront && expert.docs.idBack && expert.docs.selfie;
  const jobs = Number(maxJobs);
  const valid = Number.isInteger(jobs) && jobs >= JOBS_MIN && jobs <= JOBS_MAX;
  const sideOfferings = offerings.filter((o) => o.audience === expert.audience);

  const save = async () => {
    const list = parseLanguages(languages);
    const detailsChanged =
      headline.trim() !== (expert.headline ?? "") ||
      list.join() !== expert.languages.join() ||
      jobs !== expert.maxJobsPerDay ||
      isActive !== expert.isActive;
    if (detailsChanged) {
      const res = await updateHomeExpert(salonId, expert.id, {
        headline: headline.trim() || null,
        languages: list,
        maxJobsPerDay: jobs,
        isActive,
      });
      if (!res.success) {
        showResultToast(res);
        return false;
      }
    }
    if (!sameSet(links, expert.offeringIds ?? [])) {
      const res = await setHomeExpertOfferings(salonId, expert.id, links);
      if (!res.success) {
        showResultToast(res);
        return false;
      }
    }
    return true;
  };

  const saveOnly = () =>
    start(async () => {
      if (await save()) {
        showResultToast({ success: true }, "Expert saved");
        onOpenChange(false);
      }
    });

  const submit = () =>
    start(async () => {
      if (!(await save())) return;
      const res = await submitHomeExpert(salonId, expert.id);
      showResultToast(res, `Sent to ${SITE.name} for verification`);
      if (res.success) onOpenChange(false);
    });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={expert.staff.name}
      description={`${SIDE_LABEL[expert.audience]} at Home`}
      footer={
        <>
          <Button variant="outline" onClick={saveOnly} loading={pending} disabled={!valid}>
            Save
          </Button>
          {editable && (
            <Button onClick={submit} loading={pending} disabled={!valid || !docsDone || links.length === 0}>
              {expert.verification === "REJECTED" ? "Submit again" : "Submit for verification"}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <ToneBadge status={expert.verification}>{VERIFICATION_LABEL[expert.verification]}</ToneBadge>
          {expert.verification === "PENDING" && (
            <span className="text-sm text-muted-foreground">Waiting for {SITE.name} to check the documents.</span>
          )}
        </div>
        {(expert.verification === "REJECTED" || expert.verification === "SUSPENDED") && expert.rejectReason && (
          <p className="rounded-xl bg-danger-soft p-3 text-sm">{expert.rejectReason}</p>
        )}

        <section className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-headline`}>Headline</Label>
            <Input
              id={`${id}-headline`}
              value={headline}
              maxLength={80}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-languages`}>Languages</Label>
            <Input
              id={`${id}-languages`}
              value={languages}
              placeholder="Bangla, English"
              onChange={(e) => setLanguages(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Up to 5, separated by commas.</p>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-jobs`}>Max jobs a day</Label>
              <Input
                id={`${id}-jobs`}
                type="number"
                inputMode="numeric"
                className="w-24"
                min={JOBS_MIN}
                max={JOBS_MAX}
                value={maxJobs}
                onChange={(e) => setMaxJobs(e.target.value)}
              />
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
              <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Taking home visits" />
              Taking home visits
            </label>
          </div>
        </section>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">Services</legend>
          <OfferingChecklist offerings={sideOfferings} selected={links} onChange={setLinks} />
        </fieldset>

        {editable && (
          <section aria-labelledby={`${id}-docs`} className="space-y-1.5">
            <h3 id={`${id}-docs`} className="text-sm font-medium">
              Documents
            </h3>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WEBP or PDF, up to 8 MB. Private: only {SITE.name}&apos;s verifier sees them.
            </p>
            <DocSlots salonId={salonId} expert={expert} />
          </section>
        )}

        <div className="border-t border-border pt-4">
          <Button variant="ghost" className="text-danger hover:text-danger" onClick={onRemove} disabled={pending}>
            Remove expert
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
