import { DataList } from "@/components/Shared/DataList";
import { TONE_CLASSES } from "@/lib/status-tone";
import type { SystemStorage } from "@/services/admin/system/types";
import { formatBytes, storageTone } from "./format";

/** Used / cap as a meter (coloured by threshold, with the numbers in text), then the top tables. */
export function StorageMeter({ data }: { data: SystemStorage }) {
  const tone = storageTone(data.percent, data.warnPercent);
  const width = Math.min(100, Math.max(0, data.percent));
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm">
            <span className="font-heading text-lg font-semibold tabular-nums">{formatBytes(data.usedBytes)}</span>{" "}
            of {formatBytes(data.capBytes)} used
          </p>
          <p className={`text-sm font-semibold tabular-nums ${TONE_CLASSES[tone].text}`}>{data.percent}%</p>
        </div>
        <div
          role="meter"
          aria-label="Database storage used"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={data.percent}
          aria-valuetext={`${formatBytes(data.usedBytes)} of ${formatBytes(data.capBytes)}, ${data.percent}%`}
          className="relative mt-3 h-3 overflow-hidden rounded-full bg-muted"
        >
          <div className={`h-full rounded-full ${TONE_CLASSES[tone].dot}`} style={{ width: `${width}%` }} />
          <span
            aria-hidden="true"
            className="absolute inset-y-0 w-px bg-foreground/40"
            style={{ left: `${data.warnPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          An alert email goes out at {data.warnPercent}% (Platform settings → system.storageWarnPercent).
        </p>
      </div>

      <DataList
        items={data.tables}
        rowKey={(t) => t.table}
        caption="Largest tables"
        density="compact"
        empty={<p className="p-4 text-sm text-muted-foreground">No tables found.</p>}
        columns={[
          { key: "table", header: "Table", mobile: "primary", cell: (t) => <span className="font-mono text-sm">{t.table}</span> },
          { key: "size", header: "Size", align: "right", mobile: "trailing", cell: (t) => <span className="tabular-nums">{formatBytes(t.bytes)}</span> },
          { key: "rows", header: "Rows (approx.)", align: "right", cell: (t) => <span className="tabular-nums">{t.rowsApprox.toLocaleString("en-US")}</span> },
          { key: "retention", header: "Retention", mobile: "secondary", cell: (t) => t.retention },
        ]}
      />
    </div>
  );
}
