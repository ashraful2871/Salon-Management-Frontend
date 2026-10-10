import type { Metadata } from "next";
import { PageHeader } from "@/components/Shared/PageHeader";
import { ErrorState } from "@/components/Shared/ErrorState";
import { AiIndexCard } from "@/components/Admin/system/AiIndexCard";
import { IntegrationCards } from "@/components/Admin/system/IntegrationCards";
import { JobsList } from "@/components/Admin/system/JobsList";
import { StorageMeter } from "@/components/Admin/system/StorageMeter";
import { formatDhaka } from "@/components/Admin/Timeline";
import { shortSha } from "@/components/Admin/system/format";
import { can } from "@/lib/admin-permissions";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAiIndexStatus } from "@/services/admin/system/getAiIndexStatus";
import { getSystemIntegrations } from "@/services/admin/system/getSystemIntegrations";
import { getSystemJobs } from "@/services/admin/system/getSystemJobs";
import { getSystemStorage } from "@/services/admin/system/getSystemStorage";

export const metadata: Metadata = { title: "System health | Admin" };

const nowMs = () => Date.now();

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 space-y-3">
      <div>
        <h2 id={`${id}-title`} className="font-heading text-lg font-semibold">
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * Is the platform healthy? Background jobs, the outside services it depends
 * on, the AI index and database storage — without opening Render logs.
 */
export default async function SystemHealthPage() {
  const [me, jobs, integrations, storage, ai] = await Promise.all([
    getAdminMe(),
    getSystemJobs(),
    getSystemIntegrations(),
    getSystemStorage(),
    getAiIndexStatus(),
  ]);
  const permissions = me.success ? (me.data?.permissions ?? []) : [];
  const canOperate = can(permissions, "system.operate");
  const now = nowMs();

  return (
    <div className="min-w-0 space-y-8">
      <PageHeader
        title="System health"
        description="Jobs, integrations, the AI index and storage. Failures email the admins who turned on alerts (Team page)."
      />

      <Section id="integrations" title="Integrations">
        {integrations.success && integrations.data ? (
          <IntegrationCards data={integrations.data} nowMs={now} />
        ) : (
          <ErrorState message={integrations.message} />
        )}
      </Section>

      <Section
        id="jobs"
        title="Background jobs"
        description={
          jobs.success && jobs.data && !jobs.data.enabled
            ? "Background jobs are turned off on this server (DISABLE_BACKGROUND_JOBS)."
            : "Every run is recorded for 14 days. “Run now” is offered only for jobs that are safe to repeat."
        }
      >
        {jobs.success && jobs.data ? (
          <JobsList jobs={jobs.data.jobs} nowMs={now} canOperate={canOperate} />
        ) : (
          <ErrorState message={jobs.message} />
        )}
      </Section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Section id="ai" title="AI search index">
          {ai.success && ai.data ? (
            <AiIndexCard status={ai.data} canOperate={canOperate} />
          ) : (
            <ErrorState message={ai.message} />
          )}
        </Section>

        <Section id="storage" title="Storage">
          {storage.success && storage.data ? <StorageMeter data={storage.data} /> : <ErrorState message={storage.message} />}
        </Section>
      </div>

      <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
        Backend <span className="font-mono">{shortSha(integrations.data?.version.commit)}</span>
        {integrations.data?.version.bootedAt && <> (up since {formatDhaka(integrations.data.version.bootedAt)})</>}
        {" · "}Frontend <span className="font-mono">{shortSha(process.env.VERCEL_GIT_COMMIT_SHA)}</span>
      </footer>
    </div>
  );
}
