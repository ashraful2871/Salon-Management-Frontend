/* eslint-disable @typescript-eslint/no-explicit-any */
import Salons from "@/components/Salons/Salons";
import { getAllSalon } from "@/services/salon/getAllSalon";
import { Suspense } from "react";

export default async function SalonsStorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const query = {
    division: resolvedSearchParams?.division,
    district: resolvedSearchParams?.district,
    area: resolvedSearchParams?.area,
    searchTerm: resolvedSearchParams?.searchTerm,
  };

  const res = await getAllSalon(query);

  return (
    <Suspense fallback={<div className="flex justify-center items-center py-20 text-lg">Loading salons...</div>}>
      <Salons allSalons={(res?.data ?? []) as any} />
    </Suspense>
  );
}
