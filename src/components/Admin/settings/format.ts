import { formatBDT } from "@/lib/money";
import type { Announcement } from "@/services/settings/getPublicSettings";
import type { AdminSetting, SettingGroup, SettingSource } from "@/services/admin/settings/types";
import type { Tone } from "@/lib/status-tone";
import type { ReasonCode } from "../ReasonDialog";

export const GROUP_LABELS: Record<SettingGroup, { title: string; description: string }> = {
  money: { title: "Money", description: "Commission, deposits and fees. Amounts are in poisha (100 = ৳1)." },
  limits: { title: "Limits", description: "Ceilings and timings the booking flow and jobs work to." },
  flags: { title: "Feature switches", description: "Kill switches. A change reaches the API within 30 s and the site within about a minute." },
  security: { title: "Security", description: "How the admin console protects sensitive actions." },
  approvals: { title: "Approvals", description: "Four-eyes rules for large money moves." },
  retention: { title: "Retention", description: "How long records are kept." },
  system: { title: "System", description: "Hosting limits the health checks compare against." },
  content: { title: "Content", description: "What visitors see on the public site." },
};

export const SOURCE_LABELS: Record<SettingSource, { label: string; tone: Tone }> = {
  db: { label: "Edited", tone: "primary" },
  env: { label: "From env", tone: "info" },
  default: { label: "Default", tone: "neutral" },
};

export const SETTING_REASONS: ReasonCode[] = [
  { value: "TUNING", label: "Routine tuning" },
  { value: "INCIDENT", label: "Incident response" },
  { value: "ROLLBACK", label: "Rolling back a change" },
  { value: "OTHER", label: "Other" },
];

const isMoney = (key: string) => key.endsWith("Minor");

export const formatSettingValue = (setting: Pick<AdminSetting, "key" | "kind">, value: unknown): string => {
  if (value === null || value === undefined) return "None";
  if (setting.kind === "boolean") return value ? "On" : "Off";
  if (setting.kind === "announcement") {
    const a = value as Announcement;
    return `“${a.message.length > 60 ? `${a.message.slice(0, 60)}…` : a.message}”`;
  }
  if (typeof value === "number") {
    return isMoney(setting.key) ? `${value.toLocaleString("en-US")} (${formatBDT(value)})` : value.toLocaleString("en-US");
  }
  return String(value);
};

/** A numeric draft (kept as typed text) parsed and checked against the bounds. */
export const parseNumberDraft = (
  setting: Pick<AdminSetting, "kind" | "bounds">,
  text: string,
): { value: number } | { error: string } => {
  if (text.trim() === "") return { error: "Enter a number" };
  const n = Number(text);
  if (!Number.isFinite(n)) return { error: "Enter a number" };
  if (setting.kind === "int" && !Number.isInteger(n)) return { error: "Whole numbers only" };
  const { min, max } = setting.bounds;
  if (min !== null && n < min) return { error: `At least ${min.toLocaleString("en-US")}` };
  if (max !== null && n > max) return { error: `At most ${max.toLocaleString("en-US")}` };
  return { value: n };
};

export const boundsText = (setting: Pick<AdminSetting, "kind" | "bounds">) => {
  if (setting.kind !== "int" && setting.kind !== "number") return null;
  const { min, max } = setting.bounds;
  const f = (n: number) => n.toLocaleString("en-US");
  if (min !== null && max !== null) return `${f(min)}–${f(max)}`;
  if (min !== null) return `≥ ${f(min)}`;
  return null;
};
