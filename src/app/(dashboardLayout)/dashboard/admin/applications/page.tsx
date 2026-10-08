/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import OwnerRequest from "@/components/OwnerRequest/OwnerRequest";
import { salonApplications } from "@/services/become-a-salone-woner/salon-applications";

export const metadata: Metadata = { title: "Owner applications | Admin" };

// TODO(admin Phase 5): rebuilt; the old owner-requests screen, moved as is.
export default async function AdminApplicationsPage() {
  const allApplications = await salonApplications();

  return (
    <div className="p-4 md:p-6">
      <OwnerRequest applicationsResponse={allApplications as any} />
    </div>
  );
}
