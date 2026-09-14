import ManageSalon from "@/components/Dashboard/ManageSalon";
import { getSalonById } from "@/services/salon/getSalonNyId";
import React from "react";

const ManageSalonPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const getSingleSalon = await getSalonById(id);

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
      <ManageSalon initialData={getSingleSalon.data} />
    </div>
  );
};

export default ManageSalonPage;
