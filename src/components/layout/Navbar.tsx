import jwt, { JwtPayload } from "jsonwebtoken";

import { UserRole } from "@/services/auth/auth-utils";
import { getCookie } from "@/services/auth/cookiesHandler";
import { getMyWallet, type Wallet } from "@/services/wallet/getMyWallet";
import NavbarClient from "./NavbarClient";

interface DecodedToken extends JwtPayload {
  role: UserRole;
  email: string;
  name?: string;
}

const Navbar = async () => {
  const accessToken = await getCookie("accessToken");

  let user = null;

  if (accessToken) {
    try {
      const decoded = jwt.verify(
        accessToken,
        process.env.JWT_SECRET as string,
      ) as DecodedToken;

      user = {
        role: decoded.role,
        email: decoded.email,
        name: decoded.name || decoded.email.split("@")[0],
      };
    } catch (error) {
      console.error("Token verification failed:", error);
      // If token is invalid, user remains null (logged out)
    }
  }

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
