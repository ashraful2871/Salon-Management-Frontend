import type { Metadata } from "next";
import Link from "next/link";
import { ErrorState } from "@/components/Shared/ErrorState";
import { can } from "@/lib/admin-permissions";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminUser } from "@/services/admin/users/getAdminUser";
import { getAdminUserActivity } from "@/services/admin/users/getAdminUserActivity";
import { getAdminUserBookings } from "@/services/admin/users/getAdminUserBookings";
import { getAdminUserReviews } from "@/services/admin/users/getAdminUserReviews";
import { getAdminUserWallet } from "@/services/admin/users/getAdminUserWallet";
import { UserDetailClient } from "./UserDetailClient";

export const metadata: Metadata = { title: "User | Admin" };

/** User 360: one request per tab, all in parallel; the wallet only with finance.view. */
export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getAdminMe();
  const permissions = me.data?.permissions ?? [];

  const [user, bookings, reviews, activity, wallet] = await Promise.all([
    getAdminUser(id),
    getAdminUserBookings(id),
    getAdminUserReviews(id),
    getAdminUserActivity(id),
    can(permissions, "finance.view") ? getAdminUserWallet(id) : Promise.resolve(null),
  ]);

  if (!user.success || !user.data) {
    return (
      <div className="space-y-4">
        <ErrorState title="Couldn't open this user" message={user.message} />
        <Link href="/dashboard/admin/users" className="text-sm text-primary underline-offset-4 hover:underline">
          Back to users
        </Link>
      </div>
    );
  }

  return (
    <UserDetailClient
      user={user.data}
      bookings={bookings}
      reviews={reviews}
      activity={activity}
      wallet={wallet}
      permissions={permissions}
      viewerId={me.data?.userId}
    />
  );
}
