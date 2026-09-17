import ResetPasswordForm from "@/components/Auth/ResetPasswordForm";

export const metadata = {
  title: "Reset password | SalonKhuji",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <ResetPasswordForm token={token ?? ""} />;
}
