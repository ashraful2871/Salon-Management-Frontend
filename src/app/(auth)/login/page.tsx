import LoginForm from "@/components/Auth/LoginForm";

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
    redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : undefined;

  return <LoginForm redirectTo={redirectTo} />;
}
