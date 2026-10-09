export type SettingGroup =
  | "money"
  | "limits"
  | "flags"
  | "security"
  | "approvals"
  | "retention"
  | "system"
  | "content";

export type SettingKind = "int" | "number" | "boolean" | "announcement";

export type SettingSource = "db" | "env" | "default";

export type SettingPerson = { id: string; name: string; email: string };

export type AdminSetting = {
  key: string;
  group: SettingGroup;
  label: string;
  help: string;
  kind: SettingKind;
  bounds: { min: number | null; max: number | null };
  value: unknown;
  default: unknown;
  envName: string | null;
  source: SettingSource;
  public: boolean;
  approval: boolean;
  tier: 2 | 3;
  /** What a change needs: flags.manage, content.manage or settings.manage. */
  permission: "flags.manage" | "content.manage" | "settings.manage";
  version: number;
  updatedAt: string | null;
  updatedBy: SettingPerson | null;
};

export type AdminSettings = {
  groups: { group: SettingGroup; settings: AdminSetting[] }[];
  /** Env-only names: whether each is set, never its value. */
  env: { name: string; set: boolean }[];
};

export type SettingChange = {
  id: string;
  at: string;
  actor: SettingPerson | null;
  before: unknown;
  after: unknown;
  reason: string | null;
};
