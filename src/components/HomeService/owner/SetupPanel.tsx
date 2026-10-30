"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CircleCheck, CirclePause, CircleSlash, Clock, ShieldAlert, type LucideIcon } from "lucide-react";

import { showResultToast } from "@/components/Shared/showResultToast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { SITE } from "@/lib/site";
import { TONE_CLASSES, type Tone } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import { resumeHome } from "@/services/home-service/resumeHome";
import type { OwnerHomeProfile } from "@/services/home-service/types";
import { dayOf, dayText } from "../booking/format";
import { checklistFor, SIDE_LABEL, sideIsOpen, startingSides, type Sides } from "./format";
import { HomeChecklist } from "./HomeChecklist";
import { PauseDialog, TurnOffDialog } from "./SwitchDialogs";
import { useTurnOn } from "./useTurnOn";

type Banner = { tone: Tone; icon: LucideIcon; title: string; text?: string | null };

const bannerOf = ({ profile, bookable }: OwnerHomeProfile, now: number): Banner => {
  if (profile.status === "SUSPENDED") {
    return { tone: "danger", icon: ShieldAlert, title: `Suspended by ${SITE.name}`, text: profile.suspendedReason };
  }
  if (profile.status === "REJECTED") {
    return {
      tone: "danger",
      icon: CircleSlash,
      title: "Rejected",
      text: [profile.statusReason, "Fix this and turn on again."].filter(Boolean).join(" "),
    };
  }
  if (!profile.isOn) return { tone: "neutral", icon: CircleSlash, title: "Off" };
  if (profile.status === "PENDING_REVIEW") {
    return { tone: "warning", icon: Clock, title: `Waiting for ${SITE.name} review` };
  }
  if (profile.pausedUntil && Date.parse(profile.pausedUntil) > now) {
    return {
      tone: "warning",
      icon: CirclePause,
      title: `Paused until ${dayText(dayOf(profile.pausedUntil))}`,
      text: profile.pauseReason,
    };
  }
  if (!bookable.LADIES && !bookable.GENTS) {
    return {
      tone: "warning",
      icon: CirclePause,
      title: "Active, but customers can't book right now",
      text: "Online bookings are paused for this branch, or the side is closed for now.",
    };
  }
  return { tone: "success", icon: CircleCheck, title: "Active" };
};

/** Where the branch stands and, for the owner alone, the switch. */
export function SetupPanel({ home, upcoming }: { home: OwnerHomeProfile; upcoming: number }) {
  const { profile, salon, canSwitch } = home;
  const { turnOn, pending, failing, checklist } = useTurnOn(home);
  const [now] = useState(() => Date.now());
  const [draft, setDraft] = useState<Sides | null>(null);
  const [sides, showSides] = useOptimistic(draft ?? startingSides(home));
  const [resuming, startResume] = useTransition();
  const [pauseOpen, setPauseOpen] = useState(false);
  const [offOpen, setOffOpen] = useState(false);

  const banner = bannerOf(home, now);
  const suspended = profile.status === "SUSPENDED";
  const paused = !!profile.pausedUntil && Date.parse(profile.pausedUntil) > now;

  const changeSide = (key: keyof Sides, value: boolean) => {
    const next = { ...sides, [key]: value };
    if (profile.isOn) turnOn(next, () => showSides(next));
    else setDraft(next);
  };

  const resume = () =>
    startResume(async () => {
      showResultToast(await resumeHome(salon.id));
    });

  return (
    <div className="space-y-6">
      <div
        role="status"
        className={cn("flex items-start gap-3 rounded-2xl p-4", TONE_CLASSES[banner.tone].soft)}
      >
        <banner.icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", TONE_CLASSES[banner.tone].text)} />
        <div className="min-w-0">
          <p className="font-medium">{banner.title}</p>
          {banner.text && <p className="text-sm text-muted-foreground">{banner.text}</p>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sides</CardTitle>
          <CardDescription>Ladies at Home is served by female experts, Gents at Home by male experts.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {home.allowedSides.map((side) => {
            const key = side === "LADIES" ? "ladies" : "gents";
            const open = sideIsOpen(home, side);
            const onlyOne = sides[key] && !sides[side === "LADIES" ? "gents" : "ladies"];
            return (
              <div key={side} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="text-sm font-medium">
                  {SIDE_LABEL[side]} at Home
                  {!open && <span className="ml-2 text-xs font-normal text-muted-foreground">Not open yet</span>}
                </span>
                {canSwitch ? (
                  <Switch
                    aria-label={`${SIDE_LABEL[side]} at Home`}
                    checked={open && sides[key]}
                    disabled={!open || suspended || pending || onlyOne}
                    onCheckedChange={(value) => changeSide(key, value)}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">{sides[key] ? "On" : "Off"}</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {canSwitch && !suspended && (
        <div className="flex flex-wrap gap-2">
          {!profile.isOn && (
            <Button onClick={() => turnOn(sides)} loading={pending} disabled={!sides.ladies && !sides.gents}>
              {profile.status === "REJECTED" ? "Turn on again" : "Turn on"}
            </Button>
          )}
          {profile.isOn && paused && (
            <Button onClick={resume} loading={resuming}>
              Resume
            </Button>
          )}
          {profile.isOn && !paused && profile.status === "ACTIVE" && (
            <Button variant="outline" onClick={() => setPauseOpen(true)}>
              Pause
            </Button>
          )}
          {profile.isOn && (
            <Button variant="outline" onClick={() => setOffOpen(true)}>
              Turn off
            </Button>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
          <CardDescription>What has to stay true for customers to see this branch.</CardDescription>
        </CardHeader>
        <CardContent>
          <HomeChecklist items={checklistFor(checklist, sides)} salonId={salon.id} failing={failing} />
        </CardContent>
      </Card>

      {canSwitch && (
        <>
          <PauseDialog salonId={salon.id} open={pauseOpen} onOpenChange={setPauseOpen} />
          <TurnOffDialog salonId={salon.id} upcoming={upcoming} open={offOpen} onOpenChange={setOffOpen} />
        </>
      )}
    </div>
  );
}
