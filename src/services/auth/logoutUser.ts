import { redirect } from "next/navigation";
import { deleteCookie } from "./cookiesHandler";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth-cookies";

export const logOutUser = async () => {
  // The refresh token has to go first and go for certain: leaving it behind
  // would have the proxy mint a brand new access token on the very next
  // navigation and sign the user straight back in.
  await deleteCookie(REFRESH_TOKEN_COOKIE);
  await deleteCookie(ACCESS_TOKEN_COOKIE);

  redirect("/login?loggedOut=true");
};
