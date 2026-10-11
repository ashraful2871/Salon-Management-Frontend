import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminSalonFilters, AdminSalonRow } from "./types";

/** `GET /admin/salons`: one page of salons (an agent's area only), status counts in `meta`. */
export const getAdminSalons = (filters: AdminSalonFilters): Promise<ApiResponse<AdminSalonRow[]>> =>
  adminGet<AdminSalonRow[]>(
    `/admin/salons${toQuery({ ...filters, limit: 25 })}`,
    { next: { revalidate: 30, tags: [TAGS.adminSalons] } },
    "Couldn't load salons. Please try again.",
  );
