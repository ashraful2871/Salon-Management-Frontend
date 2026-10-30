"use server";

import type { ApiResponse } from "@/lib/api-types";
import { enc, homeGet } from "./request";
import type { HomeBooking } from "./types";

/** `GET /home-service/bookings/:id`: the customer's own visit (anyone else's is 404). */
export const getHomeBooking = async (id: string): Promise<ApiResponse<HomeBooking>> =>
  homeGet<HomeBooking>(
    `/home-service/bookings/${enc(id)}`,
    { cache: "no-store" },
    "Couldn't load this visit. Please try again.",
  );
