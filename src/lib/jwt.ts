/**
 * Reading a JWT's claims *without* verifying its signature.
 *
 * Two reasons this exists next to `jsonwebtoken`:
 *
 * 1. `jsonwebtoken` needs Node's crypto and cannot run in the Edge runtime that
 *    `middleware.ts` executes in, and the middleware is where the session gets
 *    renewed.
 * 2. Verification is not the question being asked. The only thing decided here
 *    is "is this token close enough to expiry that we should ask the API for a
 *    new one", and the answer never grants access to anything - the API
 *    verifies every token it is handed, for real, on every request.
 *
 * Nothing in this file is an authorization decision. Where identity actually
 * matters (`getSessionUser`), the signature is still checked with the shared
 * secret.
 */

export type JwtClaims = {
  exp?: number;
  iat?: number;
  [claim: string]: unknown;
};

const decodeBase64Url = (segment: string): string | null => {
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (base64.length % 4)) % 4;
    const binary = atob(base64 + "=".repeat(padding));

    // Names and addresses are not all ASCII, and `atob` hands back one byte per
    // char. Re-reading those bytes as UTF-8 is what keeps a non-Latin name from
    // decoding into mojibake.
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
};

export const decodeJwt = (token: string): JwtClaims | null => {
  const segment = token.split(".")[1];
  if (!segment) return null;

  const json = decodeBase64Url(segment);
  if (json === null) return null;

  try {
    const claims = JSON.parse(json);
    return typeof claims === "object" && claims !== null ? claims : null;
  } catch {
    return null;
  }
};

/** When the token dies, in epoch milliseconds, or `null` if it never says. */
export const getTokenExpiry = (token: string): number | null => {
  const claims = decodeJwt(token);
  return typeof claims?.exp === "number" ? claims.exp * 1000 : null;
};

/**
 * True when the token is dead or will be within `skewMs`.
 *
 * The skew is the whole point: a token with forty seconds left passes a naive
 * `exp > now` check and then expires halfway through the page it was fetched
 * for. Renewing early costs one request; renewing late costs the user their
 * work. An unreadable token counts as expiring - it is no use to anyone.
 */
export const isTokenExpiring = (token: string, skewMs = 60_000): boolean => {
  const expiresAt = getTokenExpiry(token);
  if (expiresAt === null) return true;
  return expiresAt - Date.now() <= skewMs;
};
