import Customers from "@/components/Dashboard/Customers";
import { getAllUsers } from "@/services/users/getAllUsers";
import { getMyCustomers } from "@/services/users/getMyCustomers";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import React from "react";

const CustomersPage = async () => {
  const userRole = await getUserRoles();

  let usersResponse;

  if (userRole === "SALON_OWNER") {
    usersResponse = await getMyCustomers({ limit: 50 });
  } else {
    // ADMIN sees all customers
    usersResponse = await getAllUsers({ role: "CUSTOMER", limit: 50 });
  }

  return (
    <div>
      <Customers usersResponse={usersResponse} />
    </div>
  );
};

export default CustomersPage;
