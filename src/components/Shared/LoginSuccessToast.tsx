"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Maps the one-shot query flag a server-side redirect leaves behind to its
 * toast, then strips the flag so a refresh does not replay it.
 */
const FLAGS: Record<string, { message: string; variant: "success" | "error" }> =
  {
    loggedIn: { message: "Login successful!", variant: "success" },
    registered: {
      message: "Welcome! Your account is ready.",
      variant: "success",
    },
    // Set by the route guards. Deliberately vague about what was behind the
    // door: confirming that a page exists for some other role is information a
    // user who cannot open it has no use for.
    denied: {
      message: "That page is not available for your account.",
      variant: "error",
    },
  };

/**
 * `?notice=<key>`: a one-off note that can ride along with a flag above. The
 * Google callback sets the referral ones when an invite code didn't attach.
 */
const NOTICES: Record<string, { message: string; variant: "info" | "error" }> = {
  referral_not_applied: {
    message: "Referral codes only work on new accounts.",
    variant: "info",
  },
  referral_invalid: {
    message: "That referral code couldn't be used, but your account is ready.",
    variant: "info",
  },
};

const LoginSuccessToast = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const flag = Object.keys(FLAGS).find(
      (key) => searchParams.get(key) === "true",
    );
    const noticeKey = searchParams.get("notice");
    const notice = noticeKey ? NOTICES[noticeKey] : undefined;
    if (!flag && !notice) return;

    if (flag) toast[FLAGS[flag].variant](FLAGS[flag].message);
    if (notice) toast[notice.variant](notice.message);

    const newUrl = new URL(window.location.href);
    if (flag) newUrl.searchParams.delete(flag);
    if (notice) newUrl.searchParams.delete("notice");
    router.replace(`${newUrl.pathname}${newUrl.search}`);
  }, [searchParams, router]);

  return null;
};

export default LoginSuccessToast;
