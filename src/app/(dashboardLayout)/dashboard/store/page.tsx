/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Store from "@/components/Dashboard/Store";
import { getMySalon } from "@/services/salon/getMySalon";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import { getSelectedBranch } from "@/lib/branch-cookie";

const StorePage = async () => {
  // The salon list (and adding a salon) is the owner's; a manager's "My
  // branch" is their selected branch's profile.
  if ((await getUserRoles()) === "BRANCH_MANAGER") {
    const branch = await getSelectedBranch();
    redirect(branch === "all" ? "/dashboard" : `/dashboard/store/${branch}`);
  }

  const storeData = await getMySalon();

  return (
    <div className="p-4 md:p-6">
      <Store salonResponse={storeData as any} />
    </div>
  );
};

export default StorePage;
