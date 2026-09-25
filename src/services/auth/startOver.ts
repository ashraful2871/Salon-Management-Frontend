"use server";

import { redirect } from "next/navigation";
import { clearVerifyCookie } from "@/lib/verify-cookie";

/** "Wrong email? Start over": forget the pending verification and go back to
 *  the register form. */
export const startOverAction = async (): Promise<void> => {
  await clearVerifyCookie();
  redirect("/register");
};
