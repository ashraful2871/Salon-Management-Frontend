import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { AdminSalonDetail } from "./types";

/** `GET /admin/salons/:id`: everything Salon 360 shows above the tabs. */
export const getAdminSalon = (id: string): Promise<ApiResponse<AdminSalonDetail>> =>
  adminGet<AdminSalonDetail>(
    `/admin/salons/${encodeURIComponent(id)}`,
    { next: { revalidate: 30, tags: [TAGS.adminSalon(id)] } },
    "Couldn't load this salon. Please try again.",
  );
