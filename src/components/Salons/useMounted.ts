import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * False during the server render and hydration, true after. Anything that
 * reads the clock waits for it, so the server's time zone and the moment the
 * page was cached never leak into what the visitor sees.
 */
export const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
