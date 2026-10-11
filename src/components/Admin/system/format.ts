import type { Tone } from "@/lib/status-tone";
import type { HealthLevel, JobRunStatus } from "@/services/admin/system/types";

export const LEVEL_TONE: Record<HealthLevel, Tone> = {
  ok: "success",
  warning: "warning",
  down: "danger",
  off: "neutral",
};

export const LEVEL_LABEL: Record<HealthLevel, string> = {
  ok: "OK",
  warning: "Warning",
  down: "Down",
  off: "Off",
};

export const RUN_TONE: Record<JobRunStatus, Tone> = {
  OK: "success",
  FAILED: "danger",
  SKIPPED: "neutral",
  RUNNING: "info",
};

/** The worst of several levels ("off" counts as fine). */
export const worstLevel = (levels: HealthLevel[]): HealthLevel =>
  levels.includes("down") ? "down" : levels.includes("warning") ? "warning" : "ok";

export const formatBytes = (bytes: number) => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${bytes} B`;
};

export const formatDuration = (ms: number | null | undefined) => {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms / 60_000)} min`;
};

/** "40 s ago", "12 min ago", "3 h ago", "2 d ago"; "in 4 min" for the future. */
export const relativeTime = (at: string | null | undefined, now: number) => {
  if (!at) return "Never";
  const diff = now - new Date(at).getTime();
  const future = diff < 0;
  const s = Math.abs(diff) / 1000;
  const text =
    s < 60
      ? `${Math.max(1, Math.round(s))} s`
      : s < 3600
        ? `${Math.round(s / 60)} min`
        : s < 172_800
          ? `${Math.round(s / 3600)} h`
          : `${Math.round(s / 86_400)} d`;
  return future ? `in ${text}` : `${text} ago`;
};

/** Storage colour: fine below the warning line, warning past it, danger at 90%. */
export const storageTone = (percent: number, warnPercent: number): Tone =>
  percent >= 90 ? "danger" : percent >= warnPercent ? "warning" : "success";

export const shortSha = (sha: string | null | undefined) => (sha ? sha.slice(0, 7) : "local");
