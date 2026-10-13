import type { NextRequest } from "next/server";
import { serverFetch } from "@/lib/server-fetch";

/**
 * Streams an admin CSV export from the API with the visitor's access token
 * (`serverFetch` attaches it), so the browser downloads from our own origin.
 * The API checks finance.export (analytics.export for analytics) and audits
 * the export; this only relays.
 */
const FILE = /^(bookings|ledger|payouts|topups|users)\.csv$/;
/** `users/<id>.json` → `/admin/users/<id>/export` (users.delete, step-up): a privacy export. */
const USER_EXPORT = /^users\/([0-9a-f-]{36})\.json$/i;
/** `analytics/<report>.csv` → `/admin/analytics/<report>/export.csv` (analytics.export). */
const ANALYTICS = /^analytics\/(overview|bookings|customers|salons|geo|funnel|search|assistant|tryon)\.csv$/;
/**
 * `payout-files/<bkash|beftn>.csv?status&ids` → `/admin/finance/payouts/export.csv?format=…`
 * (finance.export + finance.payout_accounts): the transfer file, full account numbers.
 */
const PAYOUT_FILE = /^payout-files\/(bkash|beftn)\.csv$/;

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const file = (await params).path.join("/");
  const report = ANALYTICS.exec(file)?.[1];
  const userId = USER_EXPORT.exec(file)?.[1];
  const payoutFormat = PAYOUT_FILE.exec(file)?.[1];
  if (!report && !userId && !payoutFormat && !FILE.test(file)) {
    return new Response("Unknown export", { status: 404 });
  }

  const payoutQuery = () => {
    const query = new URLSearchParams(request.nextUrl.searchParams);
    query.set("format", payoutFormat!);
    return `?${query.toString()}`;
  };

  const upstream = await serverFetch.get(
    userId
      ? `/admin/users/${userId}/export`
      : report
        ? `/admin/analytics/${report}/export.csv${request.nextUrl.search}`
        : payoutFormat
          ? `/admin/finance/payouts/export.csv${payoutQuery()}`
          : `/admin/finance/export/${file}${request.nextUrl.search}`,
    { cache: "no-store" },
  );

  if (!upstream.ok || !upstream.body) {
    // The API answers errors in its JSON envelope; show the message as text,
    // since this URL was opened as a download.
    // `X-Error-Code` lets a fetch() caller answer STEP_UP_REQUIRED.
    const body = (await upstream.json().catch(() => null)) as { message?: string; errorCode?: string } | null;
    return new Response(body?.message ?? "The export failed. Please try again.", {
      status: upstream.status || 502,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ...(body?.errorCode ? { "X-Error-Code": body.errorCode } : {}),
      },
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "text/csv; charset=utf-8",
      "Content-Disposition":
        upstream.headers.get("content-disposition") ?? `attachment; filename="${file.replace("/", "-")}"`,
      "Cache-Control": "no-store",
    },
  });
}
