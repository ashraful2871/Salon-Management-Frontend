import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, DashboardStats } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";

export const getAdminDashboardStats =
  async (): Promise<ApiResponse<DashboardStats>> => {
    try {
      const response = await serverFetch.get("/dashboard-stats/admin", {
        next: {
          revalidate: 30,
          tags: [TAGS.dashboardStats],
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

/** Every branch, or just `salonId` (the branch switcher's choice). */
export const getSalonOwnerDashboardStats =
  async (salonId?: string): Promise<ApiResponse<DashboardStats>> => {
    try {
      const query = salonId ? `?salonId=${encodeURIComponent(salonId)}` : "";
      const response = await serverFetch.get(`/dashboard-stats/salon-owner${query}`, {
        next: {
          revalidate: 30,
          tags: [TAGS.dashboardStats],
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
          tags: [TAGS.dashboardStats],
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
