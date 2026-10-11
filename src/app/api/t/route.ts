import { clientIpHeaders } from "@/lib/client-ip-headers";

/**
 * The beacon target of `lib/track.ts`. Forwards the batch to the API's
 * `POST /events` with the visitor's IP (`clientIpHeaders`, which carries
 * `X-Internal-Key`), user agent and opt-out headers, and always answers 204:
 * counting must never show up as an error on a page.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const MAX_BODY = 8_192;

export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get("user-agent");
    const body = await request.text();
    if (userAgent && body && body.length <= MAX_BODY) {
      const optOut: Record<string, string> = {};
      if (request.headers.get("dnt") === "1") optOut.DNT = "1";
      if (request.headers.get("sec-gpc") === "1") optOut["Sec-GPC"] = "1";

      await fetch(`${API}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": userAgent,
          ...optOut,
          ...(await clientIpHeaders()),
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(3_000),
      });
    }
  } catch {
    // Dropped: a lost count is fine, an error page is not.
  }
  return new Response(null, { status: 204 });
}
