"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** The async clipboard needs a secure context; a LAN or http build falls back to the selection copy. */
const writeClipboard = async (value: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  }
};

/**
 * Copy with a "Copied" toast and an `aria-live` message. `copied` is the key
 * of the last thing copied for 1.8 s, so a pair of buttons can each show a tick.
 * Render `announcement` inside an `aria-live="polite"` region.
 */
export function useCopy<K extends string>() {
  const [copied, setCopied] = useState<K | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async (key: K, value: string): Promise<boolean> => {
    const ok = await writeClipboard(value);
    if (!ok) {
      toast.error("Couldn't copy. Please select it and copy it yourself.");
      return false;
    }
    toast.success("Copied");
    setCopied(key);
    // A fresh string each time, so a second copy is announced too.
    setAnnouncement((prev) => (prev === "Copied" ? "Copied." : "Copied"));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1800);
    return true;
  };

  return { copy, copied, announcement };
}
