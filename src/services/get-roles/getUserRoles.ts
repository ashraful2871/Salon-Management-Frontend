"use server";

import { UserRole } from "../auth/auth-utils";
import { getCookie } from "../auth/cookiesHandler";
import jwt, { JwtPayload } from "jsonwebtoken";

interface DecodedToken extends JwtPayload {
  role: UserRole;
  email: string;
  name?: string;
}

export const getUserRoles = async () => {
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
  return user?.role;
};
