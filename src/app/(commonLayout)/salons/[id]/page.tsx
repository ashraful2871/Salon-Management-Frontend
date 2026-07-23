/* eslint-disable @typescript-eslint/no-explicit-any */
import SalonDetails from "@/components/Salons/SalonDetails";
import { getSingleSalon } from "@/services/salon/getSingleSalon";

const SalonDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const res = await getSingleSalon(id);
  return <SalonDetails salon={res?.data as any} />;
};

export default SalonDetailsPage;
