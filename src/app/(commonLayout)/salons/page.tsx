import Salons from "@/components/Salons/Salons";
import { getAllSalon } from "@/services/salon/getAllSalon";
import { Suspense } from "react";

export default async function SalonsStorePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const resolvedSearchParams = await searchParams;
  
  const query = {
    division: resolvedSearchParams?.division,
    district: resolvedSearchParams?.district,
    area: resolvedSearchParams?.area,
    searchTerm: resolvedSearchParams?.searchTerm,
  };
  
  const res = await getAllSalon(query);
  const salons = res?.data ?? [];
  
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-20 text-lg">Loading salons...</div>}>
      <Salons allSalons={salons} />
    </Suspense>
  );
}
