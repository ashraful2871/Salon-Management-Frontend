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

const LoginSuccessToast = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const flag = Object.keys(FLAGS).find(
      (key) => searchParams.get(key) === "true",
    );
    if (!flag) return;

    const { message, variant } = FLAGS[flag];
    toast[variant](message);

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete(flag);
    router.replace(`${newUrl.pathname}${newUrl.search}`);
  }, [searchParams, router]);

  return null;
};

export default LoginSuccessToast;
