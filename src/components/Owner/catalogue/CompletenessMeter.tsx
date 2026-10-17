import Link from "next/link";
import type { SalonCompleteness } from "@/services/owner/catalogue-types";

/** Branch card: profile completeness score and the first thing still missing. */
export function CompletenessMeter({ data }: { data: SalonCompleteness }) {
  const tone = data.score >= 100 ? "bg-success" : data.score >= 60 ? "bg-warning" : "bg-danger";
  const next = data.missing[0];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Profile</span>
        <span className="font-medium tabular-nums">{data.score}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-label={`Profile ${data.score}% complete`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={data.score}
      >
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${data.score}%` }} />
      </div>
      {next && (
        <p className="truncate text-xs text-muted-foreground">
          Next:{" "}
          <Link href={next.href} className="font-medium text-primary hover:underline">
            {next.label}
          </Link>
          {data.missing.length > 1 ? ` (+${data.missing.length - 1} more)` : ""}
        </p>
      )}
    </div>
  );
}
