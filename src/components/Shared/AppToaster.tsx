"use client";

import { Toaster } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function AppToaster() {
  const desktop = useMediaQuery("(min-width: 768px)");

  return (
    <Toaster
      position={desktop ? "bottom-right" : "top-center"}
      visibleToasts={3}
      richColors
      toastOptions={{
        classNames: {
          toast: "rounded-2xl border border-border shadow-elevated",
        },
      }}
    />
  );
}
