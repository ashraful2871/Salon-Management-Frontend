import { ChartCard } from "@/components/Admin/analytics/ChartCard";
import { DataTable } from "@/components/Admin/analytics/DataTable";
import { FunnelBars, RankBars, StackedShare } from "@/components/Admin/analytics/charts/HtmlCharts";
import { csvHref, toApiQuery } from "@/components/Admin/analytics/filters";
import { formatDayFull, formatMetric, humanize } from "@/components/Admin/analytics/format";
import { getAnalyticsReport } from "@/services/admin/analytics/getAnalyticsReport";
import { breakdownTable } from "./bookings";
import { KpiGrid, NotTracked, ReportError, SeriesCard, UpdatedNote, type TabProps } from "./shared";

const TIER_LABELS: Record<string, string> = {
  best: "Best match",
  partial: "Partial match",
  alternative: "Alternative",
  none: "Nothing found",
};
const TIER_COLORS: Record<string, string> = {
  best: "var(--chart-1)",
  partial: "var(--chart-2)",
  alternative: "var(--chart-3)",
};

export async function AssistantTab({ filters, defs, nowMs }: TabProps & { nowMs: number }) {
  const res = await getAnalyticsReport("assistant", toApiQuery(filters));
  if (!res.success || !res.data) return <ReportError message={res.message} />;
  const r = res.data;
  const csv = csvHref("assistant", filters);
  const tiers = r.tables.aiTiers ?? [];
  const live = r.tables.assistantLive;
  const steps = live
    ? [
        { key: "c", label: "Conversations", value: live.funnel.conversations, fromPrevious: null },
        {
          key: "s",
          label: "Reached the summary",
          value: live.funnel.reachedSummary,
          fromPrevious: live.funnel.conversations ? (live.funnel.reachedSummary / live.funnel.conversations) * 100 : null,
        },
        {
          key: "b",
          label: "Booked",
          value: live.funnel.booked,
          fromPrevious: live.funnel.reachedSummary ? (live.funnel.booked / live.funnel.reachedSummary) * 100 : null,
        },
      ]
    : [];
  const stopped = live
    ? Object.entries(live.funnel.stoppedAt).map(([key, value]) => ({ key, label: humanize(key), value }))
    : [];
  const liveNote = live
    ? `Last ${live.window.days} days (${formatDayFull(live.window.from)} – ${formatDayFull(live.window.to)}), whatever the range above.`
    : undefined;

  return (
    <div className="space-y-4">
      <UpdatedNote at={r.fetchedAt} nowMs={nowMs} />
      <KpiGrid
        report={r}
        defs={defs}
        ids={[
          "ai.searches",
          "ai.latencyP50",
          "ai.latencyP95",
          "ai.llmShare",
          "assistant.conversations",
          "assistant.reachedSummary",
          "assistant.bookings",
          "assistant.conversion",
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="AI search tier mix"
          definition={defs["ai.tier"] ?? "AI searches by the best tier among their results."}
          csvHref={csv}
          chart={tiers.length ? <StackedShare label="AI searches by result tier" parts={tiers} labels={TIER_LABELS} colors={TIER_COLORS} /> : undefined}
          table={breakdownTable("AI searches by result tier", tiers, TIER_LABELS, "Tier")}
        />
        <SeriesCard title="AI search latency (p50)" id="ai.latencyP50" report={r} reportName="assistant" filters={filters} defs={defs} />
      </div>

      <SeriesCard
        title="Assistant conversations"
        id="assistant.conversations"
        report={r}
        reportName="assistant"
        filters={filters}
        defs={defs}
        comparison={r.series["assistant.bookings"] ? { label: "Bookings", points: r.series["assistant.bookings"] } : undefined}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Assistant funnel"
          definition="Conversations, those that reached the booking summary, and those that booked."
          note={
            <>
              {liveNote}
              {live?.avgTurnsToBook != null && ` ${live.avgTurnsToBook} turns to book on average.`}
            </>
          }
          chart={steps.some((s) => s.value > 0) ? <FunnelBars label="Assistant funnel" steps={steps} /> : undefined}
          table={
            <DataTable
              caption="Assistant funnel"
              rows={steps}
              rowKey={(s) => s.key}
              columns={[
                { key: "l", label: "Step", render: (s) => s.label },
                { key: "n", label: "Count", numeric: true, render: (s) => formatMetric(s.value, "count") },
                {
                  key: "p",
                  label: "% of previous step",
                  numeric: true,
                  render: (s) => (s.fromPrevious === null ? "—" : formatMetric(s.fromPrevious, "percent")),
                },
              ]}
            />
          }
        />
        <ChartCard
          title="Where people stopped"
          definition="Conversations that didn't book, by the last step they reached."
          note={liveNote}
          chart={stopped.length ? <RankBars label="Where people stopped" unit="count" rows={stopped} /> : undefined}
          table={breakdownTable("Where people stopped", stopped.map(({ key, value }) => ({ key, value })), {}, "Step")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Problem outcomes"
          definition="Turns that ended in an error, a limit or a refusal. Some are only counted since the server last restarted."
          note={live ? `Process counts since ${formatDayFull(live.outcomes.countingSince.slice(0, 10))}.` : undefined}
          table={breakdownTable(
            "Problem outcomes",
            (live?.topProblems ?? []).map((p) => ({ key: p.outcome, value: p.count })),
            {},
            "Outcome",
          )}
        />
        <NotTracked title="👍 / 👎 feedback" what="Assistant ratings aren't rolled up into analytics yet." />
      </div>
    </div>
  );
}
