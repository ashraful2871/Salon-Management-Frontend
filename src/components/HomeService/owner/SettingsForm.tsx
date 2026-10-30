"use client";

import { useId, useState, useTransition } from "react";

import { SaveBar } from "@/components/Shared/SaveBar";
import { showResultToast } from "@/components/Shared/showResultToast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBDT, toMinor, toTaka } from "@/lib/money";
import { SITE } from "@/lib/site";
import { updateHomeProfile } from "@/services/home-service/updateHomeProfile";
import type { HomeProfileSettingsInput, HomeServiceProfile, OwnerHomeProfile } from "@/services/home-service/types";

const RADIUS_MIN = 0.5;
const BUFFER_MIN = 15;
const BUFFER_MAX = 90;

type Form = {
  radiusKm: number;
  travelFee: string;
  minOrder: string;
  travelBufferMin: string;
  dayStart: string;
  dayEnd: string;
};

const formOf = (p: HomeServiceProfile, maxRadiusKm: number): Form => ({
  radiusKm: Math.min(p.radiusKm, maxRadiusKm),
  travelFee: String(toTaka(p.travelFeeMinor)),
  minOrder: String(toTaka(p.minOrderMinor)),
  travelBufferMin: String(p.travelBufferMin),
  dayStart: p.dayStart,
  dayEnd: p.dayEnd,
});

/** Zero-padded HH:MM compares correctly as text. */
const clampTime = (value: string, min: string, max: string) => (value < min ? min : value > max ? max : value);

/** The branch's own numbers, inside the caps the platform sets. Keyed by the parent, so a save re-seeds it. */
export function SettingsForm({ home }: { home: OwnerHomeProfile }) {
  const { platform, profile, salon } = home;
  const id = useId();
  const field = (name: string) => `${id}-${name}`;
  const saved = formOf(profile, platform.maxRadiusKm);
  const [form, setForm] = useState(saved);
  const [pending, start] = useTransition();

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const feeEnabled = platform.travelFeeMaxMinor > 0;
  const feeMinor = toMinor(Number(form.travelFee) || 0);
  const minOrderMinor = toMinor(Number(form.minOrder) || 0);
  const buffer = Number(form.travelBufferMin);

  const dirty = (Object.keys(form) as (keyof Form)[]).some((k) => form[k] !== saved[k]);
  const valid =
    feeMinor <= platform.travelFeeMaxMinor &&
    minOrderMinor >= platform.minOrderMinMinor &&
    minOrderMinor <= platform.minOrderMaxMinor &&
    Number.isInteger(buffer) &&
    buffer >= BUFFER_MIN &&
    buffer <= BUFFER_MAX &&
    form.dayStart < form.dayEnd;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!dirty || !valid) return;
    const input: HomeProfileSettingsInput = { salonId: salon.id };
    if (form.radiusKm !== saved.radiusKm) input.radiusKm = form.radiusKm;
    if (form.travelFee !== saved.travelFee) input.travelFeeMinor = feeMinor;
    if (form.minOrder !== saved.minOrder) input.minOrderMinor = minOrderMinor;
    if (form.travelBufferMin !== saved.travelBufferMin) input.travelBufferMin = buffer;
    if (form.dayStart !== saved.dayStart) input.dayStart = form.dayStart;
    if (form.dayEnd !== saved.dayEnd) input.dayEnd = form.dayEnd;
    start(async () => {
      showResultToast(await updateHomeProfile(input));
    });
  };

  return (
    <form id={field("form")} onSubmit={submit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Branch settings</CardTitle>
          <CardDescription>Changes apply to new bookings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor={field("radius")}>Service radius</Label>
              <output htmlFor={field("radius")} className="text-sm font-medium tabular-nums">
                {form.radiusKm} km
              </output>
            </div>
            <input
              id={field("radius")}
              type="range"
              className="h-11 w-full cursor-pointer accent-primary"
              min={RADIUS_MIN}
              max={platform.maxRadiusKm}
              step={0.5}
              value={form.radiusKm}
              onChange={(e) => set("radiusKm", Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Up to {platform.maxRadiusKm} km from the branch.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={field("fee")}>Travel fee (৳)</Label>
              <Input
                id={field("fee")}
                type="number"
                inputMode="numeric"
                min={0}
                max={toTaka(platform.travelFeeMaxMinor)}
                value={form.travelFee}
                disabled={!feeEnabled}
                onChange={(e) => set("travelFee", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {feeEnabled ? `Up to ${formatBDT(platform.travelFeeMaxMinor)}.` : `Not enabled by ${SITE.name} yet`}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={field("minOrder")}>Minimum order (৳)</Label>
              <Input
                id={field("minOrder")}
                type="number"
                inputMode="numeric"
                min={toTaka(platform.minOrderMinMinor)}
                max={toTaka(platform.minOrderMaxMinor)}
                value={form.minOrder}
                onChange={(e) => set("minOrder", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {formatBDT(platform.minOrderMinMinor)} to {formatBDT(platform.minOrderMaxMinor)}.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={field("buffer")}>Travel buffer (minutes)</Label>
              <Input
                id={field("buffer")}
                type="number"
                inputMode="numeric"
                min={BUFFER_MIN}
                max={BUFFER_MAX}
                step={5}
                value={form.travelBufferMin}
                onChange={(e) => set("travelBufferMin", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Kept free before and after each visit, {BUFFER_MIN} to {BUFFER_MAX} minutes.
              </p>
            </div>
          </div>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Home hours</legend>
            <div className="grid grid-cols-2 gap-3">
              {(["dayStart", "dayEnd"] as const).map((key) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={field(key)} className="text-xs text-muted-foreground">
                    {key === "dayStart" ? "From" : "To"}
                  </Label>
                  <Input
                    id={field(key)}
                    type="time"
                    step={1800}
                    min={platform.dayStartBound}
                    max={platform.dayEndBound}
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    onBlur={(e) =>
                      e.target.value &&
                      set(key, clampTime(e.target.value, platform.dayStartBound, platform.dayEndBound))
                    }
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Between {platform.dayStartBound} and {platform.dayEndBound}. Ladies visits start by{" "}
              {platform.ladiesLastStart}.
            </p>
          </fieldset>
        </CardContent>
      </Card>

      <SaveBar
        show={dirty}
        pending={pending}
        form={field("form")}
        disabled={!valid}
        message={valid ? "Unsaved changes" : "Check the values above"}
        onDiscard={() => setForm(saved)}
      />
    </form>
  );
}
