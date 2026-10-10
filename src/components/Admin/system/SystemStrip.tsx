import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { getSystemIntegrations } from "@/services/admin/system/getSystemIntegrations";
import { getSystemJobs } from "@/services/admin/system/getSystemJobs";
import { getSystemStorage } from "@/services/admin/system/getSystemStorage";
import type { HealthLevel } from "@/services/admin/system/types";
import { formatBytes, LEVEL_LABEL, LEVEL_TONE, storageTone, worstLevel } from "./format";

/** Home's one-line System health: jobs, the four integrations, storage. */
export async function SystemStrip() {
  const [jobs, integrations, storage] = await Promise.all([
    getSystemJobs(),
    getSystemIntegrations(),
    getSystemStorage(),
  ]);

  const failing = jobs.success ? (jobs.data?.jobs ?? []).filter((j) => j.lastRun?.status === "FAILED").length : null;
  const i = integrations.success ? integrations.data : null;
  const s = storage.success ? storage.data : null;
  const items: Array<{ label: string; level: HealthLevel; text: string }> = [];

  if (failing !== null) {
    items.push({
      label: "Jobs",
      level: failing > 0 ? "down" : "ok",
      text: failing > 0 ? `${failing} failing` : "All OK",
    });
  }
  if (i) {
    for (const [label, part] of [
      ["Email", i.email],
      ["Payments", i.payments],
      ["Gemini", i.gemini],
      ["Try-on", i.tryOn],
    ] as const) {
      items.push({ label, level: part.status, text: LEVEL_LABEL[part.status] });
    }
  }

  const overall = worstLevel(items.map((item) => item.level));
  const storageLevel = s ? storageTone(s.percent, s.warnPercent) : null;

  return (
    <section
      aria-labelledby="home-system"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-border bg-surface px-4 py-3"
    >
      <h2 id="home-system" className="font-heading text-sm font-semibold">
        System health
      </h2>
      {items.length === 0 && !s ? (
        <p className="text-sm text-muted-foreground">Couldn&apos;t load the system status.</p>
      ) : (
        <ul className="flex flex-wrap items-center gap-2">
          {items.map((item) => (
            <li key={item.label}>
              <ToneBadge status={item.level} tone={LEVEL_TONE[item.level]} dot>
                {item.label}: {item.text}
              </ToneBadge>
            </li>
          ))}
          {s && storageLevel && (
            <li>
              <ToneBadge status="storage" tone={storageLevel} dot>
                Storage: {formatBytes(s.usedBytes)} ({s.percent}%)
              </ToneBadge>
            </li>
          )}
        </ul>
      )}
      <Link
        href="/dashboard/admin/system"
        className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primary-hover hover:underline"
      >
        {overall === "ok" ? "Details" : "Investigate"}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}

export function SystemStripSkeleton() {
  return <div aria-hidden="true" className="h-12 animate-pulse rounded-2xl bg-muted" />;
}
