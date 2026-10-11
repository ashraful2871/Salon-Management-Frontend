import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type {
  AdminActivityRow,
  AdminSalonBooking,
  AdminSalonMoney,
  AdminSalonReview,
  AdminSalonService,
  AdminSalonTeam,
} from "./types";

type Tabs = {
  services: AdminSalonService[];
  team: AdminSalonTeam;
  bookings: AdminSalonBooking[];
  reviews: AdminSalonReview[];
  money: AdminSalonMoney;
  activity: AdminActivityRow[];
};

/** `GET /admin/salons/:id/<tab>`: one Salon 360 tab (admins only; money needs finance.view). */
export const getAdminSalonTab = <K extends keyof Tabs>(id: string, tab: K): Promise<ApiResponse<Tabs[K]>> =>
  adminGet<Tabs[K]>(
    `/admin/salons/${encodeURIComponent(id)}/${tab}${toQuery({ limit: 50 })}`,
    { next: { revalidate: 30, tags: [TAGS.adminSalon(id)] } },
    `Couldn't load ${tab}.`,
  );
