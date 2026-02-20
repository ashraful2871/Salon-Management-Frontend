import Salons from "@/components/Salons/Salons";
import { Button } from "@/components/ui/button";
import { getAllSalon } from "@/services/salon/getAllSalon";

export default async function SalonsStorePage() {
  const res = await getAllSalon();
  const salons = res?.data ?? [];
  return (
    <>
      <Salons allSalons={salons} />
    </>
  );
}
