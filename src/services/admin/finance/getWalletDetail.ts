import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { WalletDetail } from "./types";

/** `GET /admin/finance/wallets/:userId/transactions` (finance.view). */
export const getWalletDetail = (
  userId: string,
  page = 1,
): Promise<ApiResponse<WalletDetail>> =>
  adminGet<WalletDetail>(
    `/admin/finance/wallets/${encodeURIComponent(userId)}/transactions${toQuery({ page })}`,
    { next: { revalidate: 30, tags: [TAGS.adminWallets] } },
    "Couldn't load the wallet. Please try again.",
  );
