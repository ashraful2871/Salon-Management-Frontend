import type { ApiResponse } from "@/lib/api-types";
import { enc, homeGet } from "./request";
import type { AdminHomeBooking } from "./types";

/** `GET /admin/home-service/bookings/:id`: the whole visit with its timeline, reports and ledger lines. */
export const getAdminHomeBooking = async (id: string): Promise<ApiResponse<AdminHomeBooking>> =>
  homeGet<AdminHomeBooking>(
    `/admin/home-service/bookings/${enc(id)}`,
    { cache: "no-store" },
    "Couldn't load this visit. Please try again.",
  );
