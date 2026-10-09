import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { WalletHit } from "./types";

/** `GET /admin/finance/wallets?q` (finance.view): by email, phone, name or user id. */
export const searchWallets = (q: string): Promise<ApiResponse<WalletHit[]>> =>
  adminGet<WalletHit[]>(
    `/admin/finance/wallets${toQuery({ q })}`,
    { cache: "no-store" },
    "Couldn't search wallets. Please try again.",
  );
