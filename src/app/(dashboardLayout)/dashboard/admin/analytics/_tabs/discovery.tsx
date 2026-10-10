import { ChartCard } from "@/components/Admin/analytics/ChartCard";
import { DataTable } from "@/components/Admin/analytics/DataTable";
import { csvHref, toApiQuery } from "@/components/Admin/analytics/filters";
import { dataStartsText, formatMetric, humanize, kpiById } from "@/components/Admin/analytics/format";
import { POPULAR_AREAS } from "@/constants/popular-areas";
import { getAnalyticsReport } from "@/services/admin/analytics/getAnalyticsReport";
import type { AreaRow, SearchTerm } from "@/services/admin/analytics/types";
import { KpiGrid, ReportError, SeriesCard, UpdatedNote, type TabProps } from "./shared";
import { AreaMap } from "../_charts";

/** Area centres we know (the location dialog's neighbourhoods); other areas stay in the table. */
const CENTRES = new Map(POPULAR_AREAS.map((a) => [a.name.toLowerCase(), a]));

function termsTable(caption: string, rows: SearchTerm[], zero: boolean, emptyText: string) {
  return (
    <DataTable<SearchTerm>
      caption={caption}
      rows={rows}
      rowKey={(t) => `${t.term}|${t.surface}`}
      empty={emptyText}
      columns={[
        { key: "t", label: "Term", render: (t) => t.term },
        { key: "s", label: "Where", render: (t) => humanize(t.surface) },
        zero
          ? { key: "z", label: "No results", numeric: true, render: (t) => formatMetric(t.zero, "count") }
          : { key: "n", label: "Searches", numeric: true, render: (t) => formatMetric(t.count, "count") },
        zero
          ? { key: "n", label: "Searches", numeric: true, render: (t) => formatMetric(t.count, "count") }
          : { key: "z", label: "No results", numeric: true, render: (t) => formatMetric(t.zero, "count") },
      ]}
    />
  );
}

export async function DiscoveryTab({ filters, defs, nowMs }: TabProps & { nowMs: number }) {
  const q = toApiQuery(filters);
  const [search, funnel, geo] = await Promise.all([
    getAnalyticsReport("search", q),
    getAnalyticsReport("funnel", q),
    getAnalyticsReport("geo", q),
  ]);
  if (!search.success || !search.data) return <ReportError message={search.message} />;
  const s = search.data;
  const areas: AreaRow[] = geo.success ? (geo.data?.tables.areas ?? []) : [];
  const terms = s.tables.terms ?? { top: [], zeroResults: [] };
  const termsEmpty = dataStartsText("search.count", s.series["search.count"]);
  const points = areas.flatMap((a) => {
    const c = CENTRES.get(a.area.toLowerCase());
    return c && a.created > 0
      ? [{ key: a.area, label: a.area, lat: c.lat, lng: c.lng, value: a.created, text: `${formatMetric(a.created, "count")} bookings` }]
      : [];
  });
  const csv = csvHref("search", filters);

  return (
    <div className="space-y-4">
      <UpdatedNote at={s.fetchedAt} nowMs={nowMs} />
      <KpiGrid
        report={s}
        defs={defs}
        ids={[
          funnel.success && funnel.data ? kpiById(funnel.data.kpis, "visitors.unique") : undefined,
          "search.count",
          "search.zeroShare",
          "ai.searches",
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SeriesCard title="Searches per day" id="search.count" kind="bars" report={s} reportName="search" filters={filters} defs={defs} />
        <SeriesCard title="Zero-result share" id="search.zeroShare" report={s} reportName="search" filters={filters} defs={defs} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Top search terms"
          definition={defs["search.terms"]}
          csvHref={csv}
          table={termsTable("Top search terms", terms.top.slice(0, 20), false, termsEmpty)}
        />
        <ChartCard
          title="Demand gaps"
          definition="Terms people searched that found nothing, most frequent first."
          note="Search terms are stored without an area, so these are platform-wide."
          csvHref={csv}
          table={termsTable("Search terms with no results", terms.zeroResults.slice(0, 20), true, termsEmpty)}
        />
      </div>

      <ChartCard
        title="Bookings by area"
        definition={defs["geo.areas"]}
        note={
          points.length < areas.filter((a) => a.created > 0).length
            ? "The map shows the areas with a known centre; the table lists every area."
            : undefined
        }
        csvHref={csvHref("geo", filters)}
        chart={points.length ? <AreaMap points={points} /> : undefined}
        table={
          <DataTable<AreaRow>
            caption="Bookings and listed salons by area"
            rows={areas}
            rowKey={(a) => a.area}
            columns={[
              { key: "a", label: "Area", render: (a) => a.area },
              { key: "d", label: "District", render: (a) => a.district || "—" },
              { key: "c", label: "Bookings created", numeric: true, render: (a) => formatMetric(a.created, "count") },
              { key: "k", label: "Completed", numeric: true, render: (a) => formatMetric(a.completed, "count") },
              { key: "g", label: "Completed value", numeric: true, render: (a) => formatMetric(a.gmvMinor, "minor") },
              { key: "l", label: "Salons listed", numeric: true, render: (a) => formatMetric(a.listed, "count") },
            ]}
          />
        }
      />
    </div>
  );
}
