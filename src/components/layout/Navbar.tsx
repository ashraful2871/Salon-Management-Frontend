import { getMyWallet, type Wallet } from "@/services/wallet/getMyWallet";
import { getDisplayUser } from "@/services/auth/displayUser";
import NavbarClient from "./NavbarClient";
import { getMyEarnings } from "@/services/settlement/getMyEarnings";
import { getPlatformEarnings } from "@/services/settlement/getPlatformEarnings";

const Navbar = async () => {
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
    } else if (user.role === "SALON_OWNER") {
      const earningsResult = await getMyEarnings(1);
      if (earningsResult.success && earningsResult.data) {
        ownerRevenueMinor = earningsResult.data.summary.netEarningsMinor;
      }
    } else if (user.role === "ADMIN") {
      const earningsResult = await getPlatformEarnings();
      if (earningsResult.success && earningsResult.data) {
        adminRevenueMinor = earningsResult.data.platformRevenueMinor;
      }
    }
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
};

export default Navbar;
