"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/** Maps the one-shot query flag a server-action redirect leaves behind to its toast. */
const FLAGS: Record<string, string> = {
  loggedIn: "Login successful!",
  registered: "Welcome! Your account is ready.",
};

const LoginSuccessToast = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const flag = Object.keys(FLAGS).find(
      (key) => searchParams.get(key) === "true",
    );
    if (!flag) return;

    toast.success(FLAGS[flag]);

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete(flag);
    router.replace(`${newUrl.pathname}${newUrl.search}`);
  }, [searchParams, router]);

  return null;
};

export default LoginSuccessToast;
