"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Appointment } from "@/lib/api-types";
import { StatusBadge } from "./StatusBadge";
import { PaymentBadge } from "./PaymentBadge";
import { NextAction } from "./NextAction";
import { formatTime12 } from "./format";

const DONE = new Set(["COMPLETED", "CANCELLED", "NO_SHOW"]);

// Serial is the slot's position in the day, so it is the calling order. Rows
// without one (older bookings) fall back to their start time.
const bySerial = (a: Appointment, b: Appointment) =>
  (a.serialNumber ?? Infinity) - (b.serialNumber ?? Infinity) ||
  a.startTime.localeCompare(b.startTime);

export const TodayQueue = ({ appointments }: { appointments: Appointment[] }) => {
  const [showCancelled, setShowCancelled] = useState(false);

  const cancelledCount = appointments.filter(
    (a) => a.status === "CANCELLED",
  ).length;

  // One line per service and counter, which is how serials are numbered.
  const lines = useMemo(() => {
    const byLine = new Map<string, Appointment[]>();
    for (const a of appointments) {
      if (a.status === "CANCELLED" && !showCancelled) continue;
      const key = `${a.service?.name ?? "Service"} · ${a.counter?.name ?? "No counter"}`;
      byLine.set(key, [...(byLine.get(key) ?? []), a]);
    }
    return [...byLine.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, rows]) => ({ key, rows: rows.sort(bySerial) }));
  }, [appointments, showCancelled]);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Today&apos;s queue</CardTitle>
        <div className="flex items-center gap-2">
          <Switch
            id="queue-show-cancelled"
            checked={showCancelled}
            onCheckedChange={setShowCancelled}
          />
          <Label htmlFor="queue-show-cancelled" className="text-sm font-normal">
            Show cancelled{cancelledCount > 0 && ` (${cancelledCount})`}
          </Label>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {lines.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No bookings in today&apos;s queue.
          </p>
        ) : (
          lines.map(({ key, rows }) => {
            const waiting = rows.filter((r) => !DONE.has(r.status)).length;
            return (
              <section key={key} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold">{key}</h3>
                  <span className="text-xs text-muted-foreground">
                    {waiting} waiting · {rows.length - waiting} done
                  </span>
                </div>

                <ul className="space-y-2">
                  {rows.map((a) => {
                    const name =
                      a.customer?.name?.trim() || a.customer?.email || "Unknown";
                    return (
                      <li
                        key={a.id}
                        className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                          DONE.has(a.status) ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="inline-flex items-center justify-center min-w-9 h-9 px-2 rounded-md bg-primary/10 text-primary text-sm font-bold tabular-nums">
                            {a.serialNumber != null ? `#${a.serialNumber}` : "—"}
                          </span>
                          <span className="text-sm font-bold tabular-nums whitespace-nowrap">
                            {formatTime12(a.startTime)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {name}
                              {a.customer?.phone && (
                                <span className="font-normal text-muted-foreground">
                                  {" "}
                                  ({a.customer.phone})
                                </span>
                              )}
                            </p>
                            {a.token && (
                              <p className="text-[11px] font-mono font-semibold tracking-wider text-muted-foreground">
                                {a.token}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <StatusBadge status={a.status} />
                          <PaymentBadge appointment={a} viewer="owner" />
                          <NextAction appointment={a} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
