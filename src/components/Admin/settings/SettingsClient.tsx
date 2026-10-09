"use client";

import { useId, useState } from "react";
import { Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { formatDhaka } from "@/components/Admin/Timeline";
import { reasonText } from "@/components/Admin/users/labels";
import { ErrorState } from "@/components/Shared/ErrorState";
import { PageHeader } from "@/components/Shared/PageHeader";
import { SaveBar } from "@/components/Shared/SaveBar";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import type { ApiResponse } from "@/lib/api-types";
import { updateSetting, type SavedSetting } from "@/services/admin/settings/updateSetting";
import type { AdminSetting, AdminSettings, SettingGroup } from "@/services/admin/settings/types";
import type { Announcement } from "@/services/settings/getPublicSettings";
import { AnnouncementEditor, checkAnnouncement, tidyAnnouncement } from "./AnnouncementEditor";
import {
  boundsText,
  formatSettingValue,
  GROUP_LABELS,
  parseNumberDraft,
  SETTING_REASONS,
  SOURCE_LABELS,
} from "./format";
import { SettingHistory } from "./SettingHistory";

/** Numbers are drafted as the text typed; booleans and the announcement as is. */
type Draft = Record<string, unknown>;

const toDraft = (setting: AdminSetting, value: unknown): unknown =>
  setting.kind === "int" || setting.kind === "number" ? String(value ?? "") : value;

const fromDraft = (setting: AdminSetting, draft: unknown): { value: unknown } | { error: string } => {
  if (setting.kind === "int" || setting.kind === "number") {
    return parseNumberDraft(setting, String(draft));
  }
  if (setting.kind === "announcement") {
    const a = tidyAnnouncement(draft as Announcement | null);
    const error = checkAnnouncement(a);
    return error ? { error } : { value: a };
  }
  return { value: draft };
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function SettingsClient({
  response,
  permissions,
}: {
  response: ApiResponse<AdminSettings>;
  permissions: string[];
}) {
  const data = response.success ? response.data : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform settings"
        description="Values the platform runs on, changed without a deploy. Every change needs a reason and is kept in its history."
      />
      {!data ? (
        <ErrorState title="Couldn't load the settings" message={response.message} />
      ) : (
        <>
          {data.groups.map(({ group, settings }) => (
            <SettingsSection
              // Remount after a save: the server's new versions replace the draft.
              key={`${group}:${settings.map((s) => s.version).join(",")}`}
              group={group}
              settings={settings}
              permissions={permissions}
            />
          ))}
          <EnvironmentSection env={data.env} />
        </>
      )}
    </div>
  );
}

function SettingsSection({
  group,
  settings,
  permissions,
}: {
  group: SettingGroup;
  settings: AdminSetting[];
  permissions: string[];
}) {
  const initial = (): Draft =>
    Object.fromEntries(settings.map((s) => [s.key, toDraft(s, s.value)]));
  const [draft, setDraft] = useState<Draft>(initial);
  const [confirming, setConfirming] = useState(false);
  const formId = useId();

  const changed = settings
    .filter((s) => !same(draft[s.key], toDraft(s, s.value)))
    .map((s) => ({ setting: s, parsed: fromDraft(s, draft[s.key]) }));
  const invalid = changed.some((c) => "error" in c.parsed);
  const dirty = changed.filter((c) => "value" in c.parsed && !same((c.parsed as { value: unknown }).value, c.setting.value));
  const needsStepUp = dirty.some((c) => c.setting.tier === 3);
  const { title, description } = GROUP_LABELS[group];

  const save = async (reason: string): Promise<ApiResponse<SavedSetting>> => {
    // Tier 3 first: a step-up prompt then comes before anything is written.
    const ordered = [...dirty].sort((a, b) => b.setting.tier - a.setting.tier);
    let last: ApiResponse<SavedSetting> = { success: false, message: "Nothing to save" };
    for (const [i, { setting, parsed }] of ordered.entries()) {
      last = await updateSetting(setting.key, (parsed as { value: unknown }).value, reason);
      if (!last.success) {
        return i === 0 ? last : { ...last, message: `Saved ${i} of ${ordered.length}. ${last.message}` };
      }
    }
    return {
      ...last,
      message: ordered.length === 1 ? `${ordered[0].setting.label} saved` : `${ordered.length} settings saved`,
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            if (dirty.length && !invalid) setConfirming(true);
          }}
          className="divide-y"
        >
          {settings.map((setting) => (
            <SettingField
              key={setting.key}
              setting={setting}
              draft={draft[setting.key]}
              error={(() => {
                const c = changed.find((x) => x.setting.key === setting.key);
                return c && "error" in c.parsed ? c.parsed.error : null;
              })()}
              canEdit={permissions.includes(setting.permission)}
              onChange={(value) => setDraft((d) => ({ ...d, [setting.key]: value }))}
            />
          ))}
        </form>
        <SaveBar
          show={dirty.length > 0 || invalid}
          message={
            invalid
              ? "Fix the highlighted values"
              : `${dirty.length} unsaved change${dirty.length === 1 ? "" : "s"}`
          }
          form={formId}
          disabled={invalid || dirty.length === 0}
          onDiscard={() => setDraft(initial())}
          className="mt-4"
        />
      </CardContent>

      {confirming && (
        <ReasonDialog<SavedSetting>
          open
          onOpenChange={setConfirming}
          title={`Save ${title.toLowerCase()} changes`}
          description={
            <span className="block space-y-1">
              {dirty.map(({ setting, parsed }) => (
                <span key={setting.key} className="block">
                  <span className="font-medium">{setting.label}:</span>{" "}
                  {formatSettingValue(setting, setting.value)} →{" "}
                  {formatSettingValue(setting, (parsed as { value: unknown }).value)}
                </span>
              ))}
            </span>
          }
          reasonCodes={SETTING_REASONS}
          confirmLabel="Save"
          showNotify={false}
          stepUp={needsStepUp}
          onConfirm={(input) => save(reasonText(SETTING_REASONS, input))}
          onDone={(result) => showResultToast(result)}
        />
      )}
    </Card>
  );
}

