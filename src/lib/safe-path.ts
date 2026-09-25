/**
 * Only ever an in-app path, for `redirect` / `next` values that arrive from a
 * query string or a cookie. An absolute or protocol-relative URL would make the
 * page that honours it an open redirect. Backslashes and whitespace are refused
 * too: the URL parser reads `/\evil.com` as `//evil.com` and drops tabs and
 * newlines, so `/<tab>/evil.com` becomes the same thing.
 */
export const safeInAppPath = (value: unknown): string | null =>
  typeof value === "string" &&
  value.startsWith("/") &&
  !value.startsWith("//") &&
  !/[\\\s]/.test(value)
    ? value
    : null;
