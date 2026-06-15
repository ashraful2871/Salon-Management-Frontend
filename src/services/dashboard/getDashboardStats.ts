/* eslint-disable @typescript-eslint/no-explicit-any */
import { serverFetch } from "@/lib/server-fetch";

export const getAdminDashboardStats = async () => {
  try {
    const response = await serverFetch.get("/dashboard-stats/admin");
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error.message || "Something went wrong" };
  }
};

export const getSalonOwnerDashboardStats = async () => {
  try {
    const response = await serverFetch.get("/dashboard-stats/salon-owner");
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error.message || "Something went wrong" };
  }
};

export const getCustomerDashboardStats = async () => {
  try {
    const response = await serverFetch.get("/dashboard-stats/customer");
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error.message || "Something went wrong" };
  }
};
