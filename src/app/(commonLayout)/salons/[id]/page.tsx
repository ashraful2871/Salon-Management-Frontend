import SalonDetails from "@/components/Salons/SalonDetails";
import { getSingleSalon } from "@/services/salon/getSingleSalon";
import React from "react";

const SalonDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const res = await getSingleSalon(id);
  return <SalonDetails salon={res?.data} />;
};

export default SalonDetailsPage;
