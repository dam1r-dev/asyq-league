import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** true только в браузере — для экранов, которые читают localStorage при старте. */
export function useIsClient() {
  return useSyncExternalStore(noop, () => true, () => false);
}
