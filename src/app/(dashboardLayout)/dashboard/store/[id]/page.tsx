import ManageSalon from "@/components/Dashboard/ManageSalon";
import { getSalonById } from "@/services/salon/getSalonNyId";
import React from "react";

const ManageSalonPage = async ({ params }: { params: { id: string } }) => {
  const { id } = await params;

  const getSingleSalon = await getSalonById(id);

  return (
    <div>
      <ManageSalon initialData={getSingleSalon.data} />
    </div>
  );
};

export default ManageSalonPage;
