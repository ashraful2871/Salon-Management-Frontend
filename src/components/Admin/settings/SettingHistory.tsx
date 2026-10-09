"use client";

import { useState, useTransition } from "react";
import { History, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDhaka } from "@/components/Admin/Timeline";
import { getSettingHistory } from "@/services/admin/settings/getSettingHistory";
import type { AdminSetting, SettingChange } from "@/services/admin/settings/types";
import { formatSettingValue } from "./format";

/**
 * The last 20 changes of one setting, loaded when the popover opens. "Restore"
 * puts the value a change replaced back into the draft; saving it still
 * goes through the section's Save and reason dialog.
 */
export function SettingHistory({
  setting,
  canRestore,
  onRestore,
}: {
  setting: AdminSetting;
  canRestore: boolean;
  onRestore: (value: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  const [changes, setChanges] = useState<SettingChange[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setError(null);
    startTransition(async () => {
      const result = await getSettingHistory(setting.key);
      if (result.success) setChanges(result.data ?? []);
      else setError(result.message);
    });
  };

  return (
    <Popover open={open} onOpenChange={load}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs">
          <History className="mr-1 h-3.5 w-3.5" aria-hidden />
          History
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <p className="border-b px-4 py-2.5 text-sm font-semibold">{setting.label}</p>
        <div className="max-h-80 overflow-y-auto px-4 py-2">
          {pending && !changes ? (
            <p className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading…
            </p>
          ) : error ? (
            <p className="py-3 text-sm text-danger">{error}</p>
          ) : !changes?.length ? (
            <p className="py-3 text-sm text-muted-foreground">
              Never changed here. The value comes from the {setting.source === "env" ? "environment" : "code default"}.
            </p>
          ) : (
            <ol className="divide-y">
              {changes.map((change) => (
                <li key={change.id} className="space-y-1 py-2.5 text-sm">
                  <p>
                    <span className="text-muted-foreground line-through">
                      {formatSettingValue(setting, change.before)}
                    </span>{" "}
                    → <span className="font-medium">{formatSettingValue(setting, change.after)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {change.actor?.name ?? "Unknown"} · {formatDhaka(change.at)}
                  </p>
                  {change.reason && <p className="text-xs">“{change.reason}”</p>}
                  {canRestore && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-1 h-7 px-2 text-xs"
                      onClick={() => {
                        onRestore(change.before);
                        setOpen(false);
                      }}
                    >
                      <RotateCcw className="mr-1 h-3 w-3" aria-hidden />
                      Restore {formatSettingValue(setting, change.before)}
                    </Button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
