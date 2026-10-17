import ManageSalon from "@/components/Dashboard/ManageSalon";
import { getSalonById } from "@/services/salon/getSalonNyId";
import { getMyAccess } from "@/services/owner/getMyAccess";
import { getClosures } from "@/services/schedule/getClosures";
import { getBookingPause } from "@/services/schedule/getBookingPause";
import React from "react";

const ManageSalonPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) => {
  const { id } = await params;
  const { tab } = await searchParams;

  const [getSingleSalon, access] = await Promise.all([getSalonById(id), getMyAccess()]);
  // What the caller may do here: hides owner-only controls from a manager.
  const branch = access.success ? access.data?.find((b) => b.salonId === id) : undefined;
  const permissions = branch?.permissions;
  const isOwner = branch?.role === "OWNER";
  // Each read 404s for a caller without the permission; that just hides its UI.
  const [closures, pause] = await Promise.all([
    !branch || permissions?.includes("slots.manage") ? getClosures(id) : null,
    isOwner ? getBookingPause(id) : null,
  ]);
  const otherBranches = isOwner
    ? (access.data ?? [])
        .filter((b) => b.role === "OWNER" && b.salonId !== id)
        .map((b) => ({ id: b.salonId, name: b.salonName }))
    : [];

  if (!getSingleSalon.data) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">Salon Not Found</h2>
        <p className="text-muted-foreground mt-2">
          {getSingleSalon.message || "We could not load this salon. Please try again later."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <ManageSalon
        initialData={getSingleSalon.data}
        initialTab={typeof tab === "string" ? tab : undefined}
        permissions={permissions}
        closures={closures?.success ? (closures.data ?? []) : null}
        pause={pause?.success ? (pause.data ?? null) : null}
        otherBranches={otherBranches}
      />
    </div>
  );
};

export default ManageSalonPage;
