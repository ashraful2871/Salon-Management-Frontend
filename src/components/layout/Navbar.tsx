import { Suspense } from "react";
import { getMyWallet, type Wallet } from "@/services/wallet/getMyWallet";
import { getDisplayUser } from "@/services/auth/displayUser";
import NavbarClient from "./NavbarClient";
import { getMyEarnings } from "@/services/settlement/getMyEarnings";
import { getPlatformEarnings } from "@/services/settlement/getPlatformEarnings";

// Only the account half of the header waits on the API. The logo, links and
// location chip render at once around a skeleton, so a slow or down API never
// holds the whole page behind the navbar.
async function NavbarAccount() {
  // Reading the token directly is what used to make the header flip to
  // "Sign in" an hour after sign-in while the session itself was still good.
  // `getSessionUser` (inside `getDisplayUser`) renews an expired token before
  // deciding, and `getDisplayUser` makes sure the name is the real one.
  const user = await getDisplayUser();

  // The header balance is a signed-in-only affordance, so the wallet read only
  // happens once the token has verified. A failed read degrades to `null` — the
  // header still renders, it just shows no figure.
  let wallet: Wallet | null = null;
  let ownerRevenueMinor: number | null = null;
  let adminRevenueMinor: number | null = null;

  if (user) {
    if (user.role === "CUSTOMER") {
      const walletResult = await getMyWallet();
      if (walletResult.success && walletResult.data) {
        wallet = walletResult.data;
      }
    }
    // For SALON_OWNER and ADMIN, we do not await their earnings here.
    // getMyEarnings and getPlatformEarnings run heavy analytical queries
    // that take several seconds, which blocks the navbar and user avatar 
    // from rendering. They will be fetched asynchronously in NavbarClient.
  }

  // Pass the user data (or null) to the client component
  return (
    <NavbarClient 
      user={user} 
      wallet={wallet} 
      ownerRevenueMinor={ownerRevenueMinor}
      adminRevenueMinor={adminRevenueMinor}
    />
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<NavbarClient user={null} wallet={null} accountLoading />}>
      <NavbarAccount />
    </Suspense>
  );
}
