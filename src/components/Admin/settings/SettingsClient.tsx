"use client";

import { useId, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { reasonText } from "@/components/Admin/users/labels";
import { ErrorState } from "@/components/Shared/ErrorState";
import { PageHeader } from "@/components/Shared/PageHeader";
import { SaveBar } from "@/components/Shared/SaveBar";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import type { ApiResponse } from "@/lib/api-types";
import type { SavedSetting } from "@/services/admin/settings/updateSetting";
import type { AdminSetting, AdminSettings, SettingGroup } from "@/services/admin/settings/types";
import { formatSettingValue, GROUP_LABELS, SETTING_REASONS } from "./format";
import { saveSettings } from "./saveSettings";
import { fromDraft, same, SettingField, toDraft } from "./SettingField";

type Draft = Record<string, unknown>;

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
          {/* content.* is edited on the Content page (/dashboard/admin/content). */}
          {data.groups.filter(({ group }) => group !== "content").map(({ group, settings }) => (
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

  const save = (reason: string): Promise<ApiResponse<SavedSetting>> =>
    saveSettings(
      dirty.map(({ setting, parsed }) => ({ setting, value: (parsed as { value: unknown }).value })),
      reason,
    );

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
