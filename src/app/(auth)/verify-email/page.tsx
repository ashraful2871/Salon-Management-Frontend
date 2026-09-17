import VerifyEmailView from "@/components/Auth/VerifyEmailView";

export const metadata = {
  title: "Verify email | SalonKhuji",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <VerifyEmailView token={token ?? ""} />;
}
