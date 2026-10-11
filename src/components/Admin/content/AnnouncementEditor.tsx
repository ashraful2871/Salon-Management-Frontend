"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnnouncementBarClient } from "@/components/Shared/AnnouncementBarClient";
import type { Announcement } from "@/services/settings/getPublicSettings";

const EMPTY: Announcement = { message: "", tone: "info", dismissible: true };

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO -> the viewer's local "YYYY-MM-DDTHH:mm" for a datetime-local input. */
const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : undefined);

/** What the API will accept, or the first thing wrong with it. */
export const checkAnnouncement = (a: Announcement | null): string | null => {
  if (!a) return null;
  if (!a.message.trim()) return "Write the message";
  if (a.message.length > 200) return "At most 200 characters";
  if (a.href && !a.href.startsWith("/") && !a.href.startsWith("https://")) {
    return "Link must be a /path or an https:// address";
  }
  if (a.startsAt && a.endsAt && Date.parse(a.startsAt) >= Date.parse(a.endsAt)) {
    return "The end must be after the start";
  }
  return null;
};

/** Drops empty optional fields so an untouched draft compares equal. */
export const tidyAnnouncement = (a: Announcement | null): Announcement | null =>
  a && {
    message: a.message.trim(),
    tone: a.tone,
    dismissible: a.dismissible,
    ...(a.href?.trim() ? { href: a.href.trim() } : {}),
    ...(a.startsAt ? { startsAt: a.startsAt } : {}),
    ...(a.endsAt ? { endsAt: a.endsAt } : {}),
  };

/** The `content.announcement` editor with a live preview of the bar. */
export function AnnouncementEditor({
  value,
  onChange,
  disabled,
}: {
  value: Announcement | null;
  onChange: (value: Announcement | null) => void;
  disabled: boolean;
}) {
  const id = useId();
  const a = value ?? EMPTY;
  const set = (patch: Partial<Announcement>) => onChange({ ...a, ...patch });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch
          id={`${id}-on`}
          checked={value !== null}
          onCheckedChange={(on) => onChange(on ? { ...EMPTY } : null)}
          disabled={disabled}
        />
        <Label htmlFor={`${id}-on`}>Show an announcement</Label>
      </div>

      {value && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-msg`}>Message</Label>
            <Textarea
              id={`${id}-msg`}
              value={a.message}
              maxLength={200}
              rows={2}
              onChange={(e) => set({ message: e.target.value })}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">{a.message.length}/200</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-tone`}>Tone</Label>
              <Select
                value={a.tone}
                onValueChange={(tone) => set({ tone: tone as Announcement["tone"] })}
                disabled={disabled}
              >
                <SelectTrigger id={`${id}-tone`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-href`}>Link (optional)</Label>
              <Input
                id={`${id}-href`}
                value={a.href ?? ""}
                placeholder="/salons or https://…"
                onChange={(e) => set({ href: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-start`}>Starts (optional)</Label>
              <Input
                id={`${id}-start`}
                type="datetime-local"
                value={toLocalInput(a.startsAt)}
                onChange={(e) => set({ startsAt: fromLocalInput(e.target.value) })}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-end`}>Ends (optional)</Label>
              <Input
                id={`${id}-end`}
                type="datetime-local"
                value={toLocalInput(a.endsAt)}
                onChange={(e) => set({ endsAt: fromLocalInput(e.target.value) })}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id={`${id}-dismiss`}
              checked={a.dismissible}
              onCheckedChange={(dismissible) => set({ dismissible })}
              disabled={disabled}
            />
            <Label htmlFor={`${id}-dismiss`}>Visitors can dismiss it</Label>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Preview</p>
            <div className="overflow-hidden rounded-xl border">
              <AnnouncementBarClient
                key={JSON.stringify(a)}
                announcement={{ ...a, message: a.message || "Your message here" }}
                hash="preview"
                preview
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
