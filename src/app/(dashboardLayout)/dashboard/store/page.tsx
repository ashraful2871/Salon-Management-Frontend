import Store from "@/components/Dashboard/Store";
import { getMySalon } from "@/services/salon/getMySalon";

const StorePage = async () => {
  const storeData = await getMySalon();

  return (
    <div className="p-4 md:p-6">
      <Store salonResponse={storeData} />
    </div>
  );
};

export default StorePage;
