// The `sm_branch` cookie's name and options, apart from `branch-cookie.ts`
// because a "use server" module may only export async functions.
export const BRANCH_COOKIE = "sm_branch";

export const BRANCH_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};
