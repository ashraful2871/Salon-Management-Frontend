import ManageSalon from "@/components/Dashboard/ManageSalon";
import { getSalonById } from "@/services/salon/getSalonNyId";
import React from "react";

const ManageSalonPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const salonResponse = await getSalonById(id);

  return (
    <div className="space-y-6">
      <ManageSalon salonResponse={salonResponse} />
    </div>
  );
};

export default ManageSalonPage;
