/**
 * The one description of the session cookies, shared by everything that writes
 * them: the login action, the Edge middleware, the keep-alive route handler and
 * the server-side session helper.
 *
 * They are set on the Next.js domain rather than the API's - a `Set-Cookie`
 * from the API host does not stick on the frontend origin - so these options,
 * not the backend's, are what the browser actually stores.
 */

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

/**
 * Cookie lifetimes, in seconds, deliberately longer than the JWTs inside them.
 *
 * The access token's JWT expires in an hour; its cookie lasts a week. An
 * expired access token is still useful evidence - it says this browser has a
 * session worth renewing - and dropping the cookie the moment its payload went
 * stale is precisely what made an idle hour look like a sign-out.
 */
export const ACCESS_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
export const REFRESH_COOKIE_MAX_AGE = 90 * 24 * 60 * 60;

/**
 * `lax`, not `strict`: the reset-password and verify-email links arrive from an
 * email client, and a `strict` cookie is withheld on that first cross-site
 * navigation, so the user would land on the site logged out.
 */
const base = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
} as const;

export const accessCookieOptions = {
  ...base,
  maxAge: ACCESS_COOKIE_MAX_AGE,
};

export const refreshCookieOptions = {
  ...base,
  maxAge: REFRESH_COOKIE_MAX_AGE,
};
