import LoginForm from "@/components/Auth/LoginForm";

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
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).redirect;
  const redirect = Array.isArray(raw) ? raw[0] : raw;

  // Only ever bounce back inside this app — an absolute URL here would turn the
  // login page into an open redirect.
  const redirectTo =
    redirect?.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : undefined;

  return <LoginForm redirectTo={redirectTo} />;
}
