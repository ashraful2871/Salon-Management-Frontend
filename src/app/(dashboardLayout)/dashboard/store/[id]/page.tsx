import ManageSalon from "@/components/Dashboard/ManageSalon";
import { getSalonById } from "@/services/salon/getSalonNyId";
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
      <ManageSalon
        initialData={getSingleSalon.data}
        initialTab={typeof tab === "string" ? tab : undefined}
      />
    </div>
  );
};

export default ManageSalonPage;
