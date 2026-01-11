import jwt, { JwtPayload } from "jsonwebtoken";

import { UserRole } from "@/services/auth/auth-utils";
import { getCookie } from "@/services/auth/cookiesHandler";
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
        process.env.JWT_SECRET as string
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

  // Pass the user data (or null) to the client component
  return <NavbarClient user={user} />;
};

export default Navbar;
