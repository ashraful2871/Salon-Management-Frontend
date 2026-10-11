import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminUserWallet } from "./types";

/** `GET /admin/users/:id/wallet` (users.view + finance.view): balance and latest ledger rows. */
export const getAdminUserWallet = (id: string, page = 1): Promise<ApiResponse<AdminUserWallet>> =>
  adminGet<AdminUserWallet>(
    `/admin/users/${encodeURIComponent(id)}/wallet${toQuery({ page, limit: 50 })}`,
    { next: { revalidate: 30, tags: [TAGS.adminUser(id)] } },
    "Couldn't load the wallet.",
  );
