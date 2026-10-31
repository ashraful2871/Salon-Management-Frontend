"use client";

import { useId, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDhaka } from "@/components/Admin/Timeline";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import type { ApiResponse } from "@/lib/api-types";
import type { AdminSetting, SettingChange } from "@/services/admin/settings/types";
import { boundsText, formatSettingValue, parseNumberDraft, SOURCE_LABELS } from "./format";
import { SettingHistory } from "./SettingHistory";

/** Numbers are drafted as the text typed; everything else as is. */
export const toDraft = (setting: AdminSetting, value: unknown): unknown =>
  setting.kind === "int" || setting.kind === "number" ? String(value ?? "") : value;

export const fromDraft = (setting: AdminSetting, draft: unknown): { value: unknown } | { error: string } => {
  if (setting.kind === "int" || setting.kind === "number") {
    return parseNumberDraft(setting, String(draft));
  }
  return { value: draft };
};

export const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * One setting: value, default, bounds, source, last change, History / Restore.
 * Shared by Platform settings and Home Service's Fees & policy.
 */
export function SettingField({
  setting,
  draft,
  error,
  canEdit,
  onChange,
  control,
  note,
  loadHistory,
}: {
  setting: AdminSetting;
  draft: unknown;
  error: string | null;
  canEdit: boolean;
  onChange: (value: unknown) => void;
  /** A text setting's input instead of a one-line box, or `none` when the page draws its own. */
  control?: "textarea" | "time" | "none";
  /** A line under the help text, e.g. "Applies to new bookings only". */
  note?: ReactNode;
  /** Where History reads from, for a page open to more than settings.view. */
  loadHistory?: (key: string) => Promise<ApiResponse<SettingChange[]>>;
}) {
  const id = useId();
  const source = SOURCE_LABELS[setting.source];
  const range = boundsText(setting);

  const meta = [
    `Default ${formatSettingValue(setting, setting.default)}`,
    range && `Range ${range}`,
    setting.envName && `env ${setting.envName}`,
  ].filter(Boolean);

  const input =
    control === "none" ? null : setting.kind === "boolean" ? (
      <Switch
        id={id}
        checked={Boolean(draft)}
        onCheckedChange={onChange}
        disabled={!canEdit}
        aria-describedby={`${id}-help`}
      />
    ) : setting.kind === "choice" ? (
      <Select value={String(draft)} onValueChange={onChange} disabled={!canEdit}>
        <SelectTrigger id={id} aria-describedby={`${id}-help`} className="sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(setting.options ?? []).map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : control === "textarea" ? (
      <Textarea
        id={id}
        rows={3}
        value={String(draft)}
        onChange={(e) => onChange(e.target.value)}
        disabled={!canEdit}
        aria-invalid={!!error}
        aria-describedby={`${id}-help`}
        className="sm:w-96"
      />
    ) : (
      <Input
        id={id}
        type={control === "time" ? "time" : setting.kind === "text" ? "text" : "number"}
        inputMode={setting.kind === "text" ? "text" : setting.kind === "int" ? "numeric" : "decimal"}
        step={setting.kind === "text" ? undefined : setting.kind === "int" ? 1 : "any"}
        min={setting.bounds.min ?? undefined}
        max={setting.bounds.max ?? undefined}
        value={String(draft)}
        onChange={(e) => onChange(e.target.value)}
        disabled={!canEdit}
        aria-invalid={!!error}
        aria-describedby={`${id}-help`}
        className={setting.kind === "text" && !control ? "sm:w-72" : "sm:w-48"}
      />
    );

  return (
    <div className="space-y-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor={id} className="text-sm font-semibold">
              {setting.label}
            </Label>
            <ToneBadge status={setting.source} tone={source.tone}>
              {source.label}
            </ToneBadge>
            {setting.public && <ToneBadge status="public" tone="neutral">Public</ToneBadge>}
            {setting.approval && <ToneBadge status="approval" tone="warning">Needs approval</ToneBadge>}
            {!canEdit && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" aria-hidden /> Read only
              </span>
            )}
          </div>
          <p id={`${id}-help`} className="text-sm text-muted-foreground">
            {setting.help}
          </p>
          {note && <p className="text-sm text-muted-foreground">{note}</p>}
          <p className="text-xs text-muted-foreground">
            {meta.join(" · ")}
            {setting.updatedAt && (
              <>
                {" · "}Last changed by {setting.updatedBy?.name ?? "Unknown"} at {formatDhaka(setting.updatedAt)}
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
          {input}
          <SettingHistory
            setting={setting}
            canRestore={canEdit}
            onRestore={(value) => onChange(toDraft(setting, value))}
            load={loadHistory}
          />
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
