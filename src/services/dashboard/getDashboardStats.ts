import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, DashboardStats } from "@/lib/api-types";

export const getAdminDashboardStats =
  async (): Promise<ApiResponse<DashboardStats>> => {
    try {
      const response = await serverFetch.get("/dashboard-stats/admin", {
        next: {
          revalidate: 30,
          tags: ["dashboard-stats"],
        },
      });

      const result: ApiResponse<DashboardStats> = await response.json();
      return result;
    } catch (error) {
      console.error("getAdminDashboardStats error:", error);
      return {
        success: false,
        message: (error as Error).message || "Something went wrong",
      };
    }
  };

export const getSalonOwnerDashboardStats =
  async (): Promise<ApiResponse<DashboardStats>> => {
    try {
      const response = await serverFetch.get("/dashboard-stats/salon-owner", {
        next: {
          revalidate: 30,
          tags: ["dashboard-stats"],
        },
      });

      const result: ApiResponse<DashboardStats> = await response.json();
      return result;
    } catch (error) {
      console.error("getSalonOwnerDashboardStats error:", error);
      return {
        success: false,
        message: (error as Error).message || "Something went wrong",
      };
    }
  };

export const getCustomerDashboardStats =
  async (): Promise<ApiResponse<DashboardStats>> => {
    try {
      const response = await serverFetch.get("/dashboard-stats/customer", {
        next: {
          revalidate: 30,
          tags: ["dashboard-stats"],
        },
      });

      const result: ApiResponse<DashboardStats> = await response.json();
      return result;
    } catch (error) {
      console.error("getCustomerDashboardStats error:", error);
      return {
        success: false,
        message: (error as Error).message || "Something went wrong",
      };
    }
  };
