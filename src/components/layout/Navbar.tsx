import { getMyWallet, type Wallet } from "@/services/wallet/getMyWallet";
import { getSessionUser } from "@/services/auth/session";
import NavbarClient from "./NavbarClient";

const Navbar = async () => {
  // Reading the token directly is what used to make the header flip to
  // "Sign in" an hour after sign-in while the session itself was still good.
  // `getSessionUser` renews an expired token before deciding.
  const user = await getSessionUser();

  // The header balance is a signed-in-only affordance, so the wallet read only
  // happens once the token has verified. A failed read degrades to `null` — the
  // header still renders, it just shows no figure.
  let wallet: Wallet | null = null;

  if (user) {
    const walletResult = await getMyWallet();
    if (walletResult.success && walletResult.data) {
      wallet = walletResult.data;
    }
  }

  // Pass the user data (or null) to the client component
  return <NavbarClient user={user} wallet={wallet} />;
};

export default Navbar;
