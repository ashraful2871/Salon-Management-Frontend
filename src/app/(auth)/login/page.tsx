import LoginForm, { type DemoLogin } from "@/components/Auth/LoginForm";
import { safeInAppPath } from "@/lib/safe-path";
import { getAuthProviders } from "@/services/auth/getAuthProviders";

/**
 * The Demo Access panel, for the portfolio site only. Kept on the server and
 * passed down as a prop: in the client component an unset NEXT_PUBLIC_ var is
 * not inlined, so the list shipped in the bundle even with the panel hidden.
 */
const DEMO_LOGINS: DemoLogin[] = [
  { label: "Admin", email: "admin@salon.com", password: "admin123456" },
  { label: "Owner", email: "ashrafulash2871@gmail.com", password: "123456" },
  { label: "User", email: "ashrafulislam7120@gmail.com", password: "1234567" },
  { label: "Staff", email: "staff@gmail.com", password: "staff123456" },
];

/**
 * Bouncing a signed-in visitor away from here is the proxy's job, not this
 * page's.
 *
 * Doing it in the render looks equivalent and is not: `loginUser` writes its
 * cookies through a Server Action, and when that action returns, Next re-renders
 * the route it was called from - this one - with the session that was just
 * created. A redirect written here fires during that pass and lands the user on
 * the dashboard, beating `loginUser`'s own redirect and swallowing the
 * `?loggedIn=true` that raises the welcome toast. The proxy sees the request
 * before the action runs, so it has no such window.
 *
 * `error` is set by the Google route handlers (`/api/auth/google/*`); the form
 * turns it into one toast and strips it from the URL.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  // Only ever bounce back inside this app — an absolute URL here would turn the
  // login page into an open redirect.
  const redirectTo = safeInAppPath(first(params.redirect)) ?? undefined;

  const providers = await getAuthProviders();

  return (
    <LoginForm
      redirectTo={redirectTo}
      googleEnabled={providers.google}
      error={first(params.error)}
      demoLogins={
        process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === "true" ? DEMO_LOGINS : null
      }
    />
  );
}
