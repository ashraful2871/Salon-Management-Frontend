import { redirect } from "next/navigation";

/**
 * The API's `href` for a referral (`/dashboard/admin/referrals/:id`, e.g. in
 * the CSV and on User 360): the list with that referral's sheet open.
 */
export default async function ReferralLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/admin/referrals/list?open=${encodeURIComponent(id)}`);
}
