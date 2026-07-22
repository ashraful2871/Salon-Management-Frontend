"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const barRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    el.style.width = "100%";
    el.style.opacity = "1";

    timerRef.current = setTimeout(() => {
      if (el) {
        el.style.width = "0%";
        el.style.opacity = "0";
      }
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname, searchParams]);

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 z-[100] h-[3px] bg-gradient-to-r from-gold via-gold-light to-gold"
      style={{
        width: "0%",
        opacity: "0",
        transition: "width 0.3s ease-in-out, opacity 0.3s ease-in-out",
        boxShadow: "0 0 8px rgba(212, 175, 55, 0.5)",
      }}
    />
  );
}
