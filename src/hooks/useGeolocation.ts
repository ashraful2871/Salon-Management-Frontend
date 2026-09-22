"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export type GeolocationStatus =
  | "idle"
  | "locating"
  | "success"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unsupported";

export type Coords = { lat: number; lng: number };

export const GEOLOCATION_MESSAGES: Partial<Record<GeolocationStatus, string>> = {
  denied:
    "Location access is off. Turn it on in your browser settings, or search your area below.",
  unavailable: "We couldn't get your location. Try again, or search your area.",
  timeout: "We couldn't get your location. Try again, or search your area.",
  unsupported:
    "This browser can't share your location here. Search your area below.",
};

const OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 300000,
};

const noopSubscribe = () => () => {};

// geolocation only works on HTTPS or localhost, not http://192.168.x.x.
const getSupported = () =>
  "geolocation" in navigator && window.isSecureContext;

// Never asks on its own: the browser prompt only appears when `locate()` is
// called from a user action.
export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const supported = useSyncExternalStore(noopSubscribe, getSupported, () => true);

  // Detect an earlier denial up front, so the GPS button can be replaced by
  // instructions instead of silently doing nothing.
  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;
    let active = true;
    const onChange = () => {
      if (active && permissionStatus) setPermission(permissionStatus.state);
    };

    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((result) => {
        if (!active) return;
        permissionStatus = result;
        setPermission(result.state);
        result.addEventListener("change", onChange);
      })
      .catch(() => {});

    return () => {
      active = false;
      permissionStatus?.removeEventListener("change", onChange);
    };
  }, []);

  const locate = useCallback((): Promise<Coords | null> => {
    if (!getSupported()) {
      setStatus("unsupported");
      return Promise.resolve(null);
    }

    setStatus("locating");
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setStatus("success");
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setStatus(
            error.code === error.PERMISSION_DENIED
              ? "denied"
              : error.code === error.TIMEOUT
                ? "timeout"
                : "unavailable",
          );
          resolve(null);
        },
        OPTIONS,
      );
    });
  }, []);

  return {
    status,
    message: GEOLOCATION_MESSAGES[status],
    supported,
    deniedBefore: permission === "denied",
    locate,
  };
}
