"use client";

import { useState, useTransition } from "react";
import { Bell, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  saveNotificationPrefs,
  setBookingEmailMode,
} from "@/services/notifications/notificationPrefActions";
import type {
  BookingEmailMode,
  NotificationPrefRow,
  NotificationPrefs,
} from "@/services/notifications/notification-types";

const MODES: { value: BookingEmailMode; label: string; hint: string }[] = [
  { value: "EVERY", label: "Every booking", hint: "One email per new booking" },
  { value: "DIGEST", label: "Daily digest", hint: "08:00, yesterday per branch" },
  { value: "NONE", label: "No emails", hint: "In the app only" },
];

/**
 * Settings → Notifications: event × channel (in app, email) and, for owners,
 * how new-booking emails arrive. Each switch saves on its own; the row shows
 * pending until the API answers and reverts if it refuses.
 */
export function NotificationPrefsCard({ initial }: { initial: NotificationPrefs }) {
  const [rows, setRows] = useState(initial.events);
  const [mode, setMode] = useState(initial.bookingEmailMode);
  const [pendingEvent, setPendingEvent] = useState<string | null>(null);
  const [, startSaving] = useTransition();
  const [modePending, startMode] = useTransition();

  const toggle = (row: NotificationPrefRow, channel: "email" | "inApp", value: boolean) => {
    const next = { ...row, [channel]: value };
    setRows((all) => all.map((r) => (r.event === row.event ? next : r)));
    setPendingEvent(row.event);
    startSaving(async () => {
      const result = await saveNotificationPrefs([{ event: next.event, email: next.email, inApp: next.inApp }]);
      setPendingEvent(null);
      if (!result.success) {
        setRows((all) => all.map((r) => (r.event === row.event ? row : r)));
        toast.error(result.message || "Couldn't save that.");
      }
    });
  };

  const pickMode = (value: BookingEmailMode) => {
    const before = mode;
    setMode(value);
    startMode(async () => {
      const result = await setBookingEmailMode(value);
      if (!result.success) {
        setMode(before);
        toast.error(result.message || "Couldn't change booking emails.");
      } else {
        toast.success("Booking emails updated");
      }
    });
  };

  const groups = [...new Set(rows.map((r) => r.group))];

  return (
    <Card id="notifications" className="scroll-mt-24">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20">
            <Bell className="h-5 w-5 text-gold" />
          </div>
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>What reaches you in the app and by email.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {mode && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">New-booking emails</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {MODES.map((m) => (
                <label
                  key={m.value}
                  className={cn(
                    "flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    mode === m.value ? "border-primary bg-primary-soft" : "border-border hover:bg-muted",
                    modePending && "opacity-70",
                  )}
                >
                  <input
                    type="radio"
                    name="bookingEmailMode"
                    value={m.value}
                    checked={mode === m.value}
                    onChange={() => pickMode(m.value)}
                    disabled={modePending}
                    className="sr-only"
                  />
                  <span className="font-medium">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[20rem] text-sm">
            <caption className="sr-only">Notification channels per event</caption>
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th scope="col" className="pb-2 font-medium">Event</th>
                <th scope="col" className="w-20 pb-2 text-center font-medium">In app</th>
                <th scope="col" className="w-20 pb-2 text-center font-medium">Email</th>
              </tr>
            </thead>
            {groups.map((group) => (
              <tbody key={group}>
                <tr>
                  <th scope="rowgroup" colSpan={3} className="pt-3 pb-1 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {group}
                  </th>
                </tr>
                {rows
                  .filter((r) => r.group === group)
                  .map((r) => (
                    <tr key={r.event} className={cn("border-t border-border", pendingEvent === r.event && "opacity-60")}>
                      <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                        {r.label}
                      </th>
                      <td className="py-2.5 text-center">
                        <Switch
                          checked={r.inApp}
                          onCheckedChange={(v) => toggle(r, "inApp", v)}
                          aria-label={`${r.label}: in app`}
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        {r.emailByMode ? (
                          <span className="text-xs text-muted-foreground">Above</span>
                        ) : r.emailLocked ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Always emailed">
                            <Lock aria-hidden="true" className="size-3" /> Always
                          </span>
                        ) : (
                          <Switch
                            checked={r.email}
                            onCheckedChange={(v) => toggle(r, "email", v)}
                            aria-label={`${r.label}: email`}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            ))}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
