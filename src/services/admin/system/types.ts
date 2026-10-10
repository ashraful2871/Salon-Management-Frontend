// Shapes of `/admin/system/*` and `/ai/status` (backend `modules/Admin/system/`).

export type JobRunStatus = "RUNNING" | "OK" | "FAILED" | "SKIPPED";

export type SystemJob = {
  name: string;
  every: string;
  everyMs: number;
  lastRun: {
    status: JobRunStatus;
    trigger: string;
    startedAt: string;
    finishedAt: string | null;
    durationMs: number | null;
    error: string | null;
    summary: unknown;
  } | null;
  failures24h: number;
  /** This server process's next timer tick; null when jobs are off here. */
  nextRunApprox: string | null;
  safeToRunNow: boolean;
};

export type SystemJobs = { enabled: boolean; jobs: SystemJob[] };

export type JobRunOutcome = {
  status: JobRunStatus;
  runId: string | null;
  durationMs: number;
  summary: unknown;
  error: string | null;
};

export type HealthLevel = "ok" | "warning" | "down" | "off";

type Health = { status: HealthLevel; detail: string };

export type SystemIntegrations = {
  email: Health & {
    provider: string;
    failures24h: number;
    sentSinceBoot: number;
    lastFailureAt: string | null;
    lastError: string | null;
  };
  payments: Health & {
    providers: Array<{
      provider: string;
      label: string;
      enabled: boolean;
      mode: "live" | "sandbox";
      lastSuccessAt: string | null;
      stuck: number;
      tokenExpiresAt: string | null;
      refreshExpiresAt: string | null;
    }>;
  };
  gemini: Health & {
    configured: boolean;
    models: Array<{
      model: string;
      coolingDown: boolean;
      cooldownUntil: string | null;
      timeoutsInARow: number;
      lastFailureAt: string | null;
      lastError: string | null;
    }>;
  };
  tryOn: Health & { enabled: boolean; jobs24h: number; failed24h: number };
  version: { commit: string | null; bootedAt: string };
};

export type SystemStorage = {
  usedBytes: number;
  capBytes: number;
  warnPercent: number;
  percent: number;
  tables: Array<{ table: string; bytes: number; rowsApprox: number; retention: string }>;
};

export type AiIndexStatus = {
  model: string;
  documentVersion: number | string;
  activeSalons: number;
  embedded: number;
  upToDate: number;
  missing: number;
  stale: number;
  geminiConfigured: boolean;
  chatModels: string[];
};