function SettingField({
  setting,
  draft,
  error,
  canEdit,
  onChange,
}: {
  setting: AdminSetting;
  draft: unknown;
  error: string | null;
  canEdit: boolean;
  onChange: (value: unknown) => void;
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
    setting.kind === "announcement" ? null : setting.kind === "boolean" ? (
      <Switch
        id={id}
        checked={Boolean(draft)}
        onCheckedChange={onChange}
        disabled={!canEdit}
        aria-describedby={`${id}-help`}
      />
    ) : (
      <Input
        id={id}
        type="number"
        inputMode={setting.kind === "int" ? "numeric" : "decimal"}
        step={setting.kind === "int" ? 1 : "any"}
        min={setting.bounds.min ?? undefined}
        max={setting.bounds.max ?? undefined}
        value={String(draft)}
        onChange={(e) => onChange(e.target.value)}
        disabled={!canEdit}
        aria-invalid={!!error}
        aria-describedby={`${id}-help`}
        className="sm:w-48"
      />
    );

  return (
    <div className="space-y-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor={setting.kind === "announcement" ? undefined : id} className="text-sm font-semibold">
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
          />
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {setting.kind === "announcement" && (
        <AnnouncementEditor
          value={draft as Announcement | null}
          onChange={onChange}
          disabled={!canEdit}
        />
      )}
    </div>
  );
}

function EnvironmentSection({ env }: { env: AdminSettings["env"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment</CardTitle>
        <CardDescription>
          Set on the host, not here. Only whether each is set is shown, never its value.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {env.map(({ name, set }) => (
            <li key={name} className="flex items-center justify-between gap-3 text-sm">
              <code className="min-w-0 truncate font-mono text-xs">{name}</code>
              <ToneBadge status={set ? "set" : "missing"} tone={set ? "success" : "neutral"}>
                {set ? "Set" : "Missing"}
              </ToneBadge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
