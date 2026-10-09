import type { Metadata } from "next";
import Link from "next/link";
import { ErrorState } from "@/components/Shared/ErrorState";
import { can } from "@/lib/admin-permissions";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminSalon } from "@/services/admin/salons/getAdminSalon";
import { getAdminSalonTab } from "@/services/admin/salons/getAdminSalonTab";
import { SalonDetailClient } from "./SalonDetailClient";

export const metadata: Metadata = { title: "Salon | Admin" };

const skip = () => Promise.resolve(null);

/**
 * Salon 360: one request per tab, all in parallel. Agents get the overview
 * only (the tab endpoints are admin-only); money needs finance.view.
 */
export default async function AdminSalonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getAdminMe();
  const permissions = me.data?.permissions ?? [];
  const isAdmin = me.data?.accountRole === "ADMIN";

  const [salon, services, team, bookings, reviews, money, activity] = await Promise.all([
    getAdminSalon(id),
    isAdmin ? getAdminSalonTab(id, "services") : skip(),
    isAdmin ? getAdminSalonTab(id, "team") : skip(),
    isAdmin ? getAdminSalonTab(id, "bookings") : skip(),
    isAdmin ? getAdminSalonTab(id, "reviews") : skip(),
    isAdmin && can(permissions, "finance.view") ? getAdminSalonTab(id, "money") : skip(),
    isAdmin ? getAdminSalonTab(id, "activity") : skip(),
  ]);

  if (!salon.success || !salon.data) {
    return (
      <div className="space-y-4">
        <ErrorState title="Couldn't open this salon" message={salon.message} />
        <Link href="/dashboard/admin/salons" className="text-sm text-primary underline-offset-4 hover:underline">
          Back to salons
        </Link>
      </div>
    );
  }

  return (
    <SalonDetailClient
      salon={salon.data}
      tabs={isAdmin ? { services, team, bookings, reviews, money, activity } : null}
      permissions={permissions}
      viewerId={me.data?.userId}
    />
  );
}
