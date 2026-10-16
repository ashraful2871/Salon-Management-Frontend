import type { NextRequest } from "next/server";
import { serverFetch } from "@/lib/server-fetch";

/**
 * Streams an owner CSV from the API with the visitor's access token, so the
 * browser downloads from our own origin. The API scopes it to the caller's
 * business; this only relays.
 */
const FILES: Record<string, string> = {
  "transactions.csv": "/owner/money/transactions.csv",
  "team-performance.csv": "/owner/team/performance.csv",
};

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const file = (await params).path.join("/");
  // statements/<id>.csv: one statement's ledger lines (404 when not yours).
  const statement = /^statements\/([0-9a-f-]{36})\.csv$/i.exec(file);
  const endpoint = statement ? `/owner/statements/${statement[1]}.csv` : FILES[file];
  if (!endpoint) return new Response("Unknown export", { status: 404 });

  const upstream = await serverFetch.get(`${endpoint}${request.nextUrl.search}`, {
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    // Errors come back in the JSON envelope; show the message as text, since
    // this URL was opened as a download.
    const body = (await upstream.json().catch(() => null)) as { message?: string; errorCode?: string } | null;
    return new Response(body?.message ?? "The download failed. Please try again.", {
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
        upstream.headers.get("content-disposition") ?? `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    },
  });
}
