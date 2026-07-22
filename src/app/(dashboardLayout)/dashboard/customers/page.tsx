/* eslint-disable @typescript-eslint/no-explicit-any */
import Customers from "@/components/Dashboard/Customers";
import { getAllUsers } from "@/services/users/getAllUsers";
import { getMyCustomers } from "@/services/users/getMyCustomers";
import { getUserRoles } from "@/services/get-roles/getUserRoles";

const CustomersPage = async () => {
  const userRole = await getUserRoles();

  let usersResponse;

  if (userRole === "SALON_OWNER") {
    usersResponse = await getMyCustomers({ limit: 50 });
  } else {
    usersResponse = await getAllUsers({ role: "CUSTOMER", limit: 50 });
  }

  return (
    <div>
      <Customers usersResponse={usersResponse as any} />
    </div>
  );
};

export default CustomersPage;
