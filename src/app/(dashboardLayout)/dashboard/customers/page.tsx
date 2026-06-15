import Customers from "@/components/Dashboard/Customers";
import { getAllUsers } from "@/services/users/getAllUsers";
import React from "react";

const CustomersPage = async () => {
  const usersResponse = await getAllUsers({ role: "CUSTOMER", limit: 50 });

  return (
    <div>
      <Customers usersResponse={usersResponse} />
    </div>
  );
};

export default CustomersPage;
